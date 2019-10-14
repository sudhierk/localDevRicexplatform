import { connect } from 'react-redux';
import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { withRouter, Link } from 'react-router-dom';
import { push } from 'react-router-redux';
import { Layout } from '../index';
import { RegisterUser } from './register.user';
import './register.css';
import { RegisterCompany } from './register.company';
import { AccountApi } from '../../../services';
import logo from '../../../static/img/logo.png';
import { AppErrors } from '../../../app/components/errors';
import { LoadingRegisterData } from '../../../modules/module.loading';

const userError = ['registration_email_exist'];
const companyError = ['registration_company_name_exist'];

class RegisterClass extends Component {
    constructor(props) {
        super(props);
        this.validate = this.validate.bind(this);

        let user = {};
        let isEmpty = value => !value || value === undefined || value === '';
        let isEmail = value => {
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return !re.test(String(value).toLowerCase());
        };

        this.initField(user, 'firstName', 'First Name', '', isEmpty);
        this.initField(user, 'lastName', 'Last Name', '', isEmpty);
        this.initField(user, 'companyRole', 'Company Role', '', isEmpty);
        this.initField(user, 'phone', 'Phone', '', isEmpty);
        this.initField(user, 'email', 'Email', '', isEmail);
        this.initField(user, 'confirmEmail', 'Confirm Email', '', isEmail);

        let company = {};
        this.initField(company, 'name', 'Company Name', '', isEmpty);
        this.initField(company, 'site', 'Web Site', '', '');
        this.initField(company, 'companyType', 'Company Type', '', isEmpty);
        this.initField(company, 'country', 'Country', '', isEmpty);
        this.initField(company, 'taxNumber', 'Tax Number', '', isEmpty);
        this.initField(company, 'city', 'City or Town', '', isEmpty);
        this.initField(company, 'address1', 'Address line 1', '', isEmpty);
        this.initField(company, 'address2', 'Address line 2', '', '');
        this.initField(company, 'phone', 'Phone', '', isEmpty);
        this.initField(company, 'contactPerson', 'Contact Person', '');

        this.state = {
            step: 0,
            user: user,
            company: company,
            required: null,
            serverError: '',
            showGreetings: false
        };
    }

    initField(state, name, label, value, required) {
        state[name] = {
            value: value,
            required: required,
            label: label
        };
        return state;
    }

    componentDidMount() {
    }

    setUserField(name, value) {
        let user = this.state.user;
        let field = user[name];
        field.value = value;
        this.setState({user, required: null});
    }

    setCompanyField(name, value) {
        if (name !== '') {
            let regExp = /^[0-9\-\+\(\)]*$/;
            let company = this.state.company;
            let field = company[name];
            field.value = value;
            this.setState({company: company, required: null});
        }
    }

    validate(container) {
        let required = {};
        Object.keys(container).map(key => {
            let v = container[key];
            if (v && v.required && v.required(v.value)) {
                required[key] = v;
            }
            return false;
        });
        if (container.email && container.email.value !== container.confirmEmail.value) {
            required.confirmEmail = container.confirmEmail;
            required.email = container.email;
        }
        if (Object.keys(required).length > 0) {
            this.setState({required: required});
            return false;
        }

        return true;
    }

    getStateValue(container) {
        let result = {};
        Object.keys(container).map(key => {
            result[key] = container[key].value;
            return false;
        });
        return result;
    }

    submit() {
        this.props.LoadingRegisterData(true);
        AccountApi.register({
            user: this.getStateValue(this.state.user),
            company: this.getStateValue(this.state.company)
        })
            .then(() => {
                this.props.LoadingRegisterData(false);
                this.setState({
                    showGreetings: true
                });
                // this.props.navigate("/");
            })
            .catch(error => {
                if (userError.includes(error.response.data.status)) {
                    this.setState({
                        step: 0
                    });
                }
                this.props.LoadingRegisterData(false);
                this.setState({
                    serverError: AppErrors[error.response.data.status]
                });
            });
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.login();
        }
    }

    render() {
        // let firstActive = this.state.step === 0 ? "register-step_active" : "";
        return (
            <Layout {...this.props}>
                <div className="register">
                    <ul className="account-tabs">
                        <li className="account-tab">
                            <Link to="/account/login" className="account-link">
                                Login
                            </Link>
                        </li>
                        <li className="account-tab active">Registration</li>
                    </ul>
                    {this.state.showGreetings ? (
                        <div className="user-greetings">
                            <h3 className="text-lg">
                                Please check your e-mail to find confirmation of your registration. Please keep your password secure.
                            </h3>
                            <Link className="fp-link login-forgot" to="/">
                                Sign In
                            </Link>
                        </div>
                    ) : (
                        <div className="register-wrapper">
                            <div className="register-steps">
                                <div className="register-logo">
                                    <img src={logo} alt="Rice exchange logo"/>
                                </div>

                                <div
                                    className={
                                        'register-step register-step_first ' + (this.state.step === 0 ? 'register-step_active' : '')
                                    }
                                >
                                    User registration
                                </div>
                                <div
                                    className={
                                        'register-step register-step_second ' + (this.state.step === 1 ? 'register-step_active' : '')
                                    }
                                >
                                    Company registration
                                </div>
                            </div>
                            <div className="row">
                                <ul className="errors">{this.state.serverError &&
                                <li>{this.state.serverError}</li>}</ul>

                                {this.state.step === 0 ? (
                                    <RegisterUser
                                        state={this.state.user}
                                        setField={(name, value) => this.setUserField(name, value)}
                                        validation={this.state.required}
                                        onNext={e => {
                                            e.preventDefault();
                                            if (this.validate(this.state.user)) {
                                                this.setState({step: 1});
                                            }
                                        }}
                                    />
                                ) : (
                                    <RegisterCompany
                                        isRegistering={this.props.loading}
                                        state={this.state.company}
                                        setField={(name, value) => this.setCompanyField(name, value)}
                                        validation={this.state.required}
                                        onComplete={e => {
                                            e.preventDefault();
                                            if (this.validate(this.state.company)) {
                                                this.submit();
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        );
    }
}

const mapStateToProps = state => ({
    account: state.account,
    loading: state.loading.registerLoading,
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: () => push('/'),
            LoadingRegisterData
        },
        dispatch
    );

export const Register = compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(RegisterClass);
