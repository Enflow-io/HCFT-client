import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import Panel from '@daonomic/ui/source/panel';
import Select from '@daonomic/ui/source/select';
import Translation from '~/components/translation';
import Heading from '~/components/heading';
import textStyles from '~/components/text/text.css';
import styles from './payment-method.css';

const paymentMethodShape = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  address: PropTypes.string,
});

@observer
class PaymentMethod extends Component {
  static propTypes = {
    walletAddress: PropTypes.string.isRequired,
    selectedPaymentMethod: paymentMethodShape.isRequired,
    selectedPaymentMethodAddress: PropTypes.string,
    selectedPaymentMethodPayments: MobxPropTypes.arrayOrObservableArrayOf(
      PropTypes.shape({
        value: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
      }),
    ).isRequired,
    selectedPaymentMethodAddressQRCode: PropTypes.string,
    paymentMethods: MobxPropTypes.observableArrayOf(paymentMethodShape)
      .isRequired,
    onChangePaymentMethod: PropTypes.func.isRequired,
  };

  static defaultProps = {
    selectedPaymentMethodAddress: '',
    selectedPaymentMethodAddressQRCode: '',
  };

  handleChangePaymentMethod = (event) => {
    this.props.onChangePaymentMethod(event.target.value);
  };

  renderPaymentMethodsSelect = () => {
    const { paymentMethods, selectedPaymentMethod } = this.props;
    const selectId = 'payment-method';

    return (
      <div className={styles.select}>
        <label className={styles.label} htmlFor={selectId}>
          <Translation id="paymentMethods:wantToPayWith" />
        </label>

        <Select
          id={selectId}
          value={selectedPaymentMethod.id}
          onChange={this.handleChangePaymentMethod}
        >
          {paymentMethods.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    );
  };

  renderSelectedPaymentMethodAddress = () => {
    const { selectedPaymentMethod, selectedPaymentMethodAddress } = this.props;

    if (
      this.props.selectedPaymentMethod &&
      this.props.selectedPaymentMethod.id === 'USD'
    ) {
      return (
        <div className={styles['payment-method-text']}>
          <p>Для покупки свяжжитесь с менеджером по телефону.</p>
          <p>
            В скором времени вы сможете купить токен HCFT любым удобным для Вас
            способом оплаты, в том числе и банковской картой. В настоящее время
            идут тестирования платежной системы банка-партнера.
          </p>
          <p>
            Но купить токены HCFT за USD (Доллар США) Вы можете уже сегодня,
            позвоните нам по указанному номеру или Е-майл:
          </p>
          <p>
            <span>Тел: 8 495 118 33 22</span>
            <span>E-mail: investor@haritonov.capital</span>
          </p>

          <p>
            <span>Зарабатывайте вместо с нами!</span>
            <span>Следите за обновлениями.</span>
          </p>

          <p>
            <span>С уважение, Харитонов Максим</span>
            <span>Генеральный директор.</span>
          </p>
        </div>
      );
    }

    if (!selectedPaymentMethodAddress) {
      return `${Translation.text('loading')}...`;
    }

    return (
      <div className={styles['payment-method-address']}>
        {this.renderQRCode()}
        <div>
          <Translation
            id="paymentMethods:sendFundsTo"
            data={{
              paymentMethod: selectedPaymentMethod.label,
            }}
          />
          <div className={textStyles['word-break-all']}>
            {selectedPaymentMethodAddress}
          </div>
        </div>
      </div>
    );
  };

  renderQRCode = () => {
    const { selectedPaymentMethodAddressQRCode } = this.props;

    if (!selectedPaymentMethodAddressQRCode) {
      return null;
    }

    return (
      <img
        className={styles.qrcode}
        src={selectedPaymentMethodAddressQRCode}
        alt="qrcode"
      />
    );
  };

  renderSelectedPaymentMethodPayments = () => {
    const { selectedPaymentMethod, selectedPaymentMethodPayments } = this.props;

    if (selectedPaymentMethodPayments.length === 0) {
      return null;
    }

    return (
      <Fragment>
        <Heading tagName="h3" size="small">
          <Translation id="paymentMethods:statusesTitle" />
        </Heading>

        {selectedPaymentMethodPayments.map((payment) => (
          <div key={payment.id}>
            {payment.value} {selectedPaymentMethod.id},{' '}
            <Translation
              id={`paymentMethods:${this.renderPaymentStatus(payment)}`}
            />
          </div>
        ))}

        <Panel.Separator />
      </Fragment>
    );
  };

  renderInstruction = () => {
    const { walletAddress } = this.props;

    return (
      <Fragment>
        <Heading tagName="h3" size="small">
          <Translation id="paymentMethods:instructionTitle" />
        </Heading>

        <div>
          <Translation id="paymentMethods:instructionText" />
          <div className={textStyles['word-break-all']}>{walletAddress}</div>
        </div>
      </Fragment>
    );
  };

  renderPaymentStatus = (payment) => {
    switch (payment.status) {
      case 'COMPLETED': {
        return 'finished';
      }

      case 'ERROR': {
        return 'error';
      }

      default: {
        return 'pending';
      }
    }
  };

  render = () => (
    <Panel paddingSize="large">
      <Heading className={styles.title} tagName="h2" size="normal">
        <Translation id="paymentMethods:title" />
      </Heading>

      {this.renderPaymentMethodsSelect()}
      <Panel.Separator />
      {this.renderSelectedPaymentMethodAddress()}
      <Panel.Separator />
      {this.renderSelectedPaymentMethodPayments()}
      {this.renderInstruction()}
    </Panel>
  );
}

export default inject(({ payment, kyc }) => ({
  walletAddress: kyc.state.formData.get('address'),
  selectedPaymentMethod: payment.selectedMethod,
  selectedPaymentMethodAddress: payment.selectedMethodAddress,
  selectedPaymentMethodAddressQRCode: payment.state.selectedMethodAddressQRCode,
  selectedPaymentMethodPayments: payment.selectedMethodPayments,
  paymentMethods: payment.state.methods,
  onChangePaymentMethod: payment.setMethod,
}))(PaymentMethod);
