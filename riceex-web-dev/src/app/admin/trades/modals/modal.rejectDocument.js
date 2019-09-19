import React, { Component } from 'react';

class RejectDocumentModal extends Component {
    state = {
        reason: ''
    };

    handleChange = (e) => {
        this.setState({reason: e.target.value});
    };

    render() {
        return (
            <div className="modal__container">
                <form
                    className="modal__wrapper"
                    onSubmit={e => {
                        e.preventDefault();
                        this.props.onSubmit(this.state.reason);
                    }}>
                    <span className="modal__close" onClick={this.props.onClose}/>
                    <h3 className="modal__heading">Reject Document</h3>
                    <textarea
                        className="modal__textarea"
                        placeholder="Reason for document rejection"
                        value={this.state.reason}
                        onChange={this.handleChange}
                        required
                    />
                    <button type="submit" className="modal__button">
                        Reject
                    </button>
                </form>
            </div>
        )
    }
}

export default RejectDocumentModal;