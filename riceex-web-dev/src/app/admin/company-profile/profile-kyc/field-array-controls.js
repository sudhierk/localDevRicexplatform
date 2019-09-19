import React from 'react';

export const FieldArrayControls = ({onAdd, onRemove, index, arrayLength}) => {
    return (
        <div className="field-array-controls">
            {arrayLength > 1 && (
                <button className="remove-fieldset"
                        type="button"
                        onClick={onRemove}
                >
                    Remove
                </button>
            )}
            {index === arrayLength - 1 && (
                <button className="add-fieldset"
                        type="button"
                        onClick={onAdd}
                >
                    Add
                </button>
            )}
        </div>
    )
};
