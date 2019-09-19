import React, { Component } from 'react';
import Comment from './Comment';
import Select from 'react-select';
import moment from 'moment';
import IoIosArrowUp from 'react-icons/lib/io/ios-arrow-up';
import FaComment from 'react-icons/lib/fa/comment';
import Preloader from '../../../../components/preloader/Preloader';

class Comments extends Component {
    state = {
        text: '',
        receiver: null,
        replyTo: null,
        replyMessage: ''
    };

    componentDidMount() {
        const {tradeId, shipmentId, documentId} = this.props.documentParams;
        if (!this.props.loadingDocumentComments) {
            this.props.GetDocumentComments(tradeId, shipmentId, documentId);
        }
        this.handleChangeReceiver(this.props.commentReceivers[0]);
    }

    handleChangeText = (e) => {
        this.setState({
            text: e.target.value
        })
    };

    handleChangeReceiver = (receiver) => {
        this.setState({
            receiver
        });
    };

    postRootComment = (e) => {
        e.preventDefault();
        if (!this.state.text) {
            return;
        }
        const {tradeId, shipmentId, documentId} = this.props.documentParams;
        this.props.PostDocumentComment(tradeId, shipmentId, documentId, {
            text: this.state.text,
            receiver: this.state.receiver.value
        });
        this.setState({
            text: ''
        });
    };

    postComment(event, message) {
        event.preventDefault();
        const {tradeId, shipmentId, documentId} = this.props.documentParams;
        this.props.PostDocumentComment(tradeId, shipmentId, documentId, {
            text: this.state.replyMessage,
            receiver: message.UserID,
            parentId: message.ID
        });
        this.setState({
            replyTo: null,
            replyMessage: ''
        });
    }

    reply(messageId) {
        this.setState(prevState => ({
            replyTo: messageId === prevState.replyTo ? null : messageId
        }));
    }

    getReplyMessage(value) {
        this.setState({
            replyMessage: value
        });
    }

    render() {
        return (
            <div className="trades-dtls__comments-wrapper">
                <div className="trades-dtls__comments-heading">
                    <div className="trades-dtls__comments-heading__counter">
                        Comments
                        {this.props.comments.count > 0 && (
                            <React.Fragment>
                                <FaComment/> {this.props.comments.count}
                            </React.Fragment>
                        )}
                    </div>
                    <div onClick={this.props.onCollapse}>
                        <IoIosArrowUp/>
                    </div>
                </div>
                {this.props.comments.data.map((comment, i) => {
                    return (
                        <Comment
                            replyTo={this.state.replyTo}
                            key={i}
                            message={comment}
                            onSubmit={(e, message) => this.postComment(e, message)}
                            onClick={commentID => this.reply(commentID)}
                            onChange={value => this.getReplyMessage(value)}
                            user={this.props.user}
                        />
                    );
                })}
                <Preloader style="swirl" loading={this.props.loadingDocumentComments} />
                <form onSubmit={this.postRootComment}>
                    <div className="trades-dtls__comment-writing row">
                        <div className="col-8">
                        <textarea
                            className="trades-dtls__comment-area form-control"
                            name="comment"
                            id="comment"
                            value={this.state.text}
                            onChange={this.handleChangeText}
                            placeholder="Add your message..."
                            required={true}
                        />
                        </div>
                        <div className="col-4">
                            <div className="row align-items-center">
                                <div className="col-4 pr-0">
                                    <label>Assigned to:</label>
                                </div>
                                <div className="col-8">
                                    <Select
                                        value={this.state.receiver}
                                        options={this.props.commentReceivers}
                                        onChange={this.handleChangeReceiver}
                                    />
                                </div>
                            </div>
                            <div className="trades-dtls__send-comment-container">
                                <button
                                    disabled={this.props.loadingDocumentComments}
                                    className="btn btn-outline-primary"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

export default Comments;
