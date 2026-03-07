import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Book, Library, ChevronRight, FileText, Compass, ExternalLink } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/Forms';
import { ApiGuidelineRepository } from '../../../infrastructure/agent/guideline/adapters/ApiGuidelineRepository';

const guidelineRepo = new ApiGuidelineRepository();

const GuidelineManagement = () => {
    const queryClient = useQueryClient();
    const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
    const [isSetModalOpen, setIsSetModalOpen] = useState(false);

    // Form States
    const [guidelineData, setGuidelineData] = useState({ title: '', content: '' });
    const [setData, setSetData] = useState({ name: '', description: '', guideline_ids: [] });

    // Queries
    const { data: guidelines, isLoading: loadingGuidelines } = useQuery({
        queryKey: ['guidelines'],
        queryFn: () => guidelineRepo.listGuidelines(),
    });

    const { data: guidelineSets, isLoading: loadingSets } = useQuery({
        queryKey: ['guidelineSets'],
        queryFn: () => guidelineRepo.listGuidelineSets(),
    });

    // Mutations
    const createGuidelineMutation = useMutation({
        mutationFn: (data) => guidelineRepo.createGuideline(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelines'] });
            setIsGuidelineModalOpen(false);
            setGuidelineData({ title: '', content: '' });
        }
    });

    const createSetMutation = useMutation({
        mutationFn: (data) => guidelineRepo.createGuidelineSet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelineSets'] });
            setIsSetModalOpen(false);
            setSetData({ name: '', description: '', guideline_ids: [] });
        }
    });

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm">
                <div className="hidden md:block">
                    <p className="text-slate-600 text-sm font-medium">Codify operational intelligence and business rules into guidelines.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsGuidelineModalOpen(true)}>
                        <Plus size={18} /> New Guideline
                    </Button>
                    <Button variant="primary" className="flex-1 md:flex-none px-6" onClick={() => setIsSetModalOpen(true)}>
                        <Plus size={18} /> New Set
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-12 lg:gap-20 items-start">
                {/* Guideline Sets Section */}
                <section className="xl:col-span-2">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
                            <Library size={28} />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-[#1E293B]">Guideline Sets</h3>
                        <div className="h-px flex-1 bg-slate-100 ml-8" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-8">
                        {loadingSets ? (
                            [1, 2, 3].map(i => <div key={i} className="h-48 glass-panel animate-pulse" />)
                        ) : (
                            guidelineSets?.map(set => (
                                <Card key={set.id} className="group cursor-pointer !p-0">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-bold text-[#1E293B] group-hover:text-purple-600 transition-colors">{set.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {set.guidelines?.length || 0} Rule Sets Attached
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-purple-50 transition-colors">
                                                <ChevronRight className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" size={20} />
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
                                            {set.description || "Synthesized guideline container for AI operational alignment."}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wider">
                                                {set.guidelines?.length || 0} Modules
                                            </div>
                                            <div className="text-[10px] font-bold text-purple-400 group-hover:text-purple-600 uppercase tracking-widest transition-colors flex items-center gap-1.5 font-heading">
                                                Access Library <ExternalLink size={12} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-purple-50 group-hover:bg-purple-100 transition-colors" />
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Individual Guidelines Section */}
                <section className="xl:col-span-3">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                            <FileText size={28} />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-[#1E293B]">Guidelines</h3>
                        <div className="h-px flex-1 bg-slate-100 ml-8" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                        {loadingGuidelines ? (
                            [1, 2, 3].map(i => <div key={i} className="h-48 glass-panel animate-pulse" />)
                        ) : (
                            guidelines?.map(guideline => (
                                <Card key={guideline.id} className="!p-0 border-white/5">
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <Book size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-lg font-bold text-[#1E293B] leading-tight">{guideline.title}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(guideline.createdAt).toLocaleDateString().toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                                            <pre className="text-xs text-slate-600 line-clamp-6 whitespace-pre-wrap leading-relaxed font-medium">
                                                {guideline.content}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center">
                                        <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest flex items-center gap-1.5 font-heading">
                                            View Details <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Creation Modals (Premium Polish) */}
            <Modal
                isOpen={isGuidelineModalOpen}
                onClose={() => setIsGuidelineModalOpen(false)}
                title="Create New Guideline Module"
            >
                <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <p className="text-[13px] text-indigo-700 font-bold leading-relaxed">
                            Guidelines define the "how"—the operational boundaries and formatting rules that the AI must respect to ensure high-fidelity outputs.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <Input
                            label="Module Title"
                            placeholder="e.g. Formatting & Technical Standards"
                            value={guidelineData.title}
                            onChange={(e) => setGuidelineData({ ...guidelineData, title: e.target.value })}
                        />
                        <Textarea
                            label="Guideline Content"
                            placeholder="Enter rules, constraints, and best practices in Markdown format..."
                            value={guidelineData.content}
                            onChange={(e) => setGuidelineData({ ...guidelineData, content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="outline" className="px-6" onClick={() => setIsGuidelineModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="px-8"
                            loading={createGuidelineMutation.isPending}
                            onClick={() => createGuidelineMutation.mutate(guidelineData)}
                        >
                            Create Module
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSetModalOpen}
                onClose={() => setIsSetModalOpen(false)}
                title="Create Guideline Set"
            >
                <div className="space-y-6">
                    <div className="space-y-6">
                        <Input
                            label="Set Name"
                            placeholder="e.g. Standard Operation Procedures"
                            value={setData.name}
                            onChange={(e) => setSetData({ ...setData, name: e.target.value })}
                        />
                        <Textarea
                            label="Set Context"
                            placeholder="What operational purpose does this collection of guidelines serve?"
                            value={setData.description}
                            onChange={(e) => setSetData({ ...setData, description: e.target.value })}
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-sm font-bold text-slate-600">Module Integration</label>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-wider">{setData.guideline_ids.length} integrated</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-100 scrollbar-thin">
                            {guidelines?.map(g => (
                                <label key={g.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${setData.guideline_ids.includes(g.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-200'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 bg-white text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                        checked={setData.guideline_ids.includes(g.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...setData.guideline_ids, g.id]
                                                : setData.guideline_ids.filter(id => id !== g.id);
                                            setSetData({ ...setData, guideline_ids: ids });
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${setData.guideline_ids.includes(g.id) ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{g.title}</p>
                                    </div>
                                    <FileText size={16} className={setData.guideline_ids.includes(g.id) ? 'text-indigo-400' : 'text-slate-400'} />
                                </label>
                            ))}
                            {guidelines?.length === 0 && <p className="text-center py-8 text-sm text-slate-400 font-bold italic">No guidelines available to set.</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="outline" className="px-6" onClick={() => setIsSetModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="px-8"
                            loading={createSetMutation.isPending}
                            onClick={() => createSetMutation.mutate(setData)}
                        >
                            Consolidate Set
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GuidelineManagement;
