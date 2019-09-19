import React from 'react';
import {Redirect, Route} from 'react-router-dom';
import {connect} from 'react-redux';

const AuthRoute = ({component, ...props}) => {
    // console.log("auth route", props.app, props.user)
    if (!props.user) {
        return <Redirect to="/account/login"/>;
    }
    // let permission = Permissions.For(props.authorized, props.domain, props.action)
    // if (!permission.Granted) {
    //     console.log("Not granted to see this content", props.authorized, props.domain, props.action)
    //     return null;
    // }

    return <Route {...props} component={component}/>;
};

const mapStateToProps = state => ({
    account: state.account,
    app: state.app,
});

export default connect(mapStateToProps)(AuthRoute);
