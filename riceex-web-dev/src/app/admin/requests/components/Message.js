import React from 'react';
import moment from 'moment';
import nl2br from 'react-nl2br';
//COMPONENTS
import Reply from './Reply';
import { DATEFORMATHOURS } from '../../../../services/service.values';

const Message = ({message, onClick, messagePosition, onSubmit, onChange, showReplyButton, loading}) => {
    const checkDate = (date) => {
        if (moment.duration(moment(new Date()).diff(date)).humanize() < 24 * 60 * 60) {
            // console.log(moment.duration(moment(new Date()).diff(date)).humanize());
            return moment.duration(moment(new Date()).diff(date)).humanize() + ' ago'
        } else {
            return moment(date).format(DATEFORMATHOURS)
        }
    };
    return (
        <div className="request-dtls__comment">
            <span className="request-dtls__comment-author">{message.FirstName} {message.LastName}, {message.Name}</span>
            <span className="request-dtls__comment-time">{checkDate(message.CreatedAt)}</span>
            {showReplyButton && <span className="request-dtls__reply-button" onClick={() => onClick(message.ID)}>Reply</span>}
            <p className="request-dtls__comment-text">{nl2br(message.Text)}</p>
            {
                (message.isReplying)
                    ? <div className="request-dtls__response">
                        <form onSubmit={(e) => onSubmit(e, message.ID, e.target.value)}
                              onChange={(e) => onChange(e.target.value)} style={{display: 'flex', alignItems: 'center'}}>
                            <textarea className="txtarea" name="reply" id="reply" cols="30" rows="1" />
                            <button className="btn-sendmessage" disabled={loading}>Send</button>
                        </form>
                    </div>
                    : null
            }
            {
                (message.children)
                    ? <Reply loading={loading} showReplyButton={showReplyButton} replies={message.children} onClick={onClick} onSubmit={onSubmit} onChange={onChange}/>
                    : <Reply loading={loading} showReplyButton={showReplyButton} replies={[]} onClick={onClick} onSubmit={onSubmit} onChange={onChange}/>
            }
        </div>
    );
}

export default Message;
