import React, { Component } from 'react';
import { EnumsService } from '../../../services/service.utils';

import {
    FormRow,
    VirtualDropdown,
} from '../../components/form';

import { COMPANY_TYPES } from '../../../services/service.values';
import Preloader from '../../components/preloader/Preloader';
import { SystemApi } from '../../../services/service.api';
import FormInputField from '../../components/form/FormInputField';
import FormPhoneField from '../../components/form/FormPhoneField';

const Countries = EnumsService.countries();
const countriesOptions = Object.keys(Countries).map((key) => ({
    value: key,
    label: Countries[key]
}));
const companyTypeOptions = Object.keys(COMPANY_TYPES).map(key => ({
    value: key,
    label: COMPANY_TYPES[key]
}));

export class RegisterCompany extends Component {
    state = {
        companyType: ''
    };

    render() {

        let {state, setField, validation, onComplete, isRegistering} = this.props;
        return (
            <div className="col-12">
                <form onSubmit={e => onComplete(e)}>
                    <FormRow>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="name"
                                maxLength="50"
                                value={state.name}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6 mb-3">
                            <VirtualDropdown
                                validation={validation}
                                name="companyType"
                                label="Company Type"
                                required={true}
                                items={companyTypeOptions}
                                onChange={val => {
                                    setField('companyType', val.value);
                                }}
                                value={{value: state.companyType.value, label: COMPANY_TYPES[state.companyType.value]}}
                            />
                        </div>
                    </FormRow>
                    <FormRow>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="taxNumber"
                                label="Tax Number*"
                                maxLength="75"
                                value={state.taxNumber}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6 mb-3">
                            <FormPhoneField
                                placeholder="Enter phone number"
                                value={state.phone}
                                name="phone"
                                validation={validation}
                                onChange={value => setField('phone', value)}
                            />
                        </div>
                    </FormRow>
                    <FormRow>
                        <div className="col-12 col-md-6 mb-3">
                            <VirtualDropdown
                                validation={validation}
                                name="country"
                                label="Country"
                                items={countriesOptions}
                                required={true}
                                onChange={
                                    val => {
                                        setField('country', val.value);
                                    }
                                }
                                value={{value: state.country.value, label: Countries[state.country.value]}}
                            />
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="city"
                                required={state.city.required}
                                value={state.city}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>
                    </FormRow>
                    <FormRow>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="address1"
                                label="Address line 1*"
                                maxLength="120"
                                value={state.address1}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="address2"
                                label="Address line 2*"
                                maxLength="120"
                                value={state.address2}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>
                    </FormRow>
                    <FormRow>
                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="site"
                                maxLength="50"
                                value={state.site}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>

                        <div className="col-12 col-md-6 mb-3">
                            <FormInputField
                                validation={validation}
                                name="contactPerson"
                                label="Contact Person"
                                maxLength="50"
                                value={state.contactPerson}
                                onChange={e => setField(e.target.name, e.target.value)}
                            />
                        </div>
                    </FormRow>

                    <div className="row mt-4">
                        <div className="col-12 justify-content-center">
                            <span className="register__note">
                                Please, be careful with the information, you will not be able to edit it later without contacting administrator.
                            </span>
                        </div>
                        <div className="col-12">
                            <span className="register-required register-required_company">*Required fields</span>
                            <button
                                disabled={isRegistering}
                                onClick={e => onComplete(e)}
                                className="btn btn--blue register-button-company"
                            >
                                <Preloader style="dots" loading={isRegistering}>
                                    Register Company
                                </Preloader>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}
