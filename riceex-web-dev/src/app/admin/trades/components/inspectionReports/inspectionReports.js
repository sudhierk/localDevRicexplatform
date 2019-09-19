import React, { Component } from 'react';
import Select from 'react-select';
import moment from 'moment';

import './inspectionReports.css';
import InspectionReportsItem from './inspectionReportsItem';
import PreviewPDF from '../../../../components/PreviewPDF/PreviewPDF';
import FileUploadModal from '../fileUploadModal';
import { authHeader, downloadInspectionReportTemplate, getFileUrl } from '../../../../../services/service.api';
import AccessControl, { INSPECTION_COMPANY } from '../../../../components/AccessControl';
import 'formdata-polyfill';

const Option = props => {
    const { innerProps, innerRef } = props;
    return (
        <div
            className={`inspection-reports__item inspection-reports__item--as-option${props.isSelected ? ' inspection-reports__item--selected' : ''}`}
            ref={innerRef} {...innerProps}
        >
            <span className="inspection-reports__item__name">{props.data.name}</span>
            <span className="inspection-reports__item__info">| {moment(props.data.CreatedAt).format('DD/MM/YYYY HH:mm')}</span>
        </div>
    );
};

export default class InspectionReports extends Component {
    state = {
        uploadModal: {
            opened: false,
            docName: '',
            document: null
        },
        previewDocument: {
            opened: false,
            file: null
        },
        reportOptions: [],
        selectedReport: null
    };

    constructor(props) {
        super(props);
    }

    getReportOptions() {
        const reports = [...this.props.reports];
        reports.shift();
        return reports.map(report => ({
            ...report,
            value: report.ID,
            label: report.name,
        }));
    }

    handleReportChange = (report) => {
        this.setState({
            selectedReport: report
        });
    };

    onDrop = (filesAccept, filesNotAccept, docName) => {
        if (filesAccept.length > 0) {
            this.setState((prevState) => ({
                uploadModal: {
                    ...prevState.uploadModal,
                    document: filesAccept
                }
            }))
        }
    };

    postDoc = (id, e) => {
        e.preventDefault();
        let newData = new FormData();
        newData.append('upload', this.state.uploadModal.document[0]);
        this.props.PostInspectionReport(id, newData);
        this.closeUploadModal();
    };

    openUploadModal = () => {
        this.setState(prevState => ({
            uploadModal: {
                opened: true,
                document: null,
                docName: ''
            }
        }));
    };

    handlePreviewClick = (id) => {
        this.setState({
            previewDocument: {
                opened: true,
                file: {
                    url: getFileUrl(id),
                    httpHeaders: authHeader().headers
                }
            }
        });
    };

    closePreviewModal = () => {
        this.setState({
            previewDocument: {
                opened: false,
                file: null
            }
        });
    };

    closeUploadModal = () => {
        this.setState(prevState => ({
            uploadModal: {
                ...prevState.uploadModal,
                opened: false
            }
        }))
    };

    render() {
        return (
            <div className="inspection-reports">
                <div className="inspection-reports__content">
                    <div className="inspection-reports__heading">
                        <div className="inspection-reports__recent-version">Recent Version</div>
                        <AccessControl user={this.props.user} companyTypes={[INSPECTION_COMPANY]}>
                            <div className="inspection-reports__buttons">
                                <button type="button" onClick={this.openUploadModal}>Upload</button>
                                <button type="button" onClick={downloadInspectionReportTemplate}>Get template</button>
                            </div>
                        </AccessControl>
                    </div>
                    {this.props.reports[0] && (
                        <InspectionReportsItem
                            report={this.props.reports[0]}
                            onPreviewClick={(e) => this.handlePreviewClick(this.props.reports[0].ID)}
                        />
                    )}
                    <div className="row mb-2">
                        <div className="col-10">
                            <div className="row inspection-reports__select-version">
                                <div className="col-4">
                                    <label htmlFor="selectVersion">Preview earlier versions</label>
                                </div>
                                <div className="col-8">
                                    <Select
                                        components={{Option}}
                                        options={this.getReportOptions()}
                                        onChange={this.handleReportChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {this.state.selectedReport && (
                        <InspectionReportsItem
                            report={this.state.selectedReport}
                            onPreviewClick={() => this.handlePreviewClick(this.state.selectedReport.ID)}
                        />
                    )}
                </div>
                <FileUploadModal
                    visibility={this.state.uploadModal.opened}
                    onDrop={(filesAccept, filesNotAccept, docName) => this.onDrop(filesAccept, filesNotAccept, docName)}
                    name="Inspection report"
                    docName="Inspection report"
                    postDoc={e => this.postDoc(this.props.match.params.id, e)}
                    file={this.state.uploadModal.document}
                    close={this.closeUploadModal}
                    accept="application/pdf"
                />
                {this.state.previewDocument.opened && (
                    <div className="modal__container">
                        <div className="modal__wrapper">
                            <span className="modal__close" onClick={this.closePreviewModal}/>
                            <PreviewPDF file={this.state.previewDocument.file}/>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}
