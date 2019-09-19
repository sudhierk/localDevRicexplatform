import { Map } from 'immutable';
import { AccountApi } from '../services';
import { authHeader } from '../services/service.api';
import { LoadingMoreNotifications, LoadingNotifications } from './module.loading';

export const NOTIFICATION_NEW = 'notification/NEW';
export const NOTIFICATION_MARK_READ = 'notification/MARK_READ';
export const GET_NOTIFICATIONS = 'notification/GET_NOTIFICATIONS';
export const NOTIFICATION_MARK_ALL_READ = 'notification/MARK_ALL_READ';
export const NOTIFICATION_DELETE_ALL = 'notification/CLEAR_ALL';
export const NOTIFICATION_DELETE = 'notification/CLEAR';

const initialState = Map(
    {
        messages: Map({
            'list': [],
            'new': 0,
            'count': 0
        })
    }
);

export default (state = initialState, {type, payload}) => {
    switch (type) {
        case NOTIFICATION_NEW:
            payload.id = payload.id || payload.ID;
            state = state.updateIn(['messages', 'list'], arr => arr.concat(payload));
            state = state.updateIn(['messages', 'new'], count => count + 1);
            state = state.updateIn(['messages', 'count'], count => count + 1);
            return state;
        case NOTIFICATION_MARK_READ:
            state = state.updateIn(['messages', 'list'], arr => arr.map(notification => {
                if (notification.id !== payload) {
                    return notification;
                }
                notification.read = true;
                return notification;
            }));
            state = state.updateIn(['messages', 'new'], count => Math.max(0, count - 1));
            return state;
        case NOTIFICATION_MARK_ALL_READ:
            state = state.updateIn(['messages', 'list'], arr => arr.map(notification => {
                notification.read = true;
                return notification;
            }));
            state = state.updateIn(['messages', 'new'], () => 0);
            return state;
        case GET_NOTIFICATIONS:
            const loadedNotifications = payload.notifications.map(notification => (
                {
                    ...notification,
                    date: notification.date || notification.CreatedAt,
                    id: notification.id || notification.ID
                }
            ));
            state = state.updateIn(['messages', 'list'], arr =>
                payload.append ? [...arr, ...loadedNotifications] : loadedNotifications
            );
            state = state.updateIn(['messages', 'count'], () => payload.count);
            state = state.updateIn(['messages', 'new'], () => payload.unread);
            return state;
        case NOTIFICATION_DELETE:
            const message = state.getIn(['messages', 'list']).find(notification => notification.id === payload);
            const isUnread = message && !message.read;
            state = state.updateIn(['messages', 'list'], arr => arr.filter(notification => notification.id !== payload));
            state = state.updateIn(['messages', 'count'], count => Math.max(0, count - 1));
            if (isUnread) {
                state = state.updateIn(['messages', 'new'], count => Math.max(0, count - 1));
            }
            return state;
        case NOTIFICATION_DELETE_ALL:
            state = state.updateIn(['messages', 'list'], () => []);
            state = state.updateIn(['messages', 'new'], () => 0);
            state = state.updateIn(['messages', 'count'], () => 0);
            return state;
        default:
            return state;
    }
};


export const GetNotifications = params => {
    return dispatch => {
        LoadingMoreNotifications(true, dispatch);
        AccountApi.getNotifications(params)
            .then(response => {
                LoadingMoreNotifications(false, dispatch);
                dispatch({type: GET_NOTIFICATIONS, payload: {...response.data, append: !!params.skip}});
            })
    };
};

export const MarkRead = (id) => {
    return dispatch => {
        AccountApi.markNotificationAsRead(id)
            .then(() => {
                dispatch({
                    type: NOTIFICATION_MARK_READ,
                    payload: id
                });
            });
    };
};

export const MarkAllAsRead = () => {
    return dispatch => {
        LoadingNotifications(true, dispatch);
        AccountApi.markAllNotificationsAsRead()
            .then(() => {
                LoadingNotifications(false, dispatch);
                dispatch({
                    type: NOTIFICATION_MARK_ALL_READ,
                });
            })
            .catch(() => {
                LoadingNotifications(false, dispatch);
            });
    };
};

export const DeleteNotification = id => {
    return dispatch => {
        dispatch({type: NOTIFICATION_DELETE, payload: id});
        AccountApi.deleteNotification(id);
    };
};

export const DeleteAllNotifications = () => {
    return dispatch => {
        LoadingNotifications(true, dispatch);
        AccountApi.deleteAllNotifications()
            .then(() => {
                dispatch({type: NOTIFICATION_DELETE_ALL});
                LoadingNotifications(false, dispatch);
            })
            .catch(() => LoadingNotifications(false, dispatch));
    }
};
