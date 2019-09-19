import React from 'react';
import moment from 'moment/moment';
import { DATEFORMAT } from '../../../services/service.values';
import DatePicker from 'react-datepicker';
import './FormDateFieldFromTo.css';

export default ({
                    nameStart,
                    nameEnd,
                    itemStart,
                    itemEnd,
                    onSelect,
                    placeholder = 'Select a date',
                    validation,
                    popperPlacement,
                    required = false,
                    minDate = moment()
                }) => {
    return (
        <div className="form-date-wrapper">
            <div className="form-date">
                <div className="label">
                    {itemStart.label}
                    {itemStart.required ? '*' : ''}
                </div>
                <div className="date">
                    <DatePicker
                        popperClassName="test"
                        name={nameStart}
                        className={`input date ${validation && validation.hasOwnProperty(nameStart) ? ' input_error ' : ''}`}
                        onChange={date => onSelect(nameStart, date)}
                        required={required}
                        minDate={minDate}
                        maxDate={itemEnd.value ? itemEnd.value : null}
                        selected={itemStart.value}
                        placeholderText={'Select a date from'}
                        dateFormat={DATEFORMAT}
                        autoComplete="off"
                        popperPlacement={popperPlacement}
                        selectsStart
                        startDate={itemStart.value}
                        endDate={itemEnd.value}
                    />
                </div>
            </div>
            <div className="form-date">
                <div className="label">
                    {itemEnd.label}
                    {itemEnd.required ? '*' : ''}
                </div>
                <div className="date">
                    <DatePicker
                        popperClassName="test"
                        name={nameEnd}
                        className={`input date ${validation && validation.hasOwnProperty(nameEnd) ? ' input_error ' : ''}`}
                        onChange={date => onSelect(nameEnd, date)}
                        required={required}
                        minDate={itemStart.value ? itemStart.value : minDate}
                        selected={itemEnd.value}
                        placeholderText={'Select a date to'}
                        dateFormat={DATEFORMAT}
                        autoComplete="off"
                        popperPlacement={popperPlacement}
                        selectsEnd
                        selectsStart
                        startDate={itemStart.value}
                        endDate={itemEnd.value}
                    />
                </div>
            </div>
        </div>
    );
};
