import React, { Component } from 'react';
import { connect } from 'react-redux';
import './forgot.css';
import { withRouter, Link } from 'react-router-dom';
import { Layout } from '../index';
import { push } from 'react-router-redux';
import { bindActionCreators, compose } from 'redux';
import logo from '../../../static/img/logo.png';
import { updatePassword, ValidateChangePasswordCode } from '../../../modules/module.account';
import Preloader from '../../components/preloader/Preloader';
import GenerateKeys from '../generate-keys/GenerateKeys';

class UpdatePasswordComponent extends Component {
    state = {
        data: {
            password: '',
            repassword: ''
        },
        keys: null,
        keysSaved: false,
        errors: {}
    };

    componentWillMount() {
        this.validateCode();
    }

    validateCode = () => {
        this.props.ValidateChangePasswordCode(this.props.match.params.code, response => {
            if (!response || !response.canConfirm) {
                this.props.navigate('/');
            }
        });
    };

    handleChangeInput = e => {
        this.setState({data: {...this.state.data, [e.target.name]: e.target.value}});
    };

    handleSubmit = () => {
        const errors = this.validate(this.state.data);
        this.setState({errors});
        const {password, repassword} = this.state.data;
        if (Object.keys(errors).length === 0) {
            const data = {
                password
            };
            if (!this.isReset && this.state.keys && this.state.keys.publicKey) {
                data.publicKey = this.state.keys.publicKey;
            }
            this.props.updatePassword(this.props.match.params.code, data, d => {
                if (d !== null) {
                    this.props.navigate('/');
                }
            });
        }
    };

    validate(data) {
        const errors = {};
        let {password, repassword} = this.state.data;

        if (password.length < 6 || repassword.length < 6)
            errors['password'] = `Your password must be at least 6 characters long. Please try another`;
        if (password !== repassword) errors['password'] = `passwords doesn't match.`;

        for (let key in data) {
            if (data[key].length === 0) errors[key] = `${key} is required.`;
        }
        return errors;
    }

    renderUpdatePassword() {
        return (
            <React.Fragment>
                {!this.props.allowRestorePassword ? (
                    <React.Fragment>
                        <ul className="account-tabs forgot-tab">
                            <li className="account-tab active">Accepting password!</li>
                        </ul>
                        <p className="forgot-text">
                            <img className="forgot-logo" src={logo} alt="Rice exchange logo"/>
                            Please enter your password.
                            <ul className="errors">
                                {this.state.errors.password && <li>{this.state.errors.password} </li>}
                                {this.state.errors.repassword && <li>{this.state.errors.repassword} </li>}
                            </ul>
                        </p>

                        <div className="action-block">
                            <div className="form-input">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className={`input input_higher forgot-input ${this.state.errors.password &&
                                    'input_error'}`}
                                    id="password"
                                    name="password"
                                    onChange={this.handleChangeInput}
                                />
                            </div>

                            <div className="form-input">
                                <input
                                    type="password"
                                    placeholder="Confirm password"
                                    className={`input input_higher forgot-input ${this.state.errors.password &&
                                    'input_error'}`}
                                    id="confirmPassword"
                                    name="repassword"
                                    onChange={this.handleChangeInput}
                                />
                            </div>
                            <Link to={'/account/login'} className="forgot-link">
                                Back to Sign in
                            </Link>
                        </div>

                        <button className="btn btn--blue forgot-send" onClick={this.handleSubmit}>
                            <Preloader loading={this.props.loading} style="dots">
                                Save Password
                            </Preloader>
                        </button>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <h3 className="text-lg">Success! Check your Email, we send you link for restore
                            password!</h3>
                    </React.Fragment>
                )}
            </React.Fragment>
        )
    }

    handleKeysSaved = () => {
        this.setState(prevState => ({
            ...prevState,
            keysSaved: true
        }))
    };

    handleKeysGenerated = (publicKey, privateKey) => {
        this.setState(prevState => ({
            ...prevState,
            keys: {
                publicKey,
                privateKey
            }
        }))
    };

    renderGenerateKeys = () => {
        return (
            <GenerateKeys onGenerate={this.handleKeysGenerated} onSave={this.handleKeysSaved}/>
        )
    };

    render() {
        return (
            <Layout {...this.props}>
                <div className={`forgot-container${!this.props.updatePasswordCodeValid ? ' forgot-container--loading' : ''}`}>
                    <Preloader loading={!this.props.updatePasswordCodeValid} style="spinner">
                        <div className="content-fp">
                            {!this.props.isReset && !this.state.keysSaved ? this.renderGenerateKeys() : this.renderUpdatePassword()}
                        </div>
                    </Preloader>
                </div>
            </Layout>
        );
    }
}

const mapStateToProps = state => {
    return {
        allowRestorePassword: state.account.allow,
        loading: state.loading.requestPassword,
        updatePasswordCodeValid: state.account.updatePasswordCodeValid
    };
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: path => push(path),
            updatePassword,
            ValidateChangePasswordCode
        },
        dispatch
    );
export const UpdatePassword = compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(
    UpdatePasswordComponent
);
