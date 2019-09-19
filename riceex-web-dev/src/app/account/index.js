import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {push} from "react-router-redux";
import './index.css'

const LayoutClass = props => (
    <div className="account">
        {props.children}
    </div>
);

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            navigate: path => push('/admin' + path)
        },
        dispatch
    );

export const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutClass);

export {Login} from './login/login';
