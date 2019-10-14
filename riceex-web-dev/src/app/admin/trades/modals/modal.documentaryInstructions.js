import React, { Component } from 'react';
import DocumentaryInstructions from '../components/documentDocInst';


class DocumentaryInstructionsModal extends Component {
    render() {
        return (
            <div className="modal__container documentary-instructions-modal">
                <div className="modal__wrapper">
                    <span className="modal__close" onClick={this.props.onClose}/>
                    <DocumentaryInstructions {...this.props} isModal={true} />
                </div>
            </div>
        )
    }
}

export default DocumentaryInstructionsModal;