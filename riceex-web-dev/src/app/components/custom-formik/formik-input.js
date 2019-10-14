import React from 'react';
import '../form/FormInputField.css';
import { ErrorMessage } from 'formik';
import { getPropertyByPath } from '../../../services/service.utils';

export const FormikInput = ({
                                field, // { name, value, onChange, onBlur }
                                form: {touched, errors}, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
                                label,
                                isRequired,
                                ...props
                            }) => {
    const isTouched = getPropertyByPath(field.name, touched);
    const error = getPropertyByPath(field.name, errors);
    const showError = isTouched && error;
    return (
        <div className="form-input">
            {label &&
            <label htmlFor={field.name} className="label">
                {label}
                {isRequired ? '*' : ''}
            </label>}
            <input
                type="text"
                className={'input' + (showError ? ' input_error ' : '')}
                {...field}
                {...props}
            />
            <ErrorMessage name={field.name} render={msg => <div className="error">{msg}</div>} />
        </div>
    )
};
