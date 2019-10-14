import React from 'react';
import './FormInputField.css';

export default ({
                    name,
                    value,
                    type,
                    validation,
                    onChange,
                    max,
                    maxlength,
                    placeholder = ''
                }) => (
    <div className="form-input">
        {value.label &&
        <label htmlFor={name} className="label">
            {value.label}
            {value.required ? '*' : ''}
        </label>}
        <input
            type={type}
            placeholder={placeholder}
            value={value.value}
            className={'input' + (validation && validation.hasOwnProperty(name) ? ' input_error ' : '')}
            id={name}
            name={name}
            onChange={onChange}
            max={max}
            maxLength={maxlength}
            required={!!value.required}
        />
    </div>
);