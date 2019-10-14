import React from "react";

const Tab = props => {
    return (
      <div
        className={
          props.isActive
            ? "requests__tab requests__tab_active"
            : "requests__tab"
        }
        onClick={props.onActiveTab}
      >
        {props.content}
      </div>
    );
  };
  
  export default Tab;