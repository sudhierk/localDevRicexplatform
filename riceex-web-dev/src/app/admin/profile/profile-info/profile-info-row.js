import React from 'react';
import GoPencil from 'react-icons/lib/go/pencil';

export const ProfileInfoRow = ({label, value, onEdit, className = ''}) => {
    return (
        <div className="trades-dtls__prop">
            <div className="trades-dtls__key">{label}</div>
            <div className="trades-dtls__value">
                {value}
                {onEdit && (
                    <div className={`profile-info__edit-link ${className}`} onClick={() => onEdit(label)}>
                        <GoPencil/>
                        Edit
                    </div>
                )}
            </div>
        </div>
    );
};