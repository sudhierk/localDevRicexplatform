import React, {Component} from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import './forgot.css';
import {withRouter, Link} from 'react-router-dom';
import {Layout} from "../index";

import logo from '../../../static/img/logo.png';

class ForgotPasswordSentComponent extends Component {
    state = {
        email: ''
    };

    render() {
        return (
            <Layout {...this.props}>
                <div className="forgot-container">
                    <div className="content-fp">
                        <React.Fragment>
                            <ul className="account-tabs forgot-tab">
                                <li className="account-tab active">
                                    Forgot Password?
                                </li>
                            </ul>
                            <p className="forgot-text">
                                <img className="forgot-logo" src={logo} alt="Rice exchange logo"/>
                                Success! Check your Email, we send you link for restore
                                password!
                            </p>
                            <div className="action-block">
                                <div className="form-group">
                                    <Link to={'/account/login'} className="fp-link">
                                        Sign in
                                    </Link>
                                </div>
                            </div>
                        </React.Fragment>
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
export const ForgotPasswordSent = compose(
    withRouter,
    connect(mapStateToProps, {})
)(ForgotPasswordSentComponent);
