import React from 'react';
import moment from 'moment';
import { DATEFORMATHOURS } from '../../../../services/service.values';

const Reply = ({replies, onClick, onSubmit, onChange, showReplyButton, loading}) => {
    const checkDate = (date) => {
        if (moment.duration(moment(new Date()).diff(date)).humanize() < 24 * 60 * 60) {
            // console.log(moment.duration(moment(new Date()).diff(date)).humanize());
            return moment.duration(moment(new Date()).diff(date)).humanize() + ' ago'
        } else {
            return moment(date).format(DATEFORMATHOURS)
        }
    }
    const replyRender = (reply, i) => {
        return (
            <div className="request-dtls__reply" key={i}>
                <span className="request-dtls__comment-author">{reply.FirstName} {reply.LastName}, {reply.Name}</span>
                <span className="request-dtls__comment-time">{checkDate(reply.CreatedAt)}</span>
                {showReplyButton && <span className="request-dtls__reply-button" onClick={() => onClick(reply.ID)}>Reply</span>}
                <p className="request-dtls__comment-text">{reply.Text}</p>
                {
                    (reply.isReplying)
                        ? <div className="request-dtls__response">
                            <form onChange={(e) => onChange(e.target.value)}
                                  style={{display: 'flex', alignItems: 'center'}}>
                                <textarea className="txtarea" name="reply" id="reply" cols="30" rows="1"></textarea>
                                <button disabled={loading} onClick={(e) => onSubmit(e, reply.ID, e.target.value)}
                                      className="btn-sendmessage">Send</button>
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
