import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — a fully styled dark-theme dropdown replacing native <select>.
 * Props:
 *   icon       — React element shown left of the label
 *   value      — currently selected value string
 *   options    — [{ value, label }]
 *   onChange   — (value: string) => void
 *   placeholder — shown when no value
 *   id         — id for the trigger button
 */
const CustomSelect = ({ icon, value, options = [], onChange, placeholder = '선택...', id }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={ref} className="relative" id={id}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors text-sm font-medium text-slate-200 whitespace-nowrap"
            >
                {icon && <span className="text-blue-400 shrink-0">{icon}</span>}
                <span className="truncate max-w-[120px]">
                    {selected ? selected.label : <span className="text-slate-500">{placeholder}</span>}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto py-1">
                        {options.length === 0 ? (
                            <div className="px-4 py-2 text-xs text-slate-500 italic">항목 없음</div>
                        ) : (
                            options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left transition-colors ${opt.value === value
                                            ? 'bg-blue-600/20 text-blue-300'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {opt.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
