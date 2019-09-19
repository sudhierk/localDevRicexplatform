import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import store from './store';
import App from './app';
import 'bootstrap/dist/js/bootstrap.min';

//Styles
import 'sanitize.css/sanitize.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './static/style/index.css'

const root = document.getElementById('root');
render(
    <Provider store={store}>
        <App/>
    </Provider>,
    root
);


