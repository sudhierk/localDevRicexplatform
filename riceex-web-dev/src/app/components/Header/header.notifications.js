import React from 'react';
import { connect } from 'react-redux';
import MdBell from 'react-icons/lib/md/notifications-none';
import { Notification } from './notifications';
import {
    DeleteAllNotifications, DeleteNotification,
    GetNotifications,
    MarkAllAsRead,
    MarkRead
} from '../../../modules/module.notifications';
import { push } from 'react-router-redux';
import moment from 'moment';
import Preloader from '../preloader/Preloader';

class NotificationMenu extends React.Component {
    state = {
        showNotifications: false,
    };

    showMenu = () => {
        this.setState({
            showNotifications: !this.state.showNotifications,
        });
    };

    hideDropDown = () => {
        this.setState({
            showNotifications: false,
        });
    };

    onNotificationClick = (notificationId) => {
        return path => {
            this.props.markRead(notificationId);
            this.hideDropDown();
            const requestIdFromLink = this.getRequestIdFromPath(path);
            const requestId = this.getRequestIdFromPath(window.location.pathname);
            if (requestId === requestIdFromLink) {
                path += `${path.includes('?') ? '&' : '?'}forceUpdate=true`;
            }
            this.props.navigate(path);
        }
    };

    renderMessage = notification => {
        return Notification({
            ...notification,
            onClick: this.onNotificationClick(notification.id),
            onDelete: this.deleteNotification.bind(this, notification.id)
        });
    };

    loadMore = () => {
        this.props.getNotifications({take: 15, skip: this.props.messages.length});
    };

    getRequestIdFromPath = (path) => {
        const splitParams = path.split('/');
        const detailsIndex = splitParams.findIndex(path => path === 'details');
        if (detailsIndex > -1) {
            return splitParams[detailsIndex + 1];
        }
    };

    deleteNotification = id => {
        this.props.deleteNotification(id);
    };

    markAllAsRead = () => {
        if (this.props.loading) {
            return;
        }
        this.props.markAllAsRead();
    };

    deleteAll = () => {
        if (this.props.loading) {
            return;
        }
        this.props.deleteAllNotifications();
    };

    render() {
        const {messages, newMessages, markRead, navigate, totalCount} = this.props;
        messages.sort((a, b) => moment.utc(b.date).diff(moment.utc(a.date)));
        return (
            <React.Fragment>
                <div className="notification-menu flex-column flex-lg-row" id="drop-menu">
                    <div className="menu-container mt-lg-0 mr-xl-4" id="drop-menu">
                        <div className="notification-wrapper" onClick={this.showMenu}>
                            <MdBell className="bell-pic header-icon" id="drop-menu"/>
                            {newMessages > 0 && (<span className="badge">{newMessages} </span>)}
                        </div>

                        <div className={`drop-menu ${this.state.showNotifications ? 'enter-class' : 'outer-class'}`} id="drop-menu">
                            <div className="notification-list-container" style={{justifyContent: this.props.loading ? 'center' : 'initial'}}>
                                <Preloader style="swirl" loading={this.props.loading}>
                                    <React.Fragment>
                                        {messages && messages.map((v, i) =>
                                            <div key={i} className="drop-menu__item">
                                                {this.renderMessage(v)}
                                            </div>
                                        )}
                                        {messages && messages.length < totalCount && (
                                            <div className="drop-menu__item drop-menu__item--load-more">
                                                <div className="notification-item notification-item--load-more text-center" onClick={this.loadMore}>
                                                    <div className="n-content">
                                                        <Preloader style="dots--black" loading={this.props.loadingMore}>
                                                            Load More
                                                        </Preloader>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {!totalCount && (
                                            <div className="notification-empty">
                                                <MdBell className="bell-pic notification-empty__icon" />
                                                <div className="notification-empty__text">
                                                    Notifications list is empty now
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                </Preloader>
                            </div>
                            {totalCount > 0 && (
                                <div className="notification-controls">
                                    <div
                                        className={`notification-controls__item${this.props.loading ? ' notification-controls__item--disabled' : ''}`}
                                        onClick={this.deleteAll}
                                    >
                                        Clear All Notifications
                                    </div>
                                    <div
                                        className={`notification-controls__item${this.props.loading ? ' notification-controls__item--disabled' : ''}`}
                                        onClick={this.markAllAsRead}
                                    >
                                        Mark All As Read
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

NotificationMenu = connect(
    ({notifications, loading}) => ({
        messages: notifications.getIn(['messages', 'list']),
        newMessages: notifications.getIn(['messages', 'new']),
        totalCount: notifications.getIn(['messages', 'count']),
        loading: loading.loadingNotifications,
        loadingMore: loading.loadingMoreNotifications,
    }),
    {
        navigate: path => push(path),
        markRead: MarkRead,
        getNotifications: GetNotifications,
        markAllAsRead: MarkAllAsRead,
        deleteAllNotifications: DeleteAllNotifications,
        deleteNotification: DeleteNotification
    }
)(NotificationMenu);

export default NotificationMenu;