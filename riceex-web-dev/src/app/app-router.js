import { history } from '../store';
import { Redirect, Route, Switch } from 'react-router-dom';
import withTracker from './components/withTracker';
import { ForgotPasswordSent } from './account/password/forgot.sent';
import { Login } from './account';
import { Register } from './account/register/register';
import { UpdatePassword } from './account/password/update.passowrd';
import { ForgotPassword } from './account/password/forgot';
import RequestDetails from './admin/requests/requests.details';
import Exchange from './admin/exchange/exchange';
import CreateRequest from './admin/requests/requests.create';
import Requests from './admin/requests/requests';
import TradesDetails from './admin/trades/trades.details';
import Trades from './admin/trades/trades';
import Profile from './admin/profile/profile';
import CompanyProfile from './admin/company-profile/company-profile';
import { ConnectedRouter } from 'react-router-redux';
import React, { Component } from 'react';
import AccessControl, { INSPECTION_COMPANY } from './components/AccessControl';
import { UserTypes } from '../utils/userTypes';
import PlatformAdminDashboard from './platform-admin/dashboard/dashboard';
import Dashboard from './admin/dashboard';

const defaultAccessControl = {
    excludeCompanyTypes: [INSPECTION_COMPANY],
    excludeUserTypes: [UserTypes.PLATFORM_ADMIN],
    renderNoAccess: <Redirect to={{pathname: '/trades'}}/>
};

const tradesAccessControl = {
    excludeUserTypes: [UserTypes.PLATFORM_ADMIN],
    renderNoAccess: <Redirect to={{pathname: '/'}}/>
};

function getDashboard(user) {
    if (user && user.userType === UserTypes.PLATFORM_ADMIN) {
        return withTracker(PlatformAdminDashboard);
    } else {
        return withTracker(Dashboard);
    }
}

const withSearch = (WrappedComponent) => {
    return class extends Component {
        render() {
            return <WrappedComponent locationSearch={window.location.search} {...this.props} />
        }
    }
};

function ProtectedRoute({component: Component, accessControl = {}, user, ...rest}) {
    return (
        <Route
            {...rest}
            render={props => (
                <AccessControl
                    user={user}
                    {...accessControl}
                >
                    <Component {...props} />
                </AccessControl>
            )}
        />
    )
}

export const AppRouter = ({user}) => {
    return (
        <ConnectedRouter history={history}>
            <Switch>
                <Route path="/account/forgot/success" component={withTracker(ForgotPasswordSent)}/>
                <Route path="/account/login" component={withTracker(Login)}/>
                <Route path="/account/register" component={withTracker(Register)}/>
                <Route path="/account/accept/:code" component={withTracker(UpdatePassword)}/>
                <Route path="/account/reset/:code" render={() => <UpdatePassword isReset={true} />}/>
                <Route path="/account/forgot" component={withTracker(ForgotPassword)}/>

                {user !== undefined && !user && <Redirect to="/account/login"/>}

                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/exchange/details/:id" component={withTracker(RequestDetails)}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/exchange" component={withTracker(Exchange)}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/requests/details/:id" component={withTracker(withSearch(RequestDetails))}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/requests/create" component={withTracker(CreateRequest)}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/requests/update/:id" component={withTracker(CreateRequest)}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/requests" component={withTracker(Requests)}/>
                <ProtectedRoute user={user} accessControl={tradesAccessControl} path="/trades/details/:id" component={withTracker(withSearch(TradesDetails))} />
                <ProtectedRoute user={user} accessControl={tradesAccessControl} path="/trades" component={withTracker(Trades)}/>
                <ProtectedRoute user={user} accessControl={{...defaultAccessControl, excludeUserTypes: []}} exact path="/" component={getDashboard(user)}/>
                <ProtectedRoute user={user} path="/profile" component={withTracker(Profile)}/>
                <ProtectedRoute user={user} accessControl={defaultAccessControl} path="/company-profile" component={withTracker(CompanyProfile)}/>
            </Switch>
        </ConnectedRouter>
    )
};
