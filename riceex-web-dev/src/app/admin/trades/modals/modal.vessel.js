import React from 'react';
import FormDateField from '../../../components/form/FormDateField';
import { DATEFORMAT } from '../../../../services/service.values';
import moment from 'moment-timezone';
import FormSelectDropdown from '../../../components/form/FormSelectDropdown';
import FormDateFieldFromTo from '../../../components/form/FormDateFieldFromTo';
import FormInputField from '../../../components/form/FormInputField';

export const nominateVessel = ({dateFrom, dateTo, onClose, updateMessage, updateDateFrom, updateDateTo, onSubmit, inspectors, onSelectInspection, inspector, isSeller, name, onChangeName, showError}) => (
    <React.Fragment>
        <div className='modal__container vessel_modal'>

            <form
                noValidate={true}
                className='modal__wrapper'
                onSubmit={onSubmit}>
                <span className='modal__close' onClick={onClose}/>
                <h3 className='modal__heading'>Nominate a vessel</h3>
                <textarea
                    onChange={updateMessage}
                    className='modal__textarea'
                    placeholder={`Please specify vessel nomination instruction`}
                    required
                />

                <div className="row mb-3">
                    <div className='col-sm-6'>
                        <FormInputField
                            value={{label: 'Vessel name', value: name, required: true}}
                            onChange={e => onChangeName(e.target.value)}
                            name="name"
                            type="text"
                        />
                        {isSeller && (
                            <div className="form-select">
                                <div className="label">
                                    Nominate to*
                                </div>
                                <div className="wrapper">
                                    <select className="select"
                                            name='select-inspector'
                                            id='select-inspector'
                                            disabled={!!inspector}
                                            onChange={e => {
                                                onSelectInspection(e.target.value);
                                            }}
                                            value={inspector}
                                            required={true}
                                    >
                                        <option value=''>Select Inspection Company</option>
                                        {Object.keys(inspectors).map(i => {
                                            return (
                                                <option key={i} value={i}>
                                                    {inspectors[i]}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="col-sm-6">
                        <FormDateFieldFromTo
                            minDate={null}
                            required={true}
                            nameStart="validateDateFrom"
                            itemStart={{value: dateFrom, label: 'Laycan Date From', required: true}}
                            onSelect={(name, date) => name === 'validateDateFrom' ? updateDateFrom(date) : updateDateTo(date)}
                            nameEnd="validateDateTo"
                            itemEnd={{value: dateTo, label: 'Laycan Date To', required: true}}
                            popperPlacement="top-start"
                        />
                    </div>
                </div>
                {showError && (
                    <div className="trades-dtls__error-message text-center">
                        Please, complete all required fields before submitting
                    </div>
                )}
                <button type='submit' className='modal__button'>
                    Submit
                </button>
            </form>
        </div>
    </React.Fragment>
);

export const approveNominatedVessel = ({nomination, dateFrom, dateTo, inspector, inspectors, onSelectInspection, onApprove, onReject, onClose, showError}) => {
    return (
        <React.Fragment>
            <div className='modal__container vessel_modal'>
                <form className='modal__wrapper' onSubmit={onApprove} noValidate={true}>
                    <span className='modal__close' onClick={onClose}/>
                    <h3 className='modal__heading'>Approve Vessel Nomination</h3>

                    <textarea
                        readOnly={true}
                        className='modal__textarea'
                        value={nomination}
                        required
                    />
                    <div className='row mb-3'>
                        <div className='col-sm-6'>
                            <span>Laycan Date:</span> From {dateFrom && moment(dateFrom).format(DATEFORMAT)} to {dateTo && moment(dateTo).format(DATEFORMAT)}
                        </div>
                    </div>

                    <div className='row mb-3'>
                        <div className='col-sm-6'>
                            <div className="form-select">
                                <div className="label">
                                    Nominate to*
                                </div>
                                <div className="wrapper">
                                    <select className="select"
                                            name='select-inspector'
                                            id='select-inspector'
                                            disabled={!!inspector}
                                            onChange={e => {
                                                onSelectInspection(e.target.value);
                                            }}
                                            value={inspector}
                                            required={inspector ? null : true}
                                    >
                                        <option value=''>Select Inspection Company</option>
                                        {Object.keys(inspectors).map(i => {
                                            return (
                                                <option key={i} value={i}>
                                                    {inspectors[i]}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    {showError && (
                        <div className="trades-dtls__error-message text-center">
                            Please, complete all required fields before submitting
                        </div>
                    )}
                    <div className='row'>
                        <button type='submit' className='col-sm-3 modal__button'>
                            Approve
                        </button>
                        <button type='button' className='col-sm-3 modal__button' onClick={onReject}>
                            Reject
                        </button>
                    </div>
                </form>
            </div>
        </React.Fragment>

    )
};