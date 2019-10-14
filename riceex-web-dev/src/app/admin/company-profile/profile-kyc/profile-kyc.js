import React, { Component } from 'react';
import { Field, Form, Formik } from 'formik';

import './profile-kyc.css'
import { KycCompanyDetails } from './kyc-company-details';
import { KycPrincipalOfficers } from './kyc-principal-officers';
import { KycTradeReferences } from './kyc-trade-references';
import { KycAuthorizedOfficers } from './kyc-authorized-officers';
import { KycApi } from '../../../../services/service.api';
import { KycSchema } from './kyc-schema';
import { DATEFORMAT } from '../../../../services/service.values';
import moment from 'moment';
import { FormikDateField } from '../../../components/custom-formik/formik-date-field';
import Preloader from '../../../components/preloader/Preloader';
import PreviewDocumentsModal from '../../trades/modals/modal.previewDocuments';

const STATUS_SUBMITTED = 'SUBMITTED';
const STATUS_EDITING = 'EDITING';
const STATUS_NEW = 'NEW';

const CompanyInitialState = {
    name: '',
    phone: '',
    address1: '',
    address2: '',
    email: '',
    tax: '',
    companyType: '',
    certificateOfIncorporationName: '',
    certificateOfIncorporationData: '',
    certificateOfIncorporationMime: '',
    companyShareholders: [{
        name: '',
        percentage: undefined
    }],
    companyUBOS: [{
        name: '',
        passportName: '',
        passportData: '',
        passportMime: '',
    }],
    businessNature: '',
    isMemberOf: '',
    doHaveCertifications: '',
    ceo: '',
    cfo: '',
    marketingManager: '',
    operationsManager: '',
    site: '',
    contact: '',
    companyTradeReferences: [{
        companyName: '',
        contactName: '',
        phone: '',
        address: '',
        email: ''
    }],
    authorizedOfficers: [{
        name: '',
        position: ''
    }],
    Date: moment()
};

class ProfileKyc extends Component {
    state = {
        form: {},
        initialLoading: true,
        loading: false,
        autoSaveTimer: null,
        status: STATUS_NEW,
        previewDocument: null
    };

    componentDidMount() {
        this.loadKyc();
    }

    componentWillUnmount() {
        if (this.state.autoSaveTimer) {
            clearInterval(this.state.autoSaveTimer);
        }
    }

    loadKyc() {
        this.setInitialLoading(true);
        KycApi.get()
            .catch(() => {
                this.setInitialLoading(false);
            })
            .then(response => {
                this.setFormData(response.data);
                this.setInitialLoading(false);
                if (this.state.status !== STATUS_SUBMITTED) {
                    this.setAutoSaveTimer();
                }
            })
    }

    setAutoSaveTimer() {
        const saveButton = document.getElementById('save-kyc-button');
        const autoSaveTimer = setInterval(() => {
            this.setState({autoSave: true});
            if (saveButton) {
                saveButton.click();
            }
        }, 60000);
        this.setState({autoSaveTimer});
    }

    setInitialLoading(initialLoading) {
        this.setState({initialLoading});
    };

    setLoading(loading) {
        this.setState({loading});
    };

    setFormData(data) {
        const company = data.Company;
        Object.keys(company).forEach(key => {
            if (company[key] === null || company[key] === '') {
                delete company[key];
            }
        });
        this.setState({
            form: {
                ...CompanyInitialState,
                ...company,
                Date: moment() // has to be always current date
            },
            status: data.Status
        })
    }

    onSave = (values) => {
        if (!this.state.autoSave) {
            this.setLoading(true);
        }
        KycApi.save(values)
            .catch(error => {
                console.error(error);
                this.setLoading(false);
                this.setState({autoSave: false});
            })
            .then(() => {
                this.setLoading(false);
                this.setState({autoSave: false});
            })
    };

    onSubmit = values => {
        clearInterval(this.state.autoSaveTimer);
        this.setLoading(true);
        KycApi.submitForReview(values)
            .catch(error => {
                console.error(error);
                this.setLoading(false);
            })
            .then(() => {
                this.setLoading(false);
                this.setState({status: STATUS_SUBMITTED});
            })
    };

    onDocumentPreview = (file, name) => {
        this.setState({
            previewDocument: {
                files: [file],
                name
            }
        });
    };

    onClosePreview = () => {
        this.setState({
            previewDocument: null
        })
    };

    render() {
        return (
            <div className="profile-kyc">
                <Preloader style="overflow-spinner" loading={this.state.loading} />
                <Preloader style="swirl" loading={this.state.initialLoading}>
                    <Formik
                        initialValues={this.state.form}
                        validationSchema={KycSchema}
                        onSubmit={values => {
                            this.onSubmit(values);
                        }}
                        render={({values, setFieldValue}) => (
                            <Form>
                                <fieldset disabled={this.state.status === STATUS_SUBMITTED}>
                                    <div className="row">
                                        <div className="col-lg-6 col-12">
                                            <KycCompanyDetails onDocumentPreview={this.onDocumentPreview} values={values} setFieldValue={setFieldValue}/>
                                        </div>
                                        <div className="col-lg-6 col-12">
                                            <KycPrincipalOfficers/>
                                            <KycTradeReferences values={values}/>
                                            <KycAuthorizedOfficers values={values}/>
                                        </div>
                                    </div>
                                    <hr/>
                                    <div className="row align-items-center">
                                        <div className="col-12 col-lg-6">
                                            <Field
                                                component={FormikDateField}
                                                dateFormat={DATEFORMAT}
                                                disabled={true}
                                                name={`Date`}
                                                label={'Date'}
                                            />
                                        </div>
                                        {this.state.status !== STATUS_SUBMITTED && (
                                            <div className="col-12 col-lg-6">
                                                <div className="row">
                                                    <div className="col-6">
                                                        <button className="profile-kyc__submit" id="save-kyc-button" type="button" onClick={() => this.onSave(values)}>Save Draft</button>
                                                    </div>
                                                    <div className="col-6">
                                                        <button className="profile-kyc__submit" type="submit">Submit Form for Review</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </fieldset>
                            </Form>
                        )}
                    >
                    </Formik>
                    {this.state.previewDocument && (
                        <PreviewDocumentsModal
                            {...this.state.previewDocument}
                            onClose={this.onClosePreview}
                        />
                    )}
                </Preloader>
            </div>
        );
    }
}

export default ProfileKyc;
