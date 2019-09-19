import React, { Component } from 'react';
import { Link, NavLink, withRouter } from 'react-router-dom';
import { bindActionCreators, compose } from 'redux';
import logo from '../../../static/img/logo.png';
//Icons
import MdPerson from 'react-icons/lib/md/person';
import MdMenu from 'react-icons/lib/md/menu';
import MdSwapVert from 'react-icons/lib/md/swap-vert';
import FaAngleDown from 'react-icons/lib/fa/angle-down';
import FaSignal from 'react-icons/lib/fa/signal';
import IoClipboard from 'react-icons/lib/io/clipboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // it's weight is 200 kb
import { faHandshake } from '@fortawesome/free-solid-svg-icons';
//Styles
import './header.css';
import { connect } from 'react-redux';
import { logout } from '../../../modules/module.account';
import { push } from 'react-router-redux';
import NotificationMenu from './header.notifications';
import AccessControl, { INSPECTION_COMPANY } from '../AccessControl';
import { UserTypes } from '../../../utils/userTypes';

class Header extends Component {
    state = {
        showDropDown: false,
        showMenu: false
    };

    componentWillMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = event => {
        if (event.target.id !== 'drop-menu') {
            this.setState({
                showDropDown: false,
                showMenu: false
            });
        }
    };

    showMenu = () => {
        if (window.innerWidth < 992) {
            this.setState({
                showMenu: !this.state.showMenu,
                showDropDown: false
            });
        } else {
            this.setState({
                showDropDown: !this.state.showDropDown,
                showMenu: false
            });
        }
    };

    render() {
        return (
            <React.Fragment>
                <header className="header justify-content-start" id="header">
                    <div className="navigation__logo">
                        <img src={logo} alt=""/>
                    </div>
                    <div
                        id="drop-menu"
                        className={
                            this.state.showMenu
                                ? 'navigation d-flex flex-column flex-lg-row'
                                : 'navigation d-none d-lg-flex flex-column flex-lg-row'
                        }
                    >
                        <AccessControl user={this.props.user}>
                            <NavLink exact to="/" id="drop-menu">
                                <div className="navigation__link" id="drop-menu">
                                    <FaSignal id="drop-menu"
                                              className="navigation__link__icn navigation__link__icn--dashboard"/>Dashboard
                                </div>
                            </NavLink>
                            <div className="divide-line d-none d-lg-block"/>
                        </AccessControl>
                        <AccessControl user={this.props.user} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]}>
                            <NavLink to="/exchange" id="drop-menu">
                                <div className="navigation__link" id="drop-menu">
                                    <MdSwapVert id="drop-menu"
                                                className="navigation__link__icn navigation__link__icn--exchange"/>Exchange
                                </div>
                            </NavLink>
                            <div className="divide-line d-none d-lg-block"/>
                        </AccessControl>
                        <AccessControl user={this.props.user} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]}>
                            <NavLink to="/requests" id="drop-menu">
                                <div className="navigation__link" id="drop-menu">
                                    <IoClipboard id="drop-menu"
                                                 className="navigation__link__icn navigation__link__icn--trade-request"/>Trade
                                    Request{' '}
                                    <div className="navigation__link__notification d-none">
                                        <span>27</span>
                                    </div>
                                </div>
                            </NavLink>
                            <div className="divide-line d-none d-lg-block"/>
                        </AccessControl>
                        <AccessControl user={this.props.user} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]}>
                            <NavLink to="/trades" id="drop-menu">
                                <div className="navigation__link" id="drop-menu">
                                    <FontAwesomeIcon
                                        id="drop-menu"
                                        className="navigation__link__icn navigation__link__icn--trades"
                                        icon={faHandshake}
                                    />
                                    Trades
                                    <div className="navigation__link__notification d-none">
                                        <span>1</span>
                                    </div>
                                </div>
                            </NavLink>
                        </AccessControl>
                        <div className="navigation__profile" id="drop-menu">
                            <div className="navigation__name" id="drop-menu">
                                <MdPerson className="user-pic"/>
                                <span
                                    className={this.props.user && this.props.user.name.length > 9 ? 'hidename name' : ' name'}
                                >
                                    {this.props.user && this.props.user.name}
                                </span>
                            </div>
                            <div>
                                <AccessControl user={this.props.user} excludeUserTypes={[UserTypes.PLATFORM_ADMIN]} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                    <div className="drop-menu__item" id="drop-menu" onClick={() => this.props.navigateTo('/profile')}>
                                        Edit Profile
                                    </div>
                                </AccessControl>
                                <AccessControl user={this.props.user} excludeUserTypes={[UserTypes.PLATFORM_ADMIN]} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                    <div className="drop-menu__item" id="drop-menu" onClick={() => this.props.navigateTo('/company-profile')}>
                                        Company Profile
                                    </div>
                                </AccessControl>
                                <div
                                    className="navigation__profile-item"
                                    id="drop-menu"
                                    onClick={() => {
                                        this.props.logout();
                                        this.props.navigate();
                                    }}
                                >
                                    Log out
                                </div>
                            </div>
                        </div>
                    </div>
                    <AccessControl user={this.props.user} userTypes={[UserTypes.COMPANY_ADMIN, UserTypes.COMPANY_EMPLOYEE]} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                        <Link to="/requests/create" className="btn btn--blue mr-lg-3 ml-auto">
                            Create<span className="header-new"> new</span> request
                        </Link>
                    </AccessControl>
                    <div className="user-interact flex-column flex-lg-row ml-auto" id="drop-menu">
                        <div className="user-name mt-lg-0 mr-xl-4" id="drop-menu">
                            <div className="user-wrapper" onClick={() => this.showMenu()}>
                                <MdPerson className="user-pic header-icon" id="drop-menu"/>
                                <span
                                    className={
                                        this.props.user && this.props.user.name.length > 9
                                            ? 'hidename user-wrapper__name'
                                            : 'user-wrapper__name'
                                    }
                                    id="drop-menu">
                                    {this.props.user && this.props.user.name}
                                </span>
                                <FaAngleDown className="arrow-down" id="drop-menu"/>
                            </div>

                            <div className={`drop-menu ${this.state.showDropDown ? 'enter-class' : 'outer-class'}`}
                                 id="drop-menu">
                                <AccessControl user={this.props.user} excludeUserTypes={[UserTypes.PLATFORM_ADMIN]} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                    <div className="drop-menu__item" id="drop-menu" onClick={() => this.props.navigateTo('/profile')}>
                                        Edit Profile
                                    </div>
                                </AccessControl>
                                <AccessControl user={this.props.user} excludeUserTypes={[UserTypes.PLATFORM_ADMIN]} excludeCompanyTypes={[INSPECTION_COMPANY]}>
                                    <div className="drop-menu__item" id="drop-menu" onClick={() => this.props.navigateTo('/company-profile')}>
                                        Company Profile
                                    </div>
                                </AccessControl>
                                <div
                                    id="drop-menu"
                                    className="drop-menu__item"
                                    onClick={() => {
                                        this.props.logout();
                                        this.props.navigate();
                                    }}
                                >
                                    Log out
                                </div>
                            </div>
                        </div>
                    </div>
                    <NotificationMenu/>
                    <div id="drop-menu" className="burger-icn d-block d-sm-none" onClick={() => this.showMenu()}>
                        <MdMenu id="drop-menu"/>
                    </div>
                </header>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => ({
    user: state.account.user
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            logout,
            navigate: () => push('/'),
            navigateTo: path => push(path)
        },
        dispatch
    );

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(Header);
