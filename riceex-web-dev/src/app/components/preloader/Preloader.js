import React, { Component, Fragment } from 'react';
import './preloader.css';

export default class Preloader extends Component {
    renderStyle = style => {
        switch (style) {
            case 'absolute__dots--black':
                return this.props.loading ? (
                    <div className="preloader__absolute">
                        <div className="dots">
                            <div className="dots__item dots__item--black dots__item--first"/>
                            <div className="dots__item dots__item--black dots__item--second"/>
                            <div className="dots__item dots__item--black dots__item--third"/>
                        </div>
                    </div>
                ) : this.props.children ? (
                    this.props.children
                ) : null;
            case 'dots':
                return this.props.loading ? (
                    <div className="preloader">
                        <div className="dots__item dots__item--first"/>
                        <div className="dots__item dots__item--second"/>
                        <div className="dots__item dots__item--third"/>
                    </div>
                ) : this.props.children ? (
                    this.props.children
                ) : null;
            case 'dots--black':
                return this.props.loading ? (
                    <div className="preloader">
                        <div className="dots__item dots__item--black dots__item--first"/>
                        <div className="dots__item dots__item--black dots__item--second"/>
                        <div className="dots__item dots__item--black dots__item--third"/>
                    </div>
                ) : this.props.children ? (
                    this.props.children
                ) : null;
            case 'overflow-spinner':
                return this.props.loading ? (
                    <Fragment>
                        <div className="preloader--overflow">
                            <i className="k-spinner--pulse" />
                        </div>
                        {this.props.children || null}
                    </Fragment>
                ) : (
                    this.props.children || null
                );
            case 'swirl':
                return this.props.loading ? (
                    <Fragment>
                        <div className="preloader--swirl text-center">
                            <i className="k-spinner--swirl" />
                        </div>
                    </Fragment>
                ) : (
                    this.props.children || null
                );
            case 'spinner':
                return (
                    this.props.loading ? (
                        <Fragment>
                            <div className="preloader--inline">
                                <div className="lds-ring">
                                    <div/>
                                    <div/>
                                    <div/>
                                    <div/>
                                </div>
                            </div>
                        </Fragment>
                    ) : this.props.children ? (
                        this.props.children
                    ) : null
                );
            default:
                break;
        }
    };

    render() {
        const {loading, style} = this.props;
        // console.log(this.props.children);
        return <Fragment>{this.renderStyle(style)}</Fragment>;
    }
}
