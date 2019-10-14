import React from 'react';
import './FormRadioField.css';

export default ({ name, value, items, onChange }) => (
  <div className="form-radio">
    <div className="label">
      {value.label}
      {value.required ? "*" : ""}
    </div>
    <div className="radio">
      {Object.keys(items).map((k, i) => {
          return (
              <React.Fragment key={i}>
                  <input
                      type="radio"
                      className="d-none"
                      name={name}
                      id={k}
                      value={k}
                      onChange={onChange}
                      checked={items[k.toUpperCase()] === items[value.value.toUpperCase()]}
                  />
                  <label htmlFor={k}>
                      {items[k]}
                  </label>
              </React.Fragment>
          )
      })}
    </div>
  </div>
);