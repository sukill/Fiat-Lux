import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', rounded = true, ...props }) => {
    const baseStyles = 'btn-saas';
    const variantStyles = variant === 'primary' ? 'btn-primary' : 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200';
    const shapeStyles = rounded ? 'rounded-full' : 'rounded-xl';

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${shapeStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
