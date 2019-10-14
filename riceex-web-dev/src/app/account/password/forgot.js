import React, {Component} from 'react';
import {connect} from 'react-redux';
import './forgot.css';
import {withRouter, Link} from 'react-router-dom';
import {AccountApi} from "../../../services";
import {Layout} from "../index";
import {push} from "react-router-redux";

import {bindActionCreators, compose} from 'redux';
import { AppErrors } from "../../../app/components/errors";

import logo from '../../../static/img/logo.png';

class ForgotPasswordComponent extends Component {
  state = {
    data: {
      email: ''
    },
    errors: {}
  };

  validate(data) {
    const regexEmail = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;
    const errors = {};

    if (regexEmail.test(data.email) === false) {
      errors["email"] = "Incorrect email";
    }

    if (data.email.length === 0) {
      errors["email"] = "Email is require.";
    }

    return errors;
  }


  handleSubmit = (e) => {
    e.preventDefault();
    const errors = this.validate(this.state.data);
    this.setState({errors});

    if (Object.keys(errors).length === 0) {
      this.sendRequest();
    }
  }

  sendRequest = () => {
    AccountApi.forgot({email: this.state.data.email}).then(() => {
      this.props.navigate('/account/forgot/success')
    }).catch(error => {
      this.setState({
        serverError: AppErrors[error.response.data.status]
      })
    })
  }

  render() {
    const serverError = this.state.serverError
    return (
      <Layout {...this.props}>
        <div className="forgot-container">
          <div className="content-fp">
            {!this.props.allowRestorePassword ? (
              <React.Fragment>
                <ul className="account-tabs forgot-tab">
                  <li className="account-tab active">
                    Forgot Password?
                  </li>
                </ul>


                <p className="forgot-text">
                  <img className="forgot-logo" src={logo} alt="Rice exchange logo"/>
                  Please enter Email address to reset your password.
                  <br/>
                  You will receive an email with instructions on how to reset your password.

                  <ul className="errors">
                    {serverError && <li>{serverError} </li>}
                    {this.state.errors.email && <li>{this.state.errors.email} </li>}
                  </ul>
                </p>
                <div className="action-block">
                  <div className="form-input">
                    <input
                      type="email"
                      placeholder="Email"
                      className={`input input_higher forgot-mail ${(this.state.errors.email || serverError) && "input_error" }`}
                      id="email"
                      onChange={input => {
                        this.setState({data : {email: input.target.value}});
                      }}
                    />
                    <Link to={'/account/login'} className="forgot-link">
                      Back to Sign in
                    </Link>
                  </div>
                </div>
                <button
                  className="btn btn--blue forgot-send"
                  onClick={this.handleSubmit}
                >
                  Request New Password
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <h3 className="text-lg">
                  Success! Check your Email, we send you link for restore
                  password!
                </h3>
              </React.Fragment>
            )}
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = state => {
  return {
    allowRestorePassword: state.account.allow
  };
};
const mapDispatchToProps = dispatch =>
  bindActionCreators({
      navigate: (path) => push(path)
    },
    dispatch
  );

export const ForgotPassword = compose(
  withRouter,

  connect(mapStateToProps, mapDispatchToProps)
)(ForgotPasswordComponent);
