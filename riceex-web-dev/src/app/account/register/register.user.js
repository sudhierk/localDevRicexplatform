import React from 'react';
import FormInputField from '../../components/form/FormInputField';
import FormPhoneField from '../../components/form/FormPhoneField';

export const RegisterUser = ({state, setField, validation, onNext}) =>
    <div className="container">
        <form onSubmit={(e) => onNext(e)}>
            <div className="row">
                <div className="col-12 col-md-6 mb-3">
                    <FormInputField
                        name="firstName"
                        maxLength="50"
                        validation={validation}
                        value={state.firstName}
                        onChange={(e) => setField(e.target.name, e.target.value)}
                    />
                </div>
                <div className="col-12 col-md-6 mb-3">
                    <FormInputField
                        name="lastName"
                        maxLength="50"
                        validation={validation}
                        value={state.lastName}
                        onChange={(e) => setField(e.target.name, e.target.value)}
                    />
                </div>

            </div>

            <div className="row">
                <div className="col-12 col-md-6 mb-3">
                    <FormInputField
                        name="email"
                        maxLength="50"
                        validation={validation}
                        value={state.email}
                        onChange={(e) => setField(e.target.name, e.target.value)}
                    />
                </div>
                <div className="col-12 col-md-6 mb-3">
                    <FormInputField
                        name="confirmEmail"
                        maxLength="50"
                        validation={validation}
                        value={state.confirmEmail}
                        onChange={(e) => setField(e.target.name, e.target.value)}
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-12 col-md-6 mb-3">
                    <FormPhoneField
                        placeholder="Enter phone number"
                        value={state.phone}
                        name="phone"
                        validation={validation}
                        onChange={value => setField('phone', value)}
                    />
                </div>
                <div className="col-12 col-md-6 mb-3">
                    <FormInputField
                        maxLength="140"
                        name="companyRole"
                        validation={validation}
                        value={state.companyRole}
                        onChange={(e) => setField(e.target.name, e.target.value)}
                    />
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 justify-content-center">
                    <span className="register__note">
                        Please, be careful with the information, you will not be able to edit it later without contacting administrator.
                    </span>
                </div>
                <div className="col-12">
                    <span className="register-required">*Required fields</span>
                    <button
                        onClick={(e) => onNext(e)}
                        className="btn btn--blue register-submit-user d-block">
                        Next
                    </button>
                </div>
            </div>
        </form>
    </div>;