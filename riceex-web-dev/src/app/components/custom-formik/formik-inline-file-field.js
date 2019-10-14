import React from 'react';
import './formik-inlint-file-field.css'
import { ErrorMessage } from 'formik';
import { getPropertyByPath } from '../../../services/service.utils';

export const FormikInlineFileField = ({field, label, fileName, validateByName, form: {touched, errors}, onDocumentPreview, onChange, isRequired, ...props}) => {
    onChange = onChange || field.onChange;
    const isTouched = getPropertyByPath(field.name, touched) || getPropertyByPath(validateByName, touched);
    const error = getPropertyByPath(validateByName, errors);
    return (
        <div className="form-file">
            <label htmlFor={field.name}>
                {label}
                {isRequired ? '*' : ''}
            </label>
            <button className="btn">
                Choose file
                <input type="file"
                       {...field}
                       onChange={onChange}
                       {...props}
                />
            </button>
            <span className="file-name" onClick={onDocumentPreview}>{fileName}</span>
            {isTouched && error && (
                <div className="error">{error}</div>
            )}
        </div>
    );
};
