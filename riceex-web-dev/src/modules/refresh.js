import moment from "moment";
import { refreshToken } from "./module.account";

import { logout } from "./module.account";
import { push } from "react-router-redux";
import jwtDecode from "jwt-decode";

export function jwt({ dispatch, getState }) {
  return next => action => {
    if (typeof action === "function") {
      if (
        localStorage.getItem("jwt") &&
        (localStorage.getItem("jwt") ? jwtDecode(localStorage.getItem("jwt")).exp - moment().unix() > 0 : false)
      ) {
        // console.log("check jwt!");

        var tokenExpiration = jwtDecode(localStorage.getItem("jwt"));

        // console.log(localStorage.getItem("jwt"));
        //console.log(tokenExpiration.exp, moment().unix());
        //console.log(tokenExpiration.exp - moment().unix() > 300);
        const diff = tokenExpiration.exp - moment().unix();
        if (diff < 300 && diff > 0) {
          refreshToken();
          next(action);
        } else if (diff < 0) {
          logout()(dispatch);
          dispatch(push("/"));
          return;
        }
      } else if (
        localStorage.getItem("jwt") ? jwtDecode(localStorage.getItem("jwt")).exp - moment().unix() < 0 : false
      ) {
        logout()(dispatch);
      } else {
        logout()(dispatch);        
      }
    }

    return next(action);
  };
}
