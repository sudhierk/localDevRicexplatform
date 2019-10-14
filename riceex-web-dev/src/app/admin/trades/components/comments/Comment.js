import React from 'react';
import moment from 'moment';
import nl2br from "react-nl2br";

import Reply from './Reply';
import { DATEFORMATHOURS } from '../../../../../services/service.values';
import FaEyeSlash from 'react-icons/lib/fa/eye-slash';
import FaEye from 'react-icons/lib/fa/eye';

const Comment = ({message, onClick, messagePosition, onSubmit, onChange, replyTo, user}) => {
    const getFormattedDate = (date) => {
        if (moment.duration(moment(new Date()).diff(date)) < 24*60*60) {
            // console.log(moment.duration(moment(new Date()).diff(date)).humanize());
            return moment.duration(moment(new Date()).diff(date)).humanize() + " ago"
        } else{
            return moment(date).format(DATEFORMATHOURS)
        }
    };
    return (
        <div className={`trades-dtls__comment${message.AutoComment ? ' trades-dtls__comment--auto' : ''}`}>
            <span className="trades-dtls__comment-author">{message.FirstName} {message.LastName}, {message.Name} ({message.SenderRole})</span>
            <span className="trades-dtls__comment-time">
                {getFormattedDate(message.CreatedAt)}
                {!message.AutoComment ? ` to ${message.ReceiverFullName}, ${message.ReceiverName} (${message.ReceiverRole})` : ''}
            </span>
            <span className="trades-dtls__private-icon">
                {message.AutoComment ? <FaEye /> : <FaEyeSlash />}
            </span>
            {!message.AutoComment && message.UserID !== user.id && (
                <span className="trades-dtls__reply-button" onClick={() => onClick(message.ID)}>Reply</span>
            )}
            <p className="trades-dtls__comment-text">{nl2br(message.Text)}</p>
            {
                (message.ID === replyTo)
                    ? <div className="trades-dtls__response">
                        <form onSubmit={(e) => onSubmit(e, message)} onChange={(e) => onChange(e.target.value)} style={{display: "flex", alignItems: "center"}}>
                            <textarea className="form-control" name="reply" id="reply" cols="30" rows="1" required={true} />
                            <button className="btn btn-outline-primary">Send</button >
                        </form>
                    </div>
                    : null
            }
            {
                (message.children)
                    ? <Reply user={user} replyTo={replyTo} replies={message.children} onClick={onClick} onSubmit={onSubmit} onChange={onChange}/>
                    : <Reply user={user} replyTo={replyTo} replies={[]} onClick={onClick} onSubmit={onSubmit} onChange={onChange}/>
            }
        </div>
    );
};

export default Comment;
