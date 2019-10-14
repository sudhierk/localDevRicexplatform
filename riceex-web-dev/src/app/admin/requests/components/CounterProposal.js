import React, { Component } from 'react';
import FormInputField from '../../../components/form/FormInputField';
import scrollToElement from 'scroll-to-element';
import './counter.css';

class CounterProposal extends Component {
    state = {
        request: {},
        required: {},
        initiated: false
    };

    componentDidMount() {
        this.initializeForm();
    }

    isEmpty = value => !value || value === undefined || value === '';

    initializeForm() {
        const priceToCounter = this.props.bid && this.props.bid.price ? this.props.bid.price : this.props.trade.price;
        this.initField('price', 'Price', priceToCounter, this.isEmpty);
        this.setState({initiated: true});
    }

    setField = (name, value) => {
        let request = this.state.request;
        request[name] = {
            ...request[name],
            value: value
        };
        this.setState({
            request: request
        });
    };

    validate(container) {
        let required = {};
        Object.keys(container).map(key => {
            let v = container[key];

            if (v && v.required && v.required(v.value)) {
                required[key] = v;
            }
            return false;
        });
        if (this.state.value !== '' && this.state.counterparty === '') {
            required.counterparty = this.state.request.counterparty;
        }
        if (Object.keys(required).length > 0) {
            this.setState({required: required}, () => {
                scrollToElement('.input_error', {
                    offset: -130,
                    ease: 'inOutQuad',
                    duration: 600
                });
            });
            return false;
        }
        return true;
    }

    getStateValue(container) {
        let result = {};
        Object.keys(container).map(key => {
            switch (key) {
                case 'price':
                case 'measure':
                    result[key] = parseFloat(container[key].value);
                    break;
                case 'inspection':
                    result[key] = container[key].value ? Number(container[key].value) : null;
                    break;
                case 'validateDate':
                    result[key] = container[key].value.unix();
                    break;
                case 'deliveryStartDate':
                case 'deliveryEndDate':
                    result[key] = container[key].value.format();
                    break;
                default:
                    result[key] = container[key].value;
                    break;
            }
            return false;
        });

        return result;
    }

    initField(name, label, value, required) {
        this.setState(prevState => ({
            ...prevState,
            request: {
                ...prevState.request,
                [name]: {
                    name: name,
                    label: label,
                    required: required,
                    value: value,
                    disabled: false
                }
            }
        }));
    }

    submit = e => {
        e.preventDefault();
        if (this.validate(this.state.request)) {
            this.props.onSubmit(this.getStateValue(this.state.request));
        }
    };

    render() {
        if (!this.state.initiated) {
            return null;
        }
        return (
            <div className="modal__container counter-request">
                <form
                    className="modal__wrapper"
                    onSubmit={this.submit}>
                    <span className="modal__close" onClick={this.props.onClose}/>
                    <h3 className="modal__heading">Counter Proposal</h3>
                    <div className="counter-form">
                        <div className="counter-form__item col-6">
                            <FormInputField
                                name={'price'}
                                validation={this.state.required}
                                value={this.state.request.price}
                                onChange={e => this.setField(e.target.name, e.target.value)}
                                placeholder="Price"
                                type="number"
                                max={9999999}
                            />
                        </div>
                    </div>
                    <div className="bottom-block">
                        <button type="submit" className="modal__button">
                            Send
                        </button>
                        <div className="cancel" onClick={this.props.onClose}>Cancel</div>
                    </div>
                </form>
            </div>
        );
    }
}

export default CounterProposal;
