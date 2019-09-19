import React from 'react';
import { DATEFORMATHOURS } from '../../../services/service.values';
import DatePicker from 'react-datepicker';
import '../form/FormDateField.css';
import { getPropertyByPath } from '../../../services/service.utils';
import PhoneInput from "react-phone-number-input";

export const FormikDateField = ({
                                    label,
                                    form: {touched, errors},
                                    field,
                                    time = false,
                                    placeholder,
                                    dateFormat = DATEFORMATHOURS,
                                    popperPlacement,
                                    minDate,
                                    maxDate,
                                    className = 'input',
                                    disabled,
                                    isRequired,
                                    ...props
                                }) => {
    const isTouched = getPropertyByPath(field.name, touched);
    const error = getPropertyByPath(field.name, errors);
    const showError = isTouched && error;
    return (
        <div className="form-date">
            <label className="label" htmlFor={field.name}>
                {label}
                {isRequired ? '*' : ''}
            </label>
            <div className="date">
                <DatePicker
                    popperClassName="test"
                    name={field.name}
                    className={`${className} ${showError ? ' input_error ' : ''}`}
                    popperPlacement={popperPlacement}
                    minDate={minDate}
                    maxDate={maxDate}
                    selected={field.value}
                    placeholderText={placeholder}
                    dateFormat={dateFormat}
                    showTimeSelect={time}
                    autoComplete="off"
                    disabled={disabled}
                    {...field}
                    {...props}
                    value={field.value && field.value.format('DD MMM YYYY')}
                />
            </div>
        </div>
    );
};
