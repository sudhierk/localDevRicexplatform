import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FaComment from 'react-icons/lib/fa/comment';
import Comments from './comments/Comments';
import moment from 'moment';
import { DOCUMENT_TYPES, STATUS_APPROVED_BY_BUYER, STATUS_REJECTED_BY_BUYER } from '../services/documents.service';

class DocumentCard extends Component {
    state = {
        showComments: false
    };

    componentDidMount() {
        if (this.canLeaveComment()) {
            const {tradeId, shipmentId, documentId} = this.props.documentParams;
            this.props.GetDocumentComments(tradeId, shipmentId, documentId);
        }
    }

    constructor(props) {
        super(props);
    }

    canLeaveComment() {
        return this.props.documentParams.documentId !== null && this.props.permissions.canComment;
    }

    handleShowComments = () => {
        this.setState(prevState => ({
            showComments: !prevState.showComments
        }));
    };

    handlePreviewClick = (e) => {
        if ([DOCUMENT_TYPES.INVOICE, DOCUMENT_TYPES.BILL].includes(this.props.documentName)) {
            return;
        }
        e.preventDefault();
        this.props.openPreviewDocument(this.props.documentParams.tradeId, this.props.documentParams.shipmentId, this.props.document.Files, this.props.documentInfo.name)
    };

    getPreviewLink = () => {
        return this.props.documentInfo.type
            ? this.props.documentName === DOCUMENT_TYPES.BILL
                ? `${this.props.match.url}/shipment/${this.props.documentParams.shipmentId}/documents/${this.props.documentInfo.url}/preview`
                : `${this.props.match.url}/documents/${this.props.documentInfo.url}/preview`
            : ``;
    };

    render() {
        return (
            <React.Fragment>
                <div className={`trades-dtls__doc-item trades-dtls__doc-item_${this.props.status.docClassName || this.props.status.className}`}>
                    <div>
                        {/*if document from back got value that's mean, that he is filled */}
                        <span className="trades-dtls__doc-name">{this.props.documentInfo.name}</span>
                        {this.props.document && (
                            <span className="trades-dtls__doc-info">
                                | Uploaded by {this.props.document.author} {moment(this.props.document.CreatedAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                        )}
                        {this.props.required && (
                            <span className={`trades-dtls__doc-status trades-dtls__doc-status_required`}>
                                Required
                            </span>
                        )}
                        {this.props.document && (
                            <React.Fragment>
                                {this.props.document.approvedByBuyer && this.props.status.status !== STATUS_APPROVED_BY_BUYER && (
                                    <span
                                        className={`trades-dtls__doc-status trades-dtls__doc-status_approved`}
                                    >
                                        Approved by buyer
                                    </span>
                                )}
                                {this.props.document.rejectedByBuyer && this.props.status.status !== STATUS_REJECTED_BY_BUYER && (
                                    <span
                                        className={`trades-dtls__doc-status trades-dtls__doc-status_rejected`}
                                    >
                                        Rejected by buyer
                                    </span>
                                )}
                            </React.Fragment>
                        )}
                        <span
                            className={`trades-dtls__doc-status trades-dtls__doc-status_${this.props.status.className}`}
                        >
                            {this.props.status.text}
                        </span>
                        {this.props.permissions.canPreview && (
                            <Link
                                to={this.getPreviewLink()}
                                className="trades-dtls__doc-preview"
                                onClick={this.handlePreviewClick}
                            >
                                Review
                            </Link>
                        )}
                        <p className="trades-dtls__doc-abstract">{this.props.documentInfo.text}</p>
                    </div>
                    <div className="d-flex">
                        {this.canLeaveComment() && (
                            <div className="doc-comment__container" onClick={this.handleShowComments}>
                                <span className="doc-comment__button">
                                    {this.props.loadingDocumentComments ?
                                        <i className="k-spinner--spin comments-spinner--small"/> : <FaComment/>}
                                    <span>
                                        {this.props.comments.count === 0 ? 'Leave comment' : `${this.props.comments.count} comment${this.props.comments.count > 1 ? 's' : ''}`}
                                    </span>
                                </span>
                            </div>
                        )}
                        <div className="d-flex flex-column align-items-end">
                            {this.props.showBillOfLadingRequired &&
                            <p className="warning-message">*You need to fill in Bill of Lading first</p>}
                            {this.props.renderButton({
                                ...this.props.documentParams,
                                status: this.props.status,
                                name: this.props.documentName,
                                info: this.props.documentInfo
                            }, this.props.permissions)}
                        </div>
                    </div>
                </div>
                {this.state.showComments && (
                    <Comments
                        user={this.props.user}
                        onCollapse={this.handleShowComments}
                        documentInfo={this.props.documentInfo}
                        document={this.props.document}
                        documentParams={this.props.documentParams}
                        comments={this.props.comments}
                        commentReceivers={this.props.commentReceivers}
                        loadingDocumentComments={this.props.loadingDocumentComments}
                        GetDocumentComments={this.props.GetDocumentComments}
                        PostDocumentComment={this.props.PostDocumentComment}
                    />
                )}
            </React.Fragment>
        );
    }
}

export default DocumentCard;
