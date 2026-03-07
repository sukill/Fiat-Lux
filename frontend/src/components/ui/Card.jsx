import React from 'react';

const Card = ({ children, className = '', hover = true, ...props }) => {
    return (
        <div className={`card-saas ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Card;
