import React from 'react';
import '../form/FormInputField.css';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { getPropertyByPath } from '../../../services/service.utils';
import { ErrorMessage } from 'formik';

export const FormikPhoneInput = ({field, form, label, isRequired, ...props}) => {
    const isTouched = getPropertyByPath(field.name, form.touched);
    const error = getPropertyByPath(field.name, form.errors);
    const showError = isTouched && error;
    return (
        <div className="form-input form-input--phone">
            {label &&
            <label htmlFor={field.name} className="label">
                {label}
                {isRequired ? '*' : ''}
            </label>}
            <PhoneInput
                limitMaxLength={true}
                inputClassName={'input' + (showError ? ' input_error ' : '')}
                {...field}
                {...props}
                onChange={value => {form.setFieldValue(field.name, value || '')}}
                name={field.name}
            />
            <ErrorMessage name={field.name} render={msg => <div className="error">{msg}</div>} />
        </div>
    );
};
