import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observable, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { saveAs } from 'file-saver';
import cn from 'classnames';
import Button from '@daonomic/ui/source/button';
import Input from '@daonomic/ui/source/input';
import Panel from '@daonomic/ui/source/panel';
import Heading from '~/components/heading';
import textStyles from '~/components/text/text.css';
import styles from './create-wallet.css';
import Translation from '~/components/translation';

@inject(({ walletGenerator }) => ({
  isGenerating: walletGenerator.isGenerating,
  isGenerated: walletGenerator.isGenerated,
  progress: walletGenerator.progress,
  generatedWallet: walletGenerator.generatedWallet,
  encryptedWallet: walletGenerator.encryptedWallet,
  onRequestWalletGeneration: (password) =>
    walletGenerator.generate({ password }),
}))
@observer
export default class CreateWallet extends Component {
  static propTypes = {
    isGenerating: PropTypes.bool.isRequired,
    isGenerated: PropTypes.bool.isRequired,
    progress: PropTypes.number.isRequired,
    generatedWallet: PropTypes.shape({
      address: PropTypes.string.isRequired,
      privateKey: PropTypes.string.isRequired,
    }),
    encryptedWallet: PropTypes.string,
    onRequestWalletGeneration: PropTypes.func.isRequired,
  };

  static defaultProps = {
    generatedWallet: null,
    encryptedWallet: '',
  };

  @observable password = '';

  @action
  handleChangePassword = (event) => {
    this.password = event.target.value;
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onRequestWalletGeneration(this.password);
  };

  handleDownloadKeystore = (event) => {
    const { encryptedWallet } = this.props;

    saveAs(
      new Blob([encryptedWallet], {
        type: 'text/json;charset=utf-8',
      }),
      'wallet.json',
    );
    event.preventDefault();
  };

  renderForm = () => {
    const { isGenerating, isGenerated, progress } = this.props;

    if (isGenerated) {
      return null;
    }

    return (
      <form className={styles.form} onSubmit={this.handleSubmit}>
        <div className={styles.password}>
          <Input
            required
            minLength="6"
            label={Translation.text('wallet:password')}
            disabled={isGenerating}
            value={this.password}
            onChange={this.handleChangePassword}
          />
        </div>

        <p className={styles.paragraph}>
          <Translation id="wallet:passwordMessage" />
        </p>

        <div className={styles.controls}>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating
              ? `${Math.round(progress * 100)}%`
              : Translation.text('wallet:create')}
          </Button>
        </div>
      </form>
    );
  };

  renderGeneratedWallet = () => {
    const { isGenerated, generatedWallet, encryptedWallet } = this.props;

    if (!isGenerated) {
      return null;
    }

    const data = [
      {
        label: Translation.text('wallet:address'),
        value: generatedWallet.address,
      },
      {
        label: Translation.text('wallet:privateKey'),
        value: generatedWallet.privateKey,
      },
      {
        label: Translation.text('wallet:password'),
        value: generatedWallet.password,
      },
    ];

    return (
      <div className={styles.result}>
        {data.map(({ label, value }) => (
          <p key={label} className={styles.paragraph}>
            <b>{label}</b>
            <span
              className={cn(textStyles.block, textStyles['word-break-all'])}
            >
              {value}
            </span>
          </p>
        ))}

        <div className={styles.controls}>
          <Button
            tagName="a"
            download="wallet.json"
            href={`data:text/json;charset=utf-8,${encodeURIComponent(
              encryptedWallet,
            )}`}
            onClick={this.handleDownloadKeystore}
          >
            {Translation.text('wallet:downloadKeystore')}
          </Button>
        </div>
      </div>
    );
  };

  render = () => (
    <Panel paddingSize="large">
      <Heading tagName="h1" size="normal" className={styles.title}>
        {Translation.text('wallet:createWallet')}
      </Heading>

      {this.renderForm()}
      {this.renderGeneratedWallet()}
    </Panel>
  );
}