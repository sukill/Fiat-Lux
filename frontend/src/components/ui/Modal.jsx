import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop - fixed to viewport */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Scrollable Container Content */}
            <div className="fixed inset-0 overflow-y-auto flex items-start justify-center p-4 pt-20 pb-20">
                {/* Modal Content - relative z-10 to stay above backdrop */}
                <div className="bg-white w-full max-w-lg relative z-10 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in zoom-in-95 fade-in duration-300 ease-out border border-slate-100 rounded-[24px]">
                    <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-white">
                        <h3 className="text-xl font-bold text-[#1E293B]">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
