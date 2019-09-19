import {combineReducers} from 'redux';
import {routerReducer} from 'react-router-redux';
import account from './module.account';
import app from './module.app';
import trade from './module.trade';
import loading from './module.loading'
import monitoring from './module.monitoring'
import notifications from './module.notifications'

export default combineReducers({
    routing: routerReducer,
    account,
    app,
    trade,
    loading,
    monitoring,
    notifications,
});
