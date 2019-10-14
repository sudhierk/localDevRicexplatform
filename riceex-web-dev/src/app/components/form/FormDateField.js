import React from 'react';
import { DATEFORMATHOURS } from '../../../services/service.values';
import moment from 'moment/moment';
import DatePicker from 'react-datepicker';
import './FormDateField.css';

export default ({
                    name,
                    item,
                    onSelect,
                    label,
                    placeholder = 'Select a date',
                    disabled = false,
                    time = true,
                    dateFormat = DATEFORMATHOURS,
                    popperPlacement,
                    minDate = moment(),
                    maxDate,
                    className = 'input',
                    ...rest
                }) => {
    return (
        <div className="form-date">
            <div className="label">
                {label ? item.label : label}
                {label && item.required ? '*' : ''}
            </div>
            <div className="date">
                <DatePicker
                    popperClassName="test"
                    name={name}
                    className={`${className} ${rest.validation && rest.validation.hasOwnProperty(name) ? ' input_error ' : ''}`}
                    onChange={date => onSelect(name, date)}
                    required={rest.required}
                    popperPlacement={popperPlacement}
                    minDate={minDate}
                    maxDate={maxDate}
                    selected={item.value}
                    placeholderText={placeholder}
                    dateFormat={dateFormat}
                    showTimeSelect={time}
                    disabled={disabled}
                    autoComplete="off"
                />
            </div>
        </div>
    );
};
