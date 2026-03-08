import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, User, ChevronRight, ShieldCheck, Zap, Trash2 } from 'lucide-react';
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

const PersonaManagement = () => {
    const queryClient = useQueryClient();
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
    const [isSetModalOpen, setIsSetModalOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [selectedSet, setSelectedSet] = useState(null);
    const [editingPersona, setEditingPersona] = useState(null);
    const [editingSet, setEditingSet] = useState(null);
    const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false);

    // Form States
    const [personaData, setPersonaData] = useState({
        name: '',
        role: '',
        systemPrompt: '',
        motivation: '',
        goals: '',
        constraints: '',
        guidelines: []
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
                guidelines: editingPersona.guidelines || []
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
                guidelines: []
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

    const handleDeletePersona = (e, persona) => {
        e.stopPropagation();
        if (window.confirm(`"${persona.name || 'Unnamed'}" 페르소나를 삭제할까요?`)) {
            deletePersonaMutation.mutate({ id: persona.id, namespace: persona.namespace });
        }
    };

    return (
        <div className="space-y-12 animate-slide-up pb-20">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm">
                <div className="hidden md:block">
                    <p className="text-slate-600 text-sm font-medium">Architect AI identities and curate functional sets.</p>
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

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-12 lg:gap-20 items-start">
                {/* Persona Sets Section */}
                <section className="xl:col-span-2">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                            <Users size={28} />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Persona Sets</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-8" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-8">
                        {loadingSets ? (
                            [1, 2, 3].map(i => <div key={i} className="h-48 glass-panel animate-pulse" />)
                        ) : (
                            personaSets?.map(set => (
                                <Card
                                    key={set.id}
                                    className="group cursor-pointer !p-0"
                                    onClick={() => setSelectedSet(set)}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{set.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {set.personas?.length || 0} Core Identit{set.personas?.length === 1 ? 'y' : 'ies'}
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                                                <ChevronRight className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
                                            {set.description || "No description provided for this persona set."}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-3">
                                                {set.personas?.slice(0, 4).map((p, idx) => (
                                                    <div key={idx} className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900 group-hover:border-indigo-500/30 flex items-center justify-center text-xs transition-colors">
                                                        <User size={16} className="text-indigo-400" />
                                                    </div>
                                                ))}
                                                {set.personas?.length > 4 && (
                                                    <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        +{set.personas.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold text-indigo-600/60 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">
                                                View Details
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors" />
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Individual Personas Section */}
                <section className="xl:col-span-3">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">Personas</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-8" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                        {loadingPersonas ? (
                            [1, 2, 3].map(i => <div key={i} className="h-48 glass-panel animate-pulse" />)
                        ) : (
                            personas?.map(persona => (
                                <Card
                                    key={persona.id}
                                    className="!p-0 border-slate-200 cursor-pointer group hover:border-purple-300 transition-all shadow-sm"
                                    onClick={() => setSelectedPersona(persona)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-center text-purple-600">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{persona.name || <span className="text-slate-300 italic">No Name</span>}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {persona.role} • ID: {persona.id.slice(0, 8)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-purple-100 rounded-full" />
                                            <p className="text-slate-600 text-sm font-medium leading-relaxed italic line-clamp-3 pl-4">
                                                "{persona.systemPrompt}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {persona.createdAt
                                                ? `CREATED ${new Date(persona.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}`
                                                : 'DATE UNKNOWN'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-widest"
                                                onClick={(e) => { e.stopPropagation(); setEditingPersona(persona); }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                onClick={(e) => handleDeletePersona(e, persona)}
                                                title="Delete persona"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Creation Modals (Premium Polish) */}
            <Modal
                isOpen={isPersonaModalOpen}
                onClose={() => setIsPersonaModalOpen(false)}
                title="Create New AI Identity"
            >
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium leading-relaxed">
                            Define the name, role, and behavioral constraints for the AI. The Name will be used for identification and selection.
                        </p>
                    </div>
                    <Input
                        label="Persona Name"
                        placeholder="e.g. Rosetta Translator"
                        value={personaData.name}
                        onChange={(e) => setPersonaData({ ...personaData, name: e.target.value })}
                    />
                    <Input
                        label="Persona Role"
                        placeholder="e.g. Senior Content Architect"
                        value={personaData.role}
                        onChange={(e) => setPersonaData({ ...personaData, role: e.target.value })}
                    />
                    <Textarea
                        label="System Directive"
                        placeholder="Define the persona's expertise, tone, and specific behavioral instructions..."
                        value={personaData.systemPrompt}
                        onChange={(e) => setPersonaData({ ...personaData, systemPrompt: e.target.value })}
                    />
                    <Textarea
                        label="Motivation"
                        placeholder="What drives this persona? e.g. Excellence in technical clarity"
                        value={personaData.motivation}
                        onChange={(e) => setPersonaData({ ...personaData, motivation: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Textarea
                            label="Goals (one per line)"
                            placeholder="Deliver bug-free code&#10;Optimize performance"
                            value={personaData.goals}
                            onChange={(e) => setPersonaData({ ...personaData, goals: e.target.value })}
                        />
                        <Textarea
                            label="Constraints (one per line)"
                            placeholder="Never use deprecated APIs&#10;Follow DRY principles"
                            value={personaData.constraints}
                            onChange={(e) => setPersonaData({ ...personaData, constraints: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300">Associated Guidelines</label>
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                            {loadingGuidelines ? (
                                <p className="text-xs text-slate-400">Loading guidelines...</p>
                            ) : (
                                guidelines?.map(g => (
                                    <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-indigo-600"
                                            checked={personaData.guidelines.includes(g.id)}
                                            onChange={(e) => {
                                                const ids = e.target.checked
                                                    ? [...personaData.guidelines, g.id]
                                                    : personaData.guidelines.filter(id => id !== g.id);
                                                setPersonaData({ ...personaData, guidelines: ids });
                                            }}
                                        />
                                        <span className="text-sm text-slate-700">{g.title}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsPersonaModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="secondary"
                            loading={createPersonaMutation.isPending}
                            onClick={() => {
                                // Map selected guideline IDs to their content strings
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
                                    guidelines: selectedGuidelinesContent
                                });
                            }}
                        >
                            Finalize Persona
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSetModalOpen}
                onClose={() => setIsSetModalOpen(false)}
                title="Curate Identity Set"
            >
                <div className="space-y-6">
                    <Input
                        label="Set Designation"
                        placeholder="e.g. Enterprise Creative Suite"
                        value={setData.name}
                        onChange={(e) => setSetData({ ...setData, name: e.target.value })}
                    />
                    <Textarea
                        label="Operational Description"
                        placeholder="What workflows will this group of personas serve?"
                        value={setData.description}
                        onChange={(e) => setSetData({ ...setData, description: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Repository</label>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                {repositories?.filter(r => r.name.toLowerCase().includes('persona')).map(repo => (
                                    <button
                                        key={repo.name}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${setData.repository === repo.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setSetData({ ...setData, repository: repo.name, branch: 'main' })}
                                    >
                                        {repo.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Branch / Ref</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
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
                            <label className="text-sm font-bold text-slate-300">Identity Selection</label>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">{setData.persona_ids.length} selected</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                            {personas?.map(p => (
                                <label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${setData.persona_ids.includes(p.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 bg-white text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                        checked={setData.persona_ids.includes(p.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...setData.persona_ids, p.id]
                                                : setData.persona_ids.filter(id => id !== p.id);
                                            setSetData({ ...setData, persona_ids: ids });
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${setData.persona_ids.includes(p.id) ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{p.name || <span className="opacity-50 italic font-medium">No Name</span>}</p>
                                        <p className="text-[10px] text-slate-400 group-hover:text-slate-500">{p.role}</p>
                                    </div>
                                    <User size={16} className={setData.persona_ids.includes(p.id) ? 'text-indigo-600' : 'text-slate-400'} />
                                </label>
                            ))}
                            {personas?.length === 0 && <p className="text-center py-8 text-sm text-slate-400 font-bold italic">No personas available to set.</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsSetModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="secondary"
                            loading={createSetMutation.isPending}
                            onClick={() => createSetMutation.mutate(setData)}
                        >
                            Assemble Set
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Persona Detail Modal */}
            <Modal
                isOpen={!!selectedPersona}
                onClose={() => setSelectedPersona(null)}
                title="Identity Blueprint"
            >
                {selectedPersona && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="p-6 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 border border-purple-100 rounded-[28px] relative overflow-hidden">
                            <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-200/20 blur-[80px] rounded-full" />

                            <div className="relative space-y-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 shrink-0">
                                        <User size={32} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                            {selectedPersona.name || <span className="text-slate-300 italic">No Name</span>}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded uppercase tracking-widest border border-slate-200/50">
                                                ID: {selectedPersona.id.slice(0, 8)}
                                            </span>
                                            <span className="text-[10px] font-bold text-purple-600/70 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                {selectedPersona.createdAt ? `EST. ${new Date(selectedPersona.createdAt).toLocaleDateString().toUpperCase()}` : 'Date Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-5">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full opacity-30" />
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em] mb-1 opacity-70">Role Specification</p>
                                    <p className="text-slate-700 text-sm font-semibold leading-relaxed">
                                        {selectedPersona.role}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} className="text-purple-600" /> System Directive
                            </label>
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-600/30" />
                                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap italic">
                                    "{selectedPersona.systemPrompt}"
                                </p>
                            </div>
                        </div>

                        {selectedPersona.motivation && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivation</label>
                                <p className="text-sm text-slate-600 leading-relaxed">{selectedPersona.motivation}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedPersona.goals?.length > 0 && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goals</label>
                                    <ul className="space-y-2">
                                        {selectedPersona.goals.map((goal, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
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
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
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

                        <div className="pt-4 flex justify-end">
                            <Button variant="outline" onClick={() => setSelectedPersona(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Persona Edit Modal */}
            <Modal
                isOpen={!!editingPersona}
                onClose={() => setEditingPersona(null)}
                title="Edit AI Identity"
            >
                {editingPersona && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                            <p className="text-xs text-purple-600 font-medium leading-relaxed">
                                Modify the role and system directive for this persona.
                            </p>
                        </div>
                        <Input
                            label="Persona Name"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                        <Input
                            label="Persona Role"
                            value={editData.role}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        />
                        <Textarea
                            label="System Directive"
                            value={editData.systemPrompt}
                            onChange={(e) => setEditData({ ...editData, systemPrompt: e.target.value })}
                        />
                        <Textarea
                            label="Motivation"
                            value={editData.motivation}
                            onChange={(e) => setEditData({ ...editData, motivation: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Textarea
                                label="Goals (one per line)"
                                value={editData.goals}
                                onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                            />
                            <Textarea
                                label="Constraints (one per line)"
                                value={editData.constraints}
                                onChange={(e) => setEditData({ ...editData, constraints: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300">Associated Guidelines</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                {loadingGuidelines ? (
                                    <p className="text-xs text-slate-400">Loading guidelines...</p>
                                ) : (
                                    guidelines?.map(g => {
                                        // Current persona's guidelines contain content strings. 
                                        // We need to check if ANY of the content strings match this guideline's content.
                                        const isSelected = editData.guidelines.includes(g.content);
                                        return (
                                            <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-indigo-600"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        const newGuidelines = e.target.checked
                                                            ? [...editData.guidelines, g.content]
                                                            : editData.guidelines.filter(content => content !== g.content);
                                                        setEditData({ ...editData, guidelines: newGuidelines });
                                                    }}
                                                />
                                                <span className="text-sm text-slate-700">{g.title}</span>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setEditingPersona(null)}>Cancel</Button>
                            <Button
                                variant="secondary"
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
                                        guidelines: editData.guidelines
                                    }
                                })}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Set Detail Modal */}
            <Modal
                isOpen={!!selectedSet}
                onClose={() => setSelectedSet(null)}
                title="Curated Identity Cluster"
            >
                {selectedSet && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="flex items-center gap-5 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Users size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 leading-tight">{selectedSet.name}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-200">
                                        ID: {selectedSet.id.slice(0, 8)}
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                        {selectedSet.personas?.length || 0} Core Identities
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Set Operational Context</label>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                {selectedSet.description || "No operational context provided for this set."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Integrated Identities</label>
                            <div className="grid grid-cols-1 gap-3">
                                {selectedSet.personas?.map(persona => (
                                    <div key={persona.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{persona.name || <span className="text-slate-300 italic font-medium">No Name</span>}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {persona.role} • Prompt: {persona.systemPrompt.slice(0, 40)}...
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedSet(null)}>Close</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingSet(selectedSet);
                                    setIsEditSetModalOpen(true);
                                    setSelectedSet(null);
                                }}
                            >
                                Edit
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
                title="Edit Identity Cluster"
            >
                <div className="space-y-6">
                    <Input
                        label="Set Designation"
                        placeholder="e.g. Enterprise Creative Suite"
                        value={editSetData.name}
                        onChange={(e) => setEditSetData({ ...editSetData, name: e.target.value })}
                    />
                    <Textarea
                        label="Operational Description"
                        placeholder="What workflows will this group of personas serve?"
                        value={editSetData.description}
                        onChange={(e) => setEditSetData({ ...editSetData, description: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Repository</label>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                {repositories?.filter(r => r.name.toLowerCase().includes('persona')).map(repo => (
                                    <button
                                        key={repo.name}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${editSetData.repository === repo.name ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setEditSetData({ ...editSetData, repository: repo.name, branch: 'main' })}
                                    >
                                        {repo.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Branch / Ref</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
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
                            <label className="text-sm font-bold text-slate-300">Identity Selection</label>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">{editSetData.persona_ids.length} selected</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                            {personas?.map(p => (
                                <label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${editSetData.persona_ids.includes(p.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 bg-white text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                        checked={editSetData.persona_ids.includes(p.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...editSetData.persona_ids, p.id]
                                                : editSetData.persona_ids.filter(id => id !== p.id);
                                            setEditSetData({ ...editSetData, persona_ids: ids });
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${editSetData.persona_ids.includes(p.id) ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'}`}>{p.name || <span className="opacity-50 italic font-medium">No Name</span>}</p>
                                        <p className="text-[10px] text-slate-400 group-hover:text-slate-500">{p.role}</p>
                                    </div>
                                    <User size={16} className={editSetData.persona_ids.includes(p.id) ? 'text-indigo-600' : 'text-slate-400'} />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditSetModalOpen(false);
                                setEditingSet(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            loading={updateSetMutation.isPending}
                            onClick={() => updateSetMutation.mutate({
                                id: editingSet.id,
                                data: editSetData
                            })}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PersonaManagement;
