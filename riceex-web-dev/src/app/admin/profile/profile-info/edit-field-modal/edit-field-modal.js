import React, { Component } from 'react';
import FormPhoneField from '../../../../components/form/FormPhoneField';
import FormInputField from '../../../../components/form/FormInputField';

import './edit-field-modal.css';

class EditFieldModal extends Component {
    state = {
        value: null
    };

    onChange = value => {
        this.setState({value: value || ''});
    };

    renderInput = () => {
        const value = {
            value: this.state.value,
            required: true,
            label: this.props.label
        };
        switch (this.props.type) {
            case 'phone':
                return (
                    <FormPhoneField
                        placeholder="Enter phone number"
                        value={value}
                        name="phone"
                        onChange={this.onChange}
                    />
                );
            case 'text':
                return (
                    <FormInputField
                        name="confirmEmail"
                        maxLength="50"
                        value={value}
                        onChange={(e) => this.onChange(e.target.value)}
                    />
                );
            default:
                return null;
        }
    };

    onSubmit = event => {
        event.preventDefault();
        this.props.onSubmit(this.state.value);
    };

    render() {
        return (
            <div className="modal__container">
                <form className="modal__wrapper edit-field" onSubmit={this.onSubmit}>
                    <span className="modal__close" onClick={this.props.onClose}/>
                    <h3 className="modal__heading">Edit {this.props.label}</h3>
                    <div className="edit-field__description">
                        Please enter your new {this.props.descriptionLabel}
                    </div>
                    {this.renderInput()}
                    <div className="edit-field__required">*Required fields</div>
                    <button type="submit" className="modal__button">
                        Submit
                    </button>
                </form>
            </div>
        )
    }
}

export default EditFieldModal;