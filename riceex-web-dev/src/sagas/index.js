import {all} from "redux-saga/effects";
import {WSSaga} from "./saga.websocket";


export default function* rootSaga() {
    yield all([
        WSSaga()
    ]);
}
