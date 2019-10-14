import { createStore, applyMiddleware, compose } from "redux";
import { routerMiddleware } from "react-router-redux";
import thunk from "redux-thunk";
import { createBrowserHistory } from "history";
import rootReducer from "./modules";
import Sagas from './sagas'
import {jwt} from "./modules/refresh";
import createSagaMiddleware from 'redux-saga';

const sagaMiddleware = createSagaMiddleware();

export const history = createBrowserHistory();

const initialState = {};
const enhancers = [];
const middleware = [sagaMiddleware, jwt, thunk, routerMiddleware(history)];

// if (process.env.NODE_ENV === 'development') {
const devToolsExtension = window.devToolsExtension;

if (typeof devToolsExtension === "function") {
  enhancers.push(devToolsExtension());
}
// }

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

const store = createStore(rootReducer, initialState, composedEnhancers);
sagaMiddleware.run(Sagas);
export default store;
