import React from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

const mapStateToProps = state => ({});

const Landing = props => (
    <div>
        <div className="wrapper">
            <div className="page-header section-dark">
                <div className="container">
                    <div className="title-brand">
                        <h1 className="presentation-title">Riceex Landing</h1>
                        <div className="fog-low" />
                        <div className="fog-low right" />
                    </div>
                </div>
                <div className="moving-clouds" />
            </div>
        </div>
    </div>
);

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps)
)(Landing);
