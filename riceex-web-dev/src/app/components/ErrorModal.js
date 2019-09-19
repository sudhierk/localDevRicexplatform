import React from 'react';

export const ErrorModal = ({content, onClose}) => {
    return (
        <div className="modal__container">
            <div className="modal__wrapper">
                <span className="modal__close" onClick={onClose}/>
                {content}
            </div>
        </div>
    )
};
