import { connect } from "react-redux";
import React, { Component } from "react";
import { bindActionCreators, compose } from "redux";
import { withRouter, Link } from "react-router-dom";
import { push } from "react-router-redux";
import { Layout } from "../index";
import { login } from "../../../modules/module.account";
import "./login.css";
import logo from "../../../static/img/logo_login.png";

import FaEnvelopeO from "react-icons/lib/fa/envelope-o";
import FaLock from "react-icons/lib/fa/lock";
import Preloader from "../../components/preloader/Preloader";

class LoginClass extends Component {
  state = {
    data: {
      email: "",
      password: ""
    },
    errors: []
  };

  componentWillMount() {
    if (this.props.account.user) {
      this.props.navigate("/");
    }
  }

  handleChangeInput = e => {
    this.setState({ data: { ...this.state.data, [e.target.name]: e.target.value } });
  };

  validate(data) {
    const regexEmail = /^([A-Za-z0-9_\-.+-])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;
    const errors = {};

    if (regexEmail.test(data.email) === false) {
      errors["email"] = "Incorrect email";
    }

    for (let key in data) {
      if (data[key].length === 0) errors[key] = `${key} is required.`;
    }

    return errors;
  }

  handleSubmit = e => {
    e.preventDefault();
    const errors = this.validate(this.state.data);
    this.setState({ errors });

    if (Object.keys(errors).length === 0) {
      this.login();
      // console.log(this.props.account.error.errors);
    }
  };

  login = () => {
    this.props.login(this.state.data, d => {
      if (d !== null) {
        this.props.navigate("/");
      }
    });
  };

  render() {
    const serverError = this.props.account.error.errors;
    return (
      <Layout {...this.props} className="login-container">
        <div className="login">
          <ul className="account-tabs">
            <li className="account-tab active">Login</li>
            <li className="account-tab">
              <Link to="/account/register" className="account-link">
                Registration
              </Link>
            </li>
          </ul>

          <div className="login-wrapper">
            <div className="col-12 login-logo">
              <img src={logo} alt="Rice exchange logo" />
            </div>

            <p className="login-text">Please enter Email address and Password to sign in</p>

            <ul className="errors">
              {serverError && <li>{serverError} </li>}
              {this.state.errors.email && <li>{this.state.errors.email} </li>}
              {this.state.errors.password && <li>{this.state.errors.password} </li>}
            </ul>

            <div className="form-container">
              <form onSubmit={this.handleSubmit}>
                <div className="form-input login-input-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    className={`input input_higher ${(this.state.errors.email || serverError) &&
                      "input_error"}`}
                    onChange={this.handleChangeInput}
                  />

                  <FaEnvelopeO className="login-input-icon" />
                </div>

                <div className="form-input login-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    className={`input input_higher ${(this.state.errors.password || serverError) &&
                      "input_error"}`}
                    onChange={this.handleChangeInput}
                  />
                  <FaLock className="login-input-icon" />
                </div>

                <div className="form-group" style={{ textAlign: "right" }}>
                  <p>
                    <Link to="/account/forgot" className="fp-link login-forgot">
                      Forgot Password?
                    </Link>
                  </p>
                  <button type="submit" className="btn btn--blue" onClick={this.handleSubmit}>
                    <Preloader style="dots" loading={this.props.loading}>
                      <span>Login</span> to the platform
                    </Preloader>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = state => ({
  account: state.account,
  loading: state.loading.isLoading
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      login,
      navigate: path => push(path)
    },
    dispatch
  );

export const Login = compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(LoginClass);
