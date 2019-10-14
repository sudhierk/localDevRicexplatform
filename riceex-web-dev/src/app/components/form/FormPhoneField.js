import React from 'react';
import './FormInputField.css';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default ({
                    name,
                    value,
                    type,
                    validation,
                    onChange,
                    placeholder = ''
                }) => (
    <div className="form-input form-input--phone">
        {value.label &&
        <label htmlFor={name} className="label">
            {value.label}
            {value.required ? '*' : ''}
        </label>}
        <PhoneInput
            placeholder={placeholder}
            value={value.value}
            onChange={onChange}
            required={true}
            name={name}
            limitMaxLength={true}
            inputClassName={'input' + (validation && validation.hasOwnProperty(name) ? ' input_error ' : '')}
        />
    </div>
);