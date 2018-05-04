// @flow
import { observable, action, computed, reaction, runInAction } from 'mobx';
import localStorage from '~/utils/local-storage';
import { getNewPasswordCreationPagePathForBackend } from '~/pages/paths';
import type { IApi } from '~/api/types';
import type {
  AuthToken,
  Email,
  UserId,
  AuthParams,
  PasswordRecoveryParams,
} from '~/types/auth';
import type { IAuth, IAuthToken } from './types';

export class AuthStore implements IAuth {
  api: IApi;
  token: IAuthToken;

  @observable email = localStorage.getItem('email') || '';
  @observable id = localStorage.getItem('id') || '';
  @observable isRegistered = false;
  @observable isPasswordReset = false;
  @observable isNewPasswordCreated = false;
  @observable isLoading = false;
  @observable
  errors = {
    email: '',
    password: '',
    confirmationPassword: '',
    common: '',
  };

  @computed
  get isAuthenticated(): boolean {
    return this.token.value !== null;
  }

  makeSaveReaction = (getter: () => ?string, name: string) => {
    reaction(getter, (value: ?string) => {
      if (value) {
        localStorage.setItem(name, value);
      } else {
        localStorage.removeItem(name);
      }
    });
  };

  constructor({ api, authToken }: { api: IApi, authToken: IAuthToken }) {
    this.api = api;
    this.token = authToken;

    this.makeSaveReaction(() => this.email, 'email');
    this.makeSaveReaction(() => this.id, 'id');
  }

  @action
  setId = (id: UserId) => {
    this.id = id;
  };

  @action
  setToken = (token: AuthToken) => {
    this.token.set(token);
  };

  @action
  setEmail = (email: Email) => {
    this.email = email;
  };

  @action
  login = ({ email, password }: AuthParams) => {
    this.resetErrors();
    this.logout();
    this.isLoading = true;

    return this.api.auth
      .login({ email, password })
      .then(({ data }) => {
        runInAction(() => {
          this.isLoading = false;
          this.token.set(data.token);
          this.email = email;
          this.id = data.id;
        });
        return { success: true };
      })
      .catch(({ response }) => {
        const { fieldErrors, reason } = response.data || {};

        runInAction(() => {
          this.isLoading = false;

          if (fieldErrors) {
            this.errors.email = (fieldErrors.username || []).pop() || '';
            this.errors.password = (fieldErrors.password || []).pop() || '';
          } else if (reason) {
            this.errors.common = reason;
          }
        });

        return { success: false };
      });
  };

  @action
  register = ({ email }: AuthParams) => {
    this.resetErrors();
    this.isLoading = true;

    return this.api.auth
      .register({ email })
      .then(() => {
        runInAction(() => {
          this.isLoading = false;
          this.isRegistered = true;
        });
      })
      .catch(({ response }) => {
        const fieldErrors =
          response && response.data && response.data.fieldErrors;

        runInAction(() => {
          this.isLoading = false;

          if (fieldErrors) {
            const error = !Array.isArray(fieldErrors.email)
              ? [fieldErrors.email]
              : fieldErrors.email;

            this.errors.email = error.join('; ');
          }
        });
      });
  };

  @action
  resetPassword = ({ email }: AuthParams) => {
    this.isLoading = true;

    return this.api.auth
      .resetPassword({
        email,
        passwordRestorationPagePath: getNewPasswordCreationPagePathForBackend(),
      })
      .then(() => {
        runInAction(() => {
          this.isLoading = false;
          this.isPasswordReset = true;
        });
      })
      .catch(({ response }) => {
        runInAction(() => {
          this.isLoading = false;
          const { genericErrors } = response.data || {};

          if (genericErrors) {
            this.errors.common = (genericErrors || []).pop() || '';
          }
        });
      });
  };

  @action
  createNewPassword = ({
    token,
    password,
    confirmationPassword,
  }: PasswordRecoveryParams) => {
    this.isLoading = true;
    this.isPasswordReset = false;

    return this.api.auth
      .createNewPassword({ token, password, confirmationPassword })
      .then(() => {
        runInAction(() => {
          this.isLoading = false;
          this.isNewPasswordCreated = true;
        });
      })
      .catch(({ response }) => {
        const { fieldErrors, reason, genericErrors } = response.data || {};

        runInAction(() => {
          this.isLoading = false;

          if (fieldErrors) {
            this.errors.password = (fieldErrors.password || []).pop() || '';
            this.errors.confirmationPassword =
              (fieldErrors.password2 || []).pop() || '';
          } else if (reason) {
            this.errors.common = reason;
          }

          if (genericErrors) {
            this.errors.common = (genericErrors || []).pop() || '';
          }
        });
      });
  };

  @action
  resetErrors = () => {
    this.errors.email = '';
    this.errors.password = '';
    this.errors.confirmationPassword = '';
    this.errors.common = '';
  };

  @action
  resetRegistrationData = () => {
    this.isRegistered = false;
  };

  @action
  logout = () => {
    this.email = '';
    this.id = '';
    this.token.reset();
  };
}

export function authProvider(api: IApi, authToken: IAuthToken): AuthStore {
  if (!api || !authToken) {
    throw new TypeError('Required parameters are missing at authProvider');
  }

  return new AuthStore({ api, authToken });
}