import React, { Component } from 'react';
import styled from 'styled-components';
import Select, { createFilter, components, Creatable } from 'react-select';
import { FixedSizeList as List } from 'react-window';

const EmptySelection = styled.span`
  color: #546071;
`;
export const FormRow = ({children}) => <div className="row">{children}</div>;

let isRequired = value =>
    value && (value.required === true || (typeof value.required === 'function' && value.required()));

export const FormUploadField = ({accept, name, label, value, onChange}) => (
    <div className="form-group">
        <label htmlFor={name} className="input-label">
            {label}
            {isRequired(value) ? '*' : ''}
        </label>
        {value && value.value ? (
            <span className="blended form-control text-input">{value.value}</span>
        ) : (
            <input
                type="file"
                accept={accept}
                placeholder=""
                className="form-control text-input"
                id={name}
                name={name}
                onChange={e => onChange(e)}
            />
        )}
    </div>
);

export const FormInputFieldDate = ({name, value, validation, onChange, placeholder = '', ...rest}) => (
    <div className="form-group">
        <label htmlFor={name} className="account-label input-label">
            {value.label}
            {isRequired(value) ? '*' : ''}
        </label>
        <input
            type="date"
            placeholder={placeholder}
            maxLength="20"
            value={value.value}
            className={'account-input' + (validation && validation.hasOwnProperty(name) ? ' account-input_error ' : '')}
            id={name}
            name={name}
            onChange={onChange}
            {...rest}
        />
    </div>
);

export const FormDropdownField = ({name, value, items, onSelect, placeholder = 'Select', validation}) => {
    return (
        <div className="form-group">
            <div className="account-label input-label">
                {value.label}
                {isRequired(value) ? '*' : ''}
            </div>
            <div className="text-dropdown-input">
                <div className="register-dropdown-wrapper dropdown">
                    <button
                        className={`dropdown-toggle text-dropdown text-dropdown-toggle register-dropdown ${
                            validation && validation.hasOwnProperty(name) ? 'account-input_error account-input_error--dropdown ' : ''
                            }`}
                        type="button"
                        id={name}
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        {items[value.value] ? items[value.value] : <EmptySelection>{placeholder}</EmptySelection>}
                    </button>
                    <div className="dropdown-menu text-dropdown-menu register-dropdown-menu" aria-labelledby={name}>
                        {Object.keys(items).map(i => {
                            return (
                                <a key={i} className="dropdown-item register-dropdown-item" onClick={() => onSelect(i)}>
                                    {items[i]}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export class MenuList extends Component {
    render() {
        const {options, children, maxHeight, getValue} = this.props;
        const [value] = getValue();
        const height = 35;
        const initialOffset = options.indexOf(value) * height;

        return (
            children.length > 0 ? (
                <List
                    height={maxHeight}
                    itemCount={children.length || 0}
                    itemSize={height}
                    initialScrollOffset={initialOffset}
                >
                    {({index, style}) => <div style={style}>{children[index]}</div>}
                </List>
            ) : <components.NoOptionsMessage {...this.props} />
        );
    }
}

export class VirtualDropdown extends Component {

    shouldComponentUpdate = nextProps => {
        return (nextProps.items !== this.props.items
            || nextProps.validation !== this.props.validation
            || nextProps.isLoading !== this.props.isLoading
            || nextProps.value.value !== this.props.value.value
        );
    };

    render() {
        let {
            name,
            value,
            items,
            label,
            validation,
            isDisabled = true,
            required = true,
            isLoading,
            noOptionMessage,
            onChange,
            isCreatable
        } = this.props;
        const SelectComponent = isCreatable ? Creatable : Select;

        return (
            <div className="form-select">
                <div className="label">
                    {label}
                    {required ? '*' : ''}
                </div>
                <div>
                    <SelectComponent
                        isClearable={isCreatable}
                        options={items}
                        disabled={isDisabled}
                        className={`${validation && validation.hasOwnProperty(name) ? 'select_error select_error--dropdown ' : ''}`}
                        noOptionsMessage={() => noOptionMessage}
                        name={name}
                        id={name}
                        value={value}
                        isLoading={isLoading}
                        components={{MenuList}}
                        filterOption={createFilter({ignoreAccents: false})}
                        required={required}
                        onChange={onChange}
                    />
                </div>
            </div>
        );
    }
}

export const FormUnitsInputField = ({name, value, dropValue, items, validation, onChange, onSelect, placeholder = 'Amount', dropPlaceholder}) => {
    return (
        <div className="form-group">
            <label className="input-label" htmlFor="amount">
                {value.label}
                {isRequired(value) ? '*' : ''}
            </label>

            <input
                type="text"
                placeholder={placeholder}
                value={value.value}
                className={'account-input' + (validation && validation.hasOwnProperty(name) ? ' account-input_error ' : '')}
                id={name}
                name={name}
                onChange={onChange}
            />
            <div className="dropdown">
                <button
                    className="dropdown-toggle text-dropdown text-dropdown-toggle"
                    type="button"
                    id="amount"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <EmptySelection>{dropPlaceholder}</EmptySelection>
                </button>
                <div className="dropdown-menu text-dropdown-menu register-dropdown-menu" aria-labelledby="amount">
                    {Object.keys(items).map(i => {
                        return (
                            <a key={i} className="dropdown-item register-dropdown-item" onClick={() => onSelect(i)}>
                                {items[i]}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
