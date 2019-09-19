import React from "react";
import {VictoryTooltip} from 'victory';

export const RicexTooltip = (props) => (
  <g>
    <VictoryTooltip
      {...props}
      cornerRadius={8}
      style={{
        fill: "#fff"
      }}
      flyoutStyle={{
        fill: props.markColor,
        stroke: props.markColor,
      }}
      pointerLength={6}
    />
    {props.active && <circle cx={props.x} cy={props.y+10} r="5" stroke={props.markColor} fill="#fff" strokeWidth={3}/>}
  </g>
);

export const Gradients = () => (
  <svg className="gradient">
    <defs>
      <linearGradient id="areaGreen" x1="0%" x2="0%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#52bfc9" stopOpacity="0.4"/>
        <stop offset="50%" stopColor="#52bfc9" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#52bfc9" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="areaBlue" x1="0%" x2="0%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#006aff" stopOpacity="0.4"/>
        <stop offset="50%" stopColor="#006aff" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#006aff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="areaRed" x1="0%" x2="0%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#ff6c83" stopOpacity="0.4"/>
        <stop offset="50%" stopColor="#ff6c83" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="#ff6c83" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);