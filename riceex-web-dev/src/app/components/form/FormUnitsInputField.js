import React, { Component } from 'react';
import styled from 'styled-components';
import './FormUnitsInputField.css';
import Cleave from 'cleave.js/react';

const EmptySelection = styled.span`
  color: #546071;
`;


export default class FormUnitsInputField extends Component {
    state = {
        initialValue: '',
        initialValueSet: false
    };

    constructor(props) {
        super(props);
    }

    componentDidUpdate() {
        const value = this.props.value.value;
        if (!this.state.initialValueSet && !!value || (value !== this.state.initialValue)) {
            this.setState({initialValue: value, initialValueSet: true});
        }
    }

    render() {
        const {
            name,
            value,
            dropValue,
            items,
            validation,
            onChange,
            onSelect,
            placeholder = 'Amount',
            dropPlaceholder,
            dropName,
            numeralIntegerScale
        } = this.props;
        return (
            <div className="form-unitsInput">
                <label className="label" htmlFor="amount">
                    {value.label}
                    {value.required ? '*' : ''}
                </label>

                <Cleave
                    placeholder={placeholder}
                    value={this.state.initialValue}
                    className={'input' + (validation && validation.hasOwnProperty(name) ? ' input_error ' : '')}
                    id={name}
                    name={name}
                    onChange={onChange}
                    options={{
                        numeral: true,
                        numeralDecimalMark: ',',
                        delimiter: '.',
                        numeralIntegerScale
                    }}
                />
                <div className="dropdown">
                    <button
                        className="dropdown-toggle text-dropdown text-dropdown-toggle"
                        type="button"
                        id={dropName}
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        {items[dropValue.value] ? items[dropValue.value] :
                            <EmptySelection>{dropPlaceholder}</EmptySelection>}
                    </button>
                    <div className="dropdown-menu text-dropdown-menu register-dropdown-menu" aria-labelledby={dropName}>
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
    }
}