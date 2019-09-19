import ReconnectingWebSocket from '../utils/ReconnectingWebSocket';

import {WS} from "../modules/module.ws";
import {call, take, put, takeEvery} from 'redux-saga/effects'
import {eventChannel} from "redux-saga";
// import {newNotifications} from "../modules/module.notifications";

export const WS_URL = process.env.REACT_APP_WS_URL;
// const socket = null;

function createEventChannel(socket) {
    return eventChannel(emit => {
        socket.onopen = () => {
            console.log("On Open");
        };
        socket.onclose = () => {
            console.log("onClose");
        };
        socket.onerror = error => {
            console.log("WebSocket error ", error);
        };
        socket.onmessage = m => {
            emit(m.data);
        };
        return () => {
            socket.close();
        };
    });
}

function* initializeNotifyWSChannel() {
    try {
        console.log("Connecting", WS_URL + "/v1/api/ws/" + localStorage.getItem("jwt"));
        const socket = new ReconnectingWebSocket(WS_URL + "/v1/api/ws/" + localStorage.getItem("jwt"));
        const channel = yield call(createEventChannel, socket);
        while (true) {
            const msg = yield take(channel);
            console.log("msg", msg);
            const jsonMsg = JSON.parse(msg);
            yield checkMsgAndPut(jsonMsg);
        }
    } catch (e) {
        console.log(e);
    }
}

const checkMsgAndPut = msg => {
    return put({type: "notification/NEW", payload: msg});
};

export function* WSSaga() {
    yield takeEvery(WS.Type.Start, initializeNotifyWSChannel);
}

