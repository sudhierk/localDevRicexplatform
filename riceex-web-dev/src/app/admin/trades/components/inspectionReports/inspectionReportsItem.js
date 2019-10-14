import React from 'react';
import moment from 'moment';

export default function InspectionReportsItem(props) {
    return (
        <div className="inspection-reports__item">
            <span className="inspection-reports__item__name">{props.report.name}</span>
            <span className="inspection-reports__item__info">| {moment(props.report.CreatedAt).format('DD/MM/YYYY HH:mm')}</span>
            <span className="inspection-reports__item__preview-button">
                <button type="button" className="btn btn-link" onClick={props.onPreviewClick}>Preview</button>
            </span>
        </div>
    )
}