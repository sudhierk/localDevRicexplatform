import React from 'react';
import moment from 'moment';
import { DATEFORMATHOURS } from '../../../../../services/service.values';
import FaEyeSlash from 'react-icons/lib/fa/eye-slash';

const Reply = ({replies, onClick, onSubmit, onChange, replyTo, user}) => {
    const getFormattedDate = (date) => {
        if (moment.duration(moment(new Date()).diff(date)) < 24 * 60 * 60) {
            return moment.duration(moment(new Date()).diff(date)).humanize() + ' ago'
        } else {
            return moment(date).format(DATEFORMATHOURS)
        }
    };

    const replyRender = (reply, i) => {
        return (
            <div className="trades-dtls__reply" key={i}>
                <span
                    className="trades-dtls__comment-author">{reply.FirstName} {reply.LastName}, {reply.Name} ({reply.SenderRole})</span>
                <span className="trades-dtls__comment-time">
                    {getFormattedDate(reply.CreatedAt)} to {reply.ReceiverFullName}, {reply.ReceiverName} ({reply.ReceiverRole})
                </span>
                <span className="trades-dtls__private-icon">
                    <FaEyeSlash/>
                </span>
                {reply.UserID !== user.id &&
                <span className="trades-dtls__reply-button" onClick={() => onClick(reply.ID)}>Reply</span>
                }
                <p className="trades-dtls__comment-text">{reply.Text}</p>
                {
                    (reply.ID === replyTo)
                        ? <div className="trades-dtls__response">
                            <form onChange={(e) => onChange(e.target.value)}
                                  style={{display: 'flex', alignItems: 'center'}}>
                                <textarea required={true} className="form-control" name="reply" id="reply" cols="30"
                                          rows="1"/>
                                <button onClick={(e) => onSubmit(e, reply)} type="button"
                                        className="btn btn-outline-primary">Send
                                </button>
                            </form>
                        </div>
                        : null
                }

                {reply.children && reply.children.map((reply, i) => {
                    return replyRender(reply, i)
                })}
            </div>
        )
    }

    return (
        <React.Fragment>
            {replies.map((reply, i) => {
                return replyRender(reply, i)
            })}
        </React.Fragment>
    );
}

export default Reply;
