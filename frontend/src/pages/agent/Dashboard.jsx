import React from 'react';
import { Users, BookOpen, PlayCircle, ArrowRight, Settings, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const portals = [
        {
            id: 'personas',
            title: 'Identity Engine',
            subtitle: 'AI PERSONA ORCHESTRATION',
            description: 'Define and manage role-based AI identities for autonomous workflows.',
            icon: Users,
            path: '/personas',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600'
        },
        {
            id: 'guideline',
            title: 'Intelligence Core',
            subtitle: 'GUIDELINE ARCHIVING',
            description: 'Codify domain expertise into executable guidelines and guideline sets.',
            icon: BookOpen,
            path: '/guidelines',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            id: 'workflows',
            title: 'Command Center',
            subtitle: 'WORKFLOW MONITORING',
            description: 'Launch and monitor complex agentic workflows in real-time.',
            icon: PlayCircle,
            path: '/workflows',
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-900'
        },
        {
            id: 'settings',
            title: 'System Settings',
            subtitle: 'GLOBAL CONFIGURATION',
            description: 'Manage system parameters and global environment settings.',
            icon: Settings,
            path: '/settings',
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-900'
        }
    ];

    return (
        <div className="max-w-[1280px] mx-auto py-8 animate-slide-up text-left">
            {/* Minimalist Header */}
            <div className="mb-14">
                <h1 className="text-5xl font-extrabold text-[#1E293B] mb-4 tracking-tight">
                    Agentic Control Plane
                </h1>
                <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
                    Orchestrate your intelligence layer with precision and speed.
                </p>
            </div>

            {/* Portal Grid */}
            <div className="grid grid-cols-4 gap-8">
                {portals.map((portal) => (
                    <div
                        key={portal.id}
                        onClick={() => navigate(portal.path)}
                        className="group flex flex-col"
                    >
                        <Card className="flex-1 cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-200/60 p-8 rounded-[2rem]">
                            <div className={`w-14 h-14 rounded-2xl ${portal.iconBg} flex items-center justify-center ${portal.iconColor} mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                <portal.icon size={28} />
                            </div>

                            <div className="mb-5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                                    {portal.subtitle}
                                </p>
                                <h3 className="text-2xl font-bold text-[#1E293B] leading-tight">
                                    {portal.title}
                                </h3>
                            </div>

                            <p className="text-md text-slate-600 font-medium leading-relaxed mb-10">
                                {portal.description}
                            </p>

                            <div className="mt-auto flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-extrabold text-[#1E293B] group-hover:text-blue-600 transition-colors">
                                    <span>Get Started</span>
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="p-2 rounded-full bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap size={14} className="text-blue-500" />
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
