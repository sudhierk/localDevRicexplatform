import {call, put, takeEvery} from "redux-saga/effects";
import {fromJS, Map} from 'immutable';

export const Module = (module) => {
    let result = {
        topics: {},
        sagas: [],
        state: {},
    }

    result.Module = (name, state = {}, requests) => {
        result.state[name] = Object.assign(result.state[name] ? result.state[name] : {}, state);
        requests.forEach(f => {
            result = f(result)
        });
        return result
    };

    result.Action = (action, onSuccess, saga) => {

        if (saga) {
            let successTopic = action.type + ":success";
            result.topics[successTopic] = onSuccess;
            result.sagas.push(takeEvery(action.type, function* ({payload}) {
                try {
                    yield put({type: 'system.ui/LOCK', payload: 'validate'});
                    let data = yield saga({payload});
                    yield put({type: successTopic, payload: data})

                } catch (e) {
                    yield put({
                        type: "Error",
                        payload: e
                    })
                } finally {
                    yield put({type: 'system.ui/UNLOCK', payload: 'validate'});
                }
            }));
            return result;
        }
        result.topics[action.type] = onSuccess;
        return result;
    };

    result.Request = (action, request, onSuccess, onError) => {
        let topic = action.type;
        let requestTopic = topic;
        let successTopic = topic + ":success";
        let errorTopic = topic + ":error";
        if (onSuccess) {
            result.topics[successTopic] = onSuccess;
        }
        if (onError) {
            result.topics[errorTopic] = onError
        }
        result.sagas.push(takeEvery(requestTopic, function* ({payload}) {
            try {
                yield put({type: 'system.ui/LOCK', payload: topic});
                let data = yield call(request, payload);
                yield put({
                    type: successTopic,
                    payload: data.data,
                });
                if (payload && payload.callback) {
                    yield put(payload.callback)
                }
                return data

            } catch (e) {
                yield put({
                    type: errorTopic,
                    payload: e.response.data
                })
                yield put({
                    type: "Error",
                    payload: e
                })
            } finally {
                yield put({type: 'system.ui/UNLOCK', payload: topic});
            }
            return null
        }));
        return result;
    };

    result.Crud = (actions, api, initial = {list: [], total: 0, edit: {}, filter: {skip: 0, take: 5, page: 0}}) => {
        if (!api) {
            return
        }
        let listAction = actions.List()
        result.state[actions.name] = initial;
        result.Request(listAction, api.List, (state, action) => {
            state = state.mergeIn([actions.name], Map({
                list: action.payload.items,
                total: action.payload.total,
                updating: false,
            }));
            return state
        });

        let getAction = actions.Get()
        result.Request(getAction, api.Get, (state, {payload}) => {
            console.log()
            state = state.setIn([actions.name, 'edit'], Map(
                payload
            ));
            return state
        });

        let deleteAction = actions.Delete()
        result.Request(deleteAction, api.Delete, (state, {payload}) => {
            let value = state.getIn([actions.name]);

            let list = value.get('list').filter(o => Number(o.id) !== Number(payload.id))
            // .filter(o => o.get('ID') !== payload.ID));

            console.log("total", value.get('total'))
            state = state.setIn([actions.name, 'list'], list);
            state = state.setIn([actions.name, 'total'], value.get('total') - 1);

            return state
        });

        let createAction = actions.Create()
        result.Request(createAction, api.Create, (state, {payload}) => {
            let value = state.getIn([actions.name]).toJS();
            value.list.push(payload);
            state = state.mergeIn([actions.name], Map({
                list: value.list,
                total: value.total + 1
            }));
            return state
        });
        return result;
    }

    result.Reduce = (state = fromJS(result.state), action) => {
        let reducer = result.topics[action.type];
        if (reducer) {
            return reducer(state, action)
        }
        return state
    }

    return result
};
