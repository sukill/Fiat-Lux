import React from 'react';
import { useLocation } from 'react-router-dom';
import { Compass, ShieldCheck, LayoutDashboard, FolderTree } from 'lucide-react';

const TopHeader = () => {
    const location = useLocation();

    const getPageContext = () => {
        switch (location.pathname) {
            case '/':
                return { title: 'System Dashboard', icon: LayoutDashboard, color: 'text-emerald-400' };
            case '/personas':
                return { title: 'Persona Management', icon: ShieldCheck, color: 'text-indigo-400' };
            case '/guidelines':
                return { title: 'Guideline Management', icon: Compass, color: 'text-purple-400' };
            case '/browser':
                return { title: 'Repository Browser', icon: FolderTree, color: 'text-blue-400' };
            default:
                return { title: 'Control Plane', icon: LayoutDashboard, color: 'text-slate-400' };
        }
    };

    const context = getPageContext();

    return (
        <header id="top-header" className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-10 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#1E293B]">
                    <context.icon size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-[#1E293B]">{context.title}</h2>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Space reserved for future dynamic actions/meta */}
            </div>
        </header>
    );
};

export default TopHeader;
