import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserCircle, BookOpen, LayoutDashboard, Settings, Sparkles, FolderTree } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/personas', icon: UserCircle, label: 'Personas' },
        { to: '/guidelines', icon: BookOpen, label: 'Guidelines' },
        { to: '/browser', icon: FolderTree, label: 'Repo Browser' },
    ];

    return (
        <aside className="w-72 flex-shrink-0 min-h-screen bg-slate-50 border-r border-slate-200 flex flex-col relative z-20 sidebar-shadow">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#1E293B] flex items-center justify-center shadow-lg shadow-slate-200">
                        <Sparkles size={22} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B]">Fiat-Lux</h1>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-white shadow-sm border border-slate-200 text-[#1E293B]'
                                : 'text-slate-500 hover:bg-slate-200/50 hover:text-[#1E293B]'
                            }`
                        }
                    >
                        <item.icon size={20} className="relative z-10" />
                        <span className="relative z-10 font-semibold text-sm">
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Space reserved for future footer items */}
        </aside>
    );
};

export default Sidebar;
