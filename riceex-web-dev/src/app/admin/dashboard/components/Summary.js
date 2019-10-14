import React from 'react';
import './Summary.css';

export default () => (
  <div className="summary">
    <div className="summary-wrapper">
      <div className="summary-left">12</div>
      <div className="summary-right">
        <div className="dynamics negative">2</div>
        <div className="hint">New request(s)</div>
      </div>
    </div>
    <div className="summary-wrapper">
      <div className="summary-left">$1236</div>
      <div className="summary-right">
        <div className="dynamics">$200</div>
        <div className="hint">Volumes of trades</div>
      </div>
    </div>
    <div className="summary-wrapper">
      <div className="summary-left">7520</div>
      <div className="summary-right">
        <div className="dynamics positive">145</div>
        <div className="hint">Your trades</div>
      </div>
    </div>
  </div>
);