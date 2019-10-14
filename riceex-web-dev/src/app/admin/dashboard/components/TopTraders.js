import React from 'react';
import './TopTraders.css';


export default () => (
  <div className="top-traders">
    <div className="item">
      <div className="item-id">1</div>
      <div className="item-name">Brian Kelly<br/><span>Trader</span></div>
      <div className="item-stat">456/1080</div>
    </div>
    <div className="item">
      <div className="item-id">2</div>
      <div className="item-name">Carl Joseph<br/><span>CEO</span></div>
      <div className="item-stat">287/1290</div>
    </div>
    <div className="item">
      <div className="item-id">3</div>
      <div className="item-name">John McMillan<br/><span>Trader</span></div>
      <div className="item-stat">154/954</div>
    </div>
  </div>
)