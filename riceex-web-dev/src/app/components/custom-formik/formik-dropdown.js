import Select, { Creatable, createFilter } from 'react-select';
import React, { Component } from 'react';
import { MenuList } from '../form';
import { getPropertyByPath } from '../../../services/service.utils';

export class FormikDropdown extends Component {

    shouldComponentUpdate = nextProps => {
        return (nextProps.items !== this.props.items
            || nextProps.isLoading !== this.props.isLoading
            || nextProps.field.value !== this.props.field.value
        );
    };

    render() {
        let {
            items,
            label,
            isDisabled,
            required,
            isLoading,
            noOptionMessage,
            isCreatable,
            form: {touched, errors},
            field,
            isRequired,
            ...rest
        } = this.props;
        const SelectComponent = isCreatable ? Creatable : Select;
        const isTouched = getPropertyByPath(field.name, touched);
        const error = getPropertyByPath(field.name, errors);
        const showError = isTouched && error;

        return (
            <div className="form-select">
                <label className="label" htmlFor={field.name}>
                    {label}
                    {isRequired ? '*' : ''}
                </label>
                <div>
                    <SelectComponent
                        isClearable={isCreatable}
                        options={items}
                        disabled={isDisabled}
                        className={`${showError ? 'formik-select select_error select_error--dropdown ' : 'formik-select'}`}
                        noOptionsMessage={() => noOptionMessage}
                        name={field.name}
                        id={field.name}
                        isLoading={isLoading}
                        components={{MenuList}}
                        filterOption={createFilter({ignoreAccents: false})}
                        required={required}
                        {...field}
                        {...rest}
                        onChange={val => {
                            this.props.form.setFieldValue(field.name, val.value)
                        }}
                    />
                </div>
            </div>
        );
    }
}
