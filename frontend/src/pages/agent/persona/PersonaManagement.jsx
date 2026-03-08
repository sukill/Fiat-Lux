import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, User, ChevronRight, ShieldCheck, Zap, Trash2, Book, Library, Search, List, LayoutGrid, Hash, Filter, FileText } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/Forms';
import { ApiPersonaRepository } from '../../../infrastructure/agent/persona/adapters/ApiPersonaRepository';
import { ApiGuidelineRepository } from '../../../infrastructure/agent/guideline/adapters/ApiGuidelineRepository';
import { ApiStorageRepository } from '../../../infrastructure/agent/storage/adapters/ApiStorageRepository';

const personaRepo = new ApiPersonaRepository();
const guidelineRepo = new ApiGuidelineRepository();
const storageRepo = new ApiStorageRepository();

const DirectorySelector = ({ value, onChange, directories, label = "Directory" }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newDir, setNewDir] = useState('');

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-600">{label}</label>
                <button
                    type="button"
                    onClick={() => {
                        setIsCreating(!isCreating);
                        if (!isCreating) setNewDir('');
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                >
                    {isCreating ? 'Choose Existing' : '+ New Directory'}
                </button>
            </div>

            {isCreating ? (
                <div className="relative">
                    <input
                        type="text"
                        placeholder="e.g. Project A/Sub Folder"
                        className="w-full bg-white border border-indigo-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                        value={newDir}
                        onChange={(e) => {
                            setNewDir(e.target.value);
                            onChange(e.target.value);
                        }}
                        autoFocus
                    />
                    <p className="mt-1 text-[10px] text-slate-400 font-medium pl-1">
                        Use forward slashes (/) for nested structures.
                    </p>
                </div>
            ) : (
                <select
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">Root (personas/)</option>
                    {directories.map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                    ))}
                </select>
            )}
        </div>
    );
};

const PersonaManagement = () => {
    const queryClient = useQueryClient();
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
    const [isSetModalOpen, setIsSetModalOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [selectedSet, setSelectedSet] = useState(null);
    const [editingPersona, setEditingPersona] = useState(null);
    const [editingSet, setEditingSet] = useState(null);
    const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false);
    const [isEditPersonaModalOpen, setIsEditPersonaModalOpen] = useState(false);

    // Search & View States
    const [personaSearch, setPersonaSearch] = useState('');
    const [setSearch, setSetSearch] = useState('');
    const [activeRepoTab, setActiveRepoTab] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

    // Form States
    const [personaData, setPersonaData] = useState({
        name: '',
        role: '',
        systemPrompt: '',
        motivation: '',
        goals: '',
        constraints: '',
        guidelines: [],
        directory: ''
    });
    const [setData, setSetData] = useState({
        name: '',
        description: '',
        repository: 'persona-repo',
        branch: 'main',
        persona_ids: []
    });
    const [editData, setEditData] = useState({
        name: '',
        role: '',
        systemPrompt: '',
        motivation: '',
        goals: '',
        constraints: '',
        guidelines: []
    });
    const [editSetData, setEditSetData] = useState({
        name: '',
        description: '',
        repository: 'persona-repo',
        branch: 'main',
        persona_ids: []
    });

    useEffect(() => {
        if (editingPersona) {
            setEditData({
                name: editingPersona.name || '',
                role: editingPersona.role,
                systemPrompt: editingPersona.systemPrompt,
                motivation: editingPersona.motivation || '',
                goals: (editingPersona.goals || []).join('\n'),
                constraints: (editingPersona.constraints || []).join('\n'),
                guidelines: editingPersona.guidelines || [],
                directory: editingPersona.directory || ''
            });
        }
    }, [editingPersona]);

    useEffect(() => {
        if (editingSet) {
            setEditSetData({
                name: editingSet.name || '',
                description: editingSet.description || '',
                repository: editingSet.repository || 'persona-repo',
                branch: editingSet.branch || 'main',
                persona_ids: (editingSet.personas || []).map(p => p.id)
            });
        }
    }, [editingSet]);

    // Queries
    const { data: personas, isLoading: loadingPersonas } = useQuery({
        queryKey: ['personas'],
        queryFn: () => personaRepo.listPersonas(),
    });

    const { data: personaSets, isLoading: loadingSets } = useQuery({
        queryKey: ['personaSets'],
        queryFn: () => personaRepo.listPersonaSets(),
    });

    const { data: guidelines, isLoading: loadingGuidelines } = useQuery({
        queryKey: ['guidelines'],
        queryFn: () => guidelineRepo.listGuidelines(),
    });

    const { data: repositories } = useQuery({
        queryKey: ['repositories'],
        queryFn: () => storageRepo.listRepositories(),
    });

    const { data: createSetRefs } = useQuery({
        queryKey: ['storage-refs', setData.repository],
        queryFn: () => storageRepo.listRefs(setData.repository),
        enabled: !!setData.repository,
    });

    const { data: editSetRefs } = useQuery({
        queryKey: ['storage-refs', editSetData.repository],
        queryFn: () => storageRepo.listRefs(editSetData.repository),
        enabled: !!editSetData.repository,
    });

    // Mutations
    const createPersonaMutation = useMutation({
        mutationFn: (data) => personaRepo.createPersona(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personas'] });
            setIsPersonaModalOpen(false);
            setPersonaData({
                name: '',
                role: '',
                systemPrompt: '',
                motivation: '',
                goals: '',
                constraints: '',
                guidelines: [],
                directory: ''
            });
        }
    });

    const createSetMutation = useMutation({
        mutationFn: (data) => personaRepo.createPersonaSet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personaSets'] });
            setIsSetModalOpen(false);
            setSetData({ name: '', description: '', persona_ids: [] });
        }
    });

    const updatePersonaMutation = useMutation({
        mutationFn: ({ id, data }) => personaRepo.updatePersona(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personas'] });
            setEditingPersona(null);
        }
    });

    const updateSetMutation = useMutation({
        mutationFn: ({ id, data }) => personaRepo.updatePersonaSet(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personaSets'] });
            setEditingSet(null);
            setIsEditSetModalOpen(false);
        }
    });

    const deletePersonaMutation = useMutation({
        mutationFn: ({ id, namespace }) => personaRepo.deletePersona(id, namespace),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personas'] });
        }
    });

    const deleteSetMutation = useMutation({
        mutationFn: (id) => personaRepo.deletePersonaSet(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personaSets'] });
            setSelectedSet(null);
        }
    });

    const handleDeleteSet = (e, set) => {
        e.stopPropagation();
        if (window.confirm(`"${set.name}" 세트를 삭제할까요?`)) {
            deleteSetMutation.mutate(set.id);
        }
    };

    const directories = React.useMemo(() => {
        if (!personas) return [];
        const allPaths = new Set();
        personas.forEach(p => {
            if (!p.directory) return;
            const parts = p.directory.split('/');
            let current = '';
            parts.forEach((part, index) => {
                current = index === 0 ? part : `${current}/${part}`;
                allPaths.add(current);
            });
        });
        return Array.from(allPaths).sort();
    }, [personas]);

    const handleDeletePersona = (e, persona) => {
        e.stopPropagation();
        if (window.confirm(`"${persona.name || 'Unnamed'}" 페르소나를 삭제할까요?`)) {
            deletePersonaMutation.mutate({ id: persona.id, namespace: persona.namespace });
        }
    };

    // Filtered Data
    const filteredPersonas = personas?.filter(p =>
        (p.name || '').toLowerCase().includes(personaSearch.toLowerCase()) ||
        (p.role || '').toLowerCase().includes(personaSearch.toLowerCase()) ||
        (p.systemPrompt || '').toLowerCase().includes(personaSearch.toLowerCase())
    );

    const filteredSets = personaSets?.filter(set => {
        const matchesSearch = (set.name || '').toLowerCase().includes(setSearch.toLowerCase()) ||
            (set.description || '').toLowerCase().includes(setSearch.toLowerCase());
        const matchesRepo = activeRepoTab === 'All' || set.repository === activeRepoTab;
        return matchesSearch && matchesRepo;
    });

    const repoList = ['All', ...new Set(personaSets?.map(s => s.repository) || [])];

    return (
        <div className="space-y-10 animate-slide-up pb-20 max-w-[1600px] mx-auto px-4">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm">
                <div className="hidden md:block">
                    <p className="text-slate-600 text-sm font-medium">Architect AI personas and curate functional sets.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsPersonaModalOpen(true)}>
                        <Plus size={18} /> New Persona
                    </Button>
                    <Button variant="primary" className="flex-1 md:flex-none px-6" onClick={() => setIsSetModalOpen(true)}>
                        <Plus size={18} /> New Set
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar: Persona Sets */}
                <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-6 sticky top-24">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                                <Library size={22} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-[#1E293B]">Sets</h3>
                        </div>
                    </div>

                    {/* Repo Tabs */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-none">
                        {repoList.map(repo => (
                            <button
                                key={repo}
                                onClick={() => setActiveRepoTab(repo)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeRepoTab === repo
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {repo}
                            </button>
                        ))}
                    </div>

                    {/* Sets Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search sets..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            value={setSearch}
                            onChange={(e) => setSetSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 scrollbar-thin">
                        {loadingSets ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-2xl" />)
                        ) : (
                            filteredSets?.map(set => (
                                <Card
                                    key={set.id}
                                    className={`group cursor-pointer transition-all border-l-4 !p-5 ${selectedSet?.id === set.id
                                        ? 'border-l-indigo-600 bg-indigo-50/30'
                                        : 'border-l-transparent hover:border-l-indigo-300'
                                        }`}
                                    onClick={() => setSelectedSet(set)}
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{set.name}</h4>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-widest shrink-0">
                                                    {set.personas?.length || 0}
                                                </span>
                                                <button
                                                    onClick={(e) => handleDeleteSet(e, set)}
                                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-[12px] line-clamp-2 leading-relaxed font-medium">
                                            {set.description || "Synthesized persona container."}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Hash size={12} className="text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{set.repository}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                        {filteredSets?.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-sm text-slate-400 font-bold">No sets found.</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content: Personas List */}
                <main className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
                                <Zap size={22} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-[#1E293B]">Personas</h3>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group min-w-[240px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Find a persona..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium"
                                    value={personaSearch}
                                    onChange={(e) => setPersonaSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-bottom border-slate-100">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Persona Information</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Role & Origin</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loadingPersonas ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={3} className="px-8 py-6 h-16 bg-slate-50/30" />
                                            </tr>
                                        ))
                                    ) : (
                                        filteredPersonas?.map(persona => (
                                            <tr
                                                key={persona.id}
                                                className="group hover:bg-purple-50/30 transition-colors cursor-pointer"
                                                onClick={() => setSelectedPersona(persona)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-purple-400 group-hover:text-purple-600 group-hover:border-purple-100 transition-all shadow-sm">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">{persona.name || 'Unnamed'}</p>
                                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tight">
                                                                    {persona.repository || 'persona-repo'}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tight">
                                                                    {persona.directory || '/'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1 max-w-sm">{persona.systemPrompt}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[11px] font-bold text-slate-700">
                                                            {persona.role}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {persona.createdAt ? new Date(persona.createdAt).toLocaleDateString() : '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right text-purple-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                            onClick={(e) => handleDeletePersona(e, persona)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {filteredPersonas?.length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 font-bold">No personas match your search.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loadingPersonas ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[32px]" />)
                            ) : (
                                filteredPersonas?.map(persona => (
                                    <Card
                                        key={persona.id}
                                        className="!p-0 border-white/5 cursor-pointer group hover:border-purple-300/30 transition-all !rounded-[32px]"
                                        onClick={() => setSelectedPersona(persona)}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <User size={24} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-bold text-[#1E293B] leading-tight group-hover:text-purple-600 transition-colors">{persona.name || 'Unnamed'}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {persona.createdAt ? new Date(persona.createdAt).toLocaleDateString().toUpperCase() : 'NO DATE'}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{persona.repository || 'persona-repo'}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{persona.directory || '/'}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{persona.role}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:border-purple-100 transition-all overflow-hidden h-32">
                                                <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap leading-relaxed font-medium">
                                                    {persona.systemPrompt}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100/50 flex justify-between items-center rounded-b-[32px]">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> ID: {persona.id.slice(0, 8)}</span>
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                onClick={(e) => handleDeletePersona(e, persona)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Creation Modals (Premium Polish) */}
            <Modal
                isOpen={isPersonaModalOpen}
                onClose={() => setIsPersonaModalOpen(false)}
                title="Synthesize New AI Persona"
            >
                <div className="space-y-8">
                    <div className="space-y-6">
                        <Input
                            label="Persona Designation"
                            placeholder="e.g. Rosetta Translator"
                            value={personaData.name}
                            onChange={(e) => setPersonaData({ ...personaData, name: e.target.value })}
                        />
                        <Input
                            label="Operational Role"
                            placeholder="e.g. Senior Content Architect"
                            value={personaData.role}
                            onChange={(e) => setPersonaData({ ...personaData, role: e.target.value })}
                        />
                        <Textarea
                            label="Core System Directive"
                            placeholder="Define expertise, tone, and behavioral instructions..."
                            value={personaData.systemPrompt}
                            onChange={(e) => setPersonaData({ ...personaData, systemPrompt: e.target.value })}
                            rows={4}
                        />
                        <Textarea
                            label="Axiological Motivation"
                            placeholder="What drives this persona? e.g. Excellence in technical clarity"
                            value={personaData.motivation}
                            onChange={(e) => setPersonaData({ ...personaData, motivation: e.target.value })}
                            rows={2}
                        />

                        <DirectorySelector
                            value={personaData.directory}
                            onChange={(dir) => setPersonaData({ ...personaData, directory: dir })}
                            directories={directories}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Textarea
                                label="Strategic Goals"
                                placeholder="One objective per line..."
                                value={personaData.goals}
                                onChange={(e) => setPersonaData({ ...personaData, goals: e.target.value })}
                                rows={3}
                            />
                            <Textarea
                                label="Operational Constraints"
                                placeholder="One constraint per line..."
                                value={personaData.constraints}
                                onChange={(e) => setPersonaData({ ...personaData, constraints: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} className="text-purple-600" /> Embedded Guidelines
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl scrollbar-thin">
                                {loadingGuidelines ? (
                                    <div className="flex flex-col gap-2">
                                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white animate-pulse rounded-lg" />)}
                                    </div>
                                ) : (
                                    guidelines?.map(g => (
                                        <label key={g.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${personaData.guidelines.includes(g.id) ? 'bg-purple-50 border-purple-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-slate-300 text-purple-600 focus:ring-0 transition-all cursor-pointer"
                                                checked={personaData.guidelines.includes(g.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...personaData.guidelines, g.id]
                                                        : personaData.guidelines.filter(id => id !== g.id);
                                                    setPersonaData({ ...personaData, guidelines: ids });
                                                }}
                                            />
                                            <span className={`text-sm font-bold ${personaData.guidelines.includes(g.id) ? 'text-purple-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{g.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setIsPersonaModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            loading={createPersonaMutation.isPending}
                            onClick={() => {
                                const selectedGuidelinesContent = guidelines
                                    ?.filter(g => personaData.guidelines.includes(g.id))
                                    .map(g => g.content) || [];

                                createPersonaMutation.mutate({
                                    name: personaData.name,
                                    role: personaData.role,
                                    system_prompt: personaData.systemPrompt,
                                    motivation: personaData.motivation,
                                    goals: personaData.goals.split('\n').filter(g => g.trim()),
                                    constraints: personaData.constraints.split('\n').filter(c => c.trim()),
                                    guidelines: selectedGuidelinesContent,
                                    directory: personaData.directory
                                });
                            }}
                        >
                            Synthesize Persona
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSetModalOpen}
                onClose={() => setIsSetModalOpen(false)}
                title="Curate Persona Set"
            >
                <div className="space-y-8">
                    <div className="space-y-6">
                        <Input
                            label="Set Designation"
                            placeholder="e.g. Enterprise Creative Suite"
                            value={setData.name}
                            onChange={(e) => setSetData({ ...setData, name: e.target.value })}
                        />
                        <Textarea
                            label="Operational Scope"
                            placeholder="Define the systemic workflow these identities will serve..."
                            value={setData.description}
                            onChange={(e) => setSetData({ ...setData, description: e.target.value })}
                            rows={3}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Book size={14} className="text-indigo-600" /> Target Repository
                                </label>
                                <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200">
                                    {repositories?.filter(r => r.name.toLowerCase().includes('persona')).map(repo => (
                                        <button
                                            key={repo.name}
                                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${setData.repository === repo.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            onClick={() => setSetData({ ...setData, repository: repo.name, branch: 'main' })}
                                        >
                                            {repo.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={14} className="text-indigo-600" /> Version Control
                                </label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer font-medium"
                                    value={setData.branch}
                                    onChange={(e) => setSetData({ ...setData, branch: e.target.value })}
                                >
                                    {createSetRefs?.map(ref => (
                                        <option key={ref.name} value={ref.name}>{ref.name}</option>
                                    ))}
                                    {!createSetRefs?.length && <option value="main">main</option>}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users size={14} className="text-indigo-600" /> Member Personas
                                </label>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {setData.persona_ids.length} SELECTED
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl scrollbar-thin">
                                {personas?.map(p => (
                                    <label key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${setData.persona_ids.includes(p.id) ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-100/50' : 'bg-white/50 border-transparent hover:border-slate-200'}`}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                            checked={setData.persona_ids.includes(p.id)}
                                            onChange={(e) => {
                                                const ids = e.target.checked
                                                    ? [...setData.persona_ids, p.id]
                                                    : setData.persona_ids.filter(id => id !== p.id);
                                                setSetData({ ...setData, persona_ids: ids });
                                            }}
                                        />
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${setData.persona_ids.includes(p.id) ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{p.name || 'Unnamed'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.role}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setIsSetModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            loading={createSetMutation.isPending}
                            onClick={() => createSetMutation.mutate(setData)}
                        >
                            Finalize Set
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Persona Detail Modal */}
            <Modal
                isOpen={!!selectedPersona}
                onClose={() => setSelectedPersona(null)}
                title="Persona Blueprint"
            >
                {selectedPersona && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-[28px] relative overflow-hidden">
                            <div className="absolute -right-16 -top-16 w-32 h-32 bg-purple-200/20 blur-[60px] rounded-full" />
                            <div className="relative flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-100 shrink-0">
                                    <User size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">{selectedPersona.name || 'Unnamed'}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            ID: {selectedPersona.id.slice(0, 8)}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{selectedPersona.repository || 'persona-repo'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{selectedPersona.directory || '/'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{selectedPersona.role}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {selectedPersona.createdAt ? new Date(selectedPersona.createdAt).toLocaleDateString().toUpperCase() : 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} className="text-purple-600" /> System Directive
                            </label>
                            <div className="bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-600/30" />
                                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap italic text-sm">
                                    "{selectedPersona.systemPrompt}"
                                </p>
                            </div>
                        </div>

                        {selectedPersona.motivation && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivation</label>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedPersona.motivation}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedPersona.goals?.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goals</label>
                                    <ul className="space-y-2">
                                        {selectedPersona.goals.map((goal, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                                <span>{goal}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {selectedPersona.constraints?.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Constraints</label>
                                    <ul className="space-y-2">
                                        {selectedPersona.constraints.map((constraint, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                <span>{constraint}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {selectedPersona.guidelines?.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Embedded Guidelines</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedPersona.guidelines.map((g, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.3)]" />
                                            <span className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{g}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 gap-3">
                            <Button variant="outline" onClick={() => setSelectedPersona(null)}>Close</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingPersona(selectedPersona);
                                    setIsEditPersonaModalOpen(true);
                                    setSelectedPersona(null);
                                }}
                            >
                                Edit Persona
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Persona Edit Modal */}
            <Modal
                isOpen={isEditPersonaModalOpen}
                onClose={() => {
                    setIsEditPersonaModalOpen(false);
                    setEditingPersona(null);
                }}
                title="Refine AI Persona"
            >
                {editingPersona && (
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="Persona Designation"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                            <Input
                                label="Operational Role"
                                value={editData.role}
                                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                            />
                            <Textarea
                                label="Core System Directive"
                                value={editData.systemPrompt}
                                onChange={(e) => setEditData({ ...editData, systemPrompt: e.target.value })}
                                rows={4}
                            />

                            <DirectorySelector
                                value={editData.directory}
                                onChange={(dir) => setEditData({ ...editData, directory: dir })}
                                directories={directories}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Textarea
                                    label="Strategic Goals"
                                    value={editData.goals}
                                    onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                                    rows={3}
                                />
                                <Textarea
                                    label="Operational Constraints"
                                    value={editData.constraints}
                                    onChange={(e) => setEditData({ ...editData, constraints: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-purple-600" /> Embedded Guidelines
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl scrollbar-thin">
                                    {loadingGuidelines ? (
                                        <div className="flex flex-col gap-2">
                                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white animate-pulse rounded-lg" />)}
                                        </div>
                                    ) : (
                                        guidelines?.map(g => {
                                            const isSelected = editData.guidelines.includes(g.content);
                                            return (
                                                <label key={g.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded-lg border-slate-300 text-purple-600 focus:ring-0 transition-all cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newGuidelines = e.target.checked
                                                                ? [...editData.guidelines, g.content]
                                                                : editData.guidelines.filter(content => content !== g.content);
                                                            setEditData({ ...editData, guidelines: newGuidelines });
                                                        }}
                                                    />
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-purple-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{g.title}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => {
                                setIsEditPersonaModalOpen(false);
                                setEditingPersona(null);
                            }}>Cancel</Button>
                            <Button
                                variant="primary"
                                loading={updatePersonaMutation.isPending}
                                onClick={() => updatePersonaMutation.mutate({
                                    id: editingPersona.id,
                                    data: {
                                        name: editData.name,
                                        role: editData.role,
                                        system_prompt: editData.systemPrompt,
                                        motivation: editData.motivation,
                                        goals: editData.goals.split('\n').filter(g => g.trim()),
                                        constraints: editData.constraints.split('\n').filter(c => c.trim()),
                                        guidelines: editData.guidelines,
                                        directory: editData.directory
                                    }
                                })}
                            >
                                Update Persona
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Set Detail Modal */}
            <Modal
                isOpen={!!selectedSet}
                onClose={() => setSelectedSet(null)}
                title="Persona Set Specification"
            >
                {selectedSet && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-[32px] relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-48 h-48 bg-indigo-200/20 blur-[80px] rounded-full" />

                            <div className="relative space-y-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                                        <Library size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSet.name}</h4>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-widest">
                                                {selectedSet.repository}
                                            </span>
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">
                                                {selectedSet.branch}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-md">
                                    {selectedSet.description || "Synthesized persona container for AI behavioral alignment."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Integrated Personas</label>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                    {selectedSet.personas?.length || 0} TOTAL
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                                {selectedSet.personas?.map(persona => (
                                    <div key={persona.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{persona.name || 'Unnamed'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{persona.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <Button variant="outline" onClick={() => setSelectedSet(null)}>Close</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingSet(selectedSet);
                                    setIsEditSetModalOpen(true);
                                    setSelectedSet(null);
                                }}
                            >
                                Edit Set
                            </Button>
                            <Button
                                variant="destructive"
                                loading={deleteSetMutation.isPending}
                                onClick={() => deleteSetMutation.mutate(selectedSet.id)}
                            >
                                <Trash2 size={16} className="mr-2" /> Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Persona Set Edit Modal */}
            <Modal
                isOpen={isEditSetModalOpen}
                onClose={() => {
                    setIsEditSetModalOpen(false);
                    setEditingSet(null);
                }}
                title="Refine Persona Set"
            >
                {editingSet && (
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="Set Designation"
                                placeholder="e.g. Enterprise Creative Suite"
                                value={editSetData.name}
                                onChange={(e) => setEditSetData({ ...editSetData, name: e.target.value })}
                            />
                            <Textarea
                                label="Operational Scope"
                                placeholder="Define the systemic workflow these identities will serve..."
                                value={editSetData.description}
                                onChange={(e) => setEditSetData({ ...editSetData, description: e.target.value })}
                                rows={3}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Book size={14} className="text-indigo-600" /> Target Repository
                                    </label>
                                    <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200">
                                        {repositories?.filter(r => (r.name || '').toLowerCase().includes('persona')).map(repo => (
                                            <button
                                                key={repo.name}
                                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${editSetData.repository === repo.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                onClick={() => setEditSetData({ ...editSetData, repository: repo.name, branch: 'main' })}
                                            >
                                                {repo.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Filter size={14} className="text-indigo-600" /> Version Control
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer font-medium"
                                        value={editSetData.branch}
                                        onChange={(e) => setEditSetData({ ...editSetData, branch: e.target.value })}
                                    >
                                        {editSetRefs?.map(ref => (
                                            <option key={ref.name} value={ref.name}>{ref.name}</option>
                                        ))}
                                        {!editSetRefs?.length && <option value="main">main</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={14} className="text-indigo-600" /> Member Personas
                                    </label>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {editSetData.persona_ids.length} SELECTED
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-2xl scrollbar-thin">
                                    {personas?.map(p => {
                                        const isSelected = editSetData.persona_ids.includes(p.id);
                                        return (
                                            <label key={p.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${isSelected ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-100/50' : 'bg-white/50 border-transparent hover:border-slate-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        const ids = e.target.checked
                                                            ? [...editSetData.persona_ids, p.id]
                                                            : editSetData.persona_ids.filter(id => id !== p.id);
                                                        setEditSetData({ ...editSetData, persona_ids: ids });
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{p.name || 'Unnamed'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.role}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={() => {
                                setIsEditSetModalOpen(false);
                                setEditingSet(null);
                            }}>Cancel</Button>
                            <Button
                                variant="primary"
                                loading={updateSetMutation.isPending}
                                onClick={() => updateSetMutation.mutate({
                                    id: editingSet.id,
                                    data: editSetData
                                })}
                            >
                                Update Set
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PersonaManagement;
