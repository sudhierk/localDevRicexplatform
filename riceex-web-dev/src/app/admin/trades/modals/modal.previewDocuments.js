import React from 'react';
import PreviewPDF from '../../../components/PreviewPDF/PreviewPDF';

const PreviewDocumentsModal = ({files, name, onClose}) => {
    const getPreviewWidth = () => {
        const containerWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.95 - 70;
        return containerWidth / files.length;
    };

    return (
        <div className="modal__container doc-preview-modal">
            <div className="modal__wrapper">
                <span className="modal__close" onClick={onClose}/>
                <h3 className='modal__heading'>Preview Document</h3>
                <div className="doc-preview-modal__type">
                    <div className="doc-preview-modal__type__title">
                        Document type
                    </div>
                    <div className="doc-preview-modal__type__value">
                        {name}
                    </div>
                </div>
                <div className="d-flex" id="doc-preview-container">
                    {files.map((file, index) => (
                        <div className="modal__preview-file" key={`file-${file.id}`} id={`file-${file.id}`}>
                            <div className="doc-preview-modal__version">{index === 0 ? 'Current version' : 'Earlier version'}</div>
                            <PreviewPDF width={getPreviewWidth()} file={file}/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};

export default PreviewDocumentsModal;
