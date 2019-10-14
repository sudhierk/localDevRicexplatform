import React from 'react';
import Dropzone from 'react-dropzone';

import FaFilePdfO from 'react-icons/lib/fa/file-pdf-o';
import FaFileWordO from 'react-icons/lib/fa/file-word-o';

const acceptedFileTypes = 'application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const FileUploadModal = ({visibility, name, onDrop, file, close, docName, postDoc, accept = acceptedFileTypes, onShareChange, shareWithBuyer}) => (
    <div className={`modal__container ${visibility ? '' : 'd-none'}`}>
        <form onSubmit={e => postDoc(e)} encType="multipart/form-data" className="modal__wrapper modal__wrapper_upload">
            <span className="modal__close" onClick={close}/>
            <h3 className="modal__heading modal__heading_upload">Upload Document</h3>
            <div className="modal__line">
                <span>Document</span>
                <Dropzone
                    className="upload"
                    activeClassName="upload__active"
                    accept={accept}
                    onDrop={(filesAccept, filesNotAccept) => onDrop(filesAccept, filesNotAccept, name)}
                >
                    {file ? (
                        file[0].type === 'application/pdf' ? (
                            <FaFilePdfO className="icon"/>
                        ) : (
                            <FaFileWordO className="icon"/>
                        )
                    ) : null}
                    {file ? <p className="file">{file[0].name}</p> : <p>Choose File (or Drop)</p>}
                </Dropzone>
            </div>
            <div className="modal__line">
                <span>Document type</span> {docName}
            </div>
            {onShareChange && (
                <div className="modal__line">
                    <span>Share for review with buyer</span>
                    <input type="checkbox" name="shareWithBuyer" onChange={onShareChange} checked={shareWithBuyer} />
                </div>
            )}
            <div className="modal__line modal__line_buttons">
                {file && (
                    <React.Fragment>
                        <button className="modal__button" type="submit">
                            Upload Document
                        </button>
                        <span className="modal__cancel" onClick={close}>
                            Cancel
                        </span>
                    </React.Fragment>
                )}
            </div>
        </form>
    </div>
);

export default FileUploadModal;
