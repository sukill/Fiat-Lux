import React from 'react';

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-bold text-slate-600 ml-1">{label}</label>}
            <input
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all duration-300 ${error ? 'border-red-500/50' : ''}`}
                {...props}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
};

export const Textarea = ({ label, error, ...props }) => {
    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-bold text-slate-600 ml-1">{label}</label>}
            <textarea
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all duration-300 min-h-[140px] resize-none ${error ? 'border-red-500/50' : ''}`}
                {...props}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
};
