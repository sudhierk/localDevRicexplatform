import React from 'react';

export const ProfileError = ({error, onRefresh}) => {
    if (!error) {
        return null;
    }
    return (
        <div className="profile__error">
            {error}
            {onRefresh && (
                <div className="profile__try-again" onClick={onRefresh}>Refresh</div>
            )}
        </div>
    )
};