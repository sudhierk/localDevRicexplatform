import React from 'react';
import './FormSelectDropdown.css';

class FormSelectDropdown extends React.Component {
  // shouldComponentUpdate = nextProps => {
  //   return nextProps.items !== this.props.items || nextProps.validation !== this.props.validation;
  // };
  render() {
    const { name, value, items, onSelect, validation, disabled, showDefault } = this.props;
    return (
      <div className="form-select">
        <div className="label">
          {value.label}
          {value.required ? '*' : ''}
        </div>
        <div className="wrapper">
          <select
            className={`${value.value ? "value" : "placeholder"} select${
              validation && validation.hasOwnProperty(name) ? ' select_error select_error--dropdown ' : ''
            }`}
            name={name}
            id={name}
            disabled={disabled}
            onChange={e => onSelect(e)}
            value={value.value ? value.value : ''}
          >
            <option value="" disabled={!showDefault} hidden={!showDefault} >
              Select
            </option>
            {Object.keys(items).map(i => {
              return (
                <option key={i} value={i}>
                  {items[i]}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }
}

export default FormSelectDropdown;
