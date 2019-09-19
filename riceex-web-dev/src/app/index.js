import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactGA from 'react-ga';
import { authorize } from '../modules/module.account';
import { AccountApi } from '../services';

//components
import { ErrorModal } from './components/ErrorModal';
import { hideErrorModal } from '../modules/module.app';
import { AppRouter } from './app-router';

import './index.css';


class App extends Component {
    componentDidMount() {
        this.props.authorize(AccountApi.token());
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const userId = this.props.user && this.props.user.id;
        const prevUserId = prevProps.user && prevProps.user.id;
        // when app is loaded initialize analytics
        if (!prevUserId && userId) {
            this.initializeGoogleAnalytics();
        }
    }

    initializeGoogleAnalytics() {
        const trackingId = process.env.REACT_APP_TRACKING_ID;
        if (!trackingId) {
            return;
        }
        ReactGA.initialize(trackingId, {debug: process.env.NODE_ENV === 'development'});
        ReactGA.set({userId: this.props.user.id});
    }

    render() {
        return this.props.app.isBusy ? (
            <div>
                <p>Loading...</p>
            </div>
        ) : (
            <div className="app">
                {this.props.app.errorModal.show &&
                <ErrorModal content={this.props.app.errorModal.content} onClose={this.props.hideErrorModal}/>}
                {this.props.user && this.props.user.name && (
                    <a
                        className="app-help-floating"
                        href={`mailto:customersupport@ricex.io?subject=${this.props.user.name}, ${this.props.user.companyName} is requesting help`}>
                        Help
                    </a>
                )}
                <AppRouter user={this.props.user}/>
            </div>
        );
    }
}


const mapStateToProps = state => ({
    user: state.account.user,
    app: state.app,
    loading: state.loading.isLoading
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            authorize,
            hideErrorModal
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(App);
