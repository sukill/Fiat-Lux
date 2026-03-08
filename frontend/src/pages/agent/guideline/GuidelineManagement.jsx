import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Book, Library, ChevronRight, FileText, Compass, ExternalLink, Search, List, LayoutGrid, Hash, Filter } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/Forms';
import { ApiGuidelineRepository } from '../../../infrastructure/agent/guideline/adapters/ApiGuidelineRepository';
import { ApiStorageRepository } from '../../../infrastructure/agent/storage/adapters/ApiStorageRepository';

const guidelineRepo = new ApiGuidelineRepository();
const storageRepo = new ApiStorageRepository();

const GuidelineManagement = () => {
    const queryClient = useQueryClient();
    const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
    const [isSetModalOpen, setIsSetModalOpen] = useState(false);
    const [selectedGuideline, setSelectedGuideline] = useState(null);
    const [selectedSet, setSelectedSet] = useState(null);
    const [editingSet, setEditingSet] = useState(null);
    const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false);
    const [isEditGuidelineModalOpen, setIsEditGuidelineModalOpen] = useState(false);
    const [editingGuideline, setEditingGuideline] = useState(null);

    // Form States
    const [guidelineData, setGuidelineData] = useState({
        title: '',
        content: '',
        directory: '',
        repository: 'guideline-repo',
        branch: 'main'
    });
    const [setData, setSetData] = useState({
        name: '',
        description: '',
        repository: 'guideline-repo',
        branch: 'main',
        guideline_ids: []
    });
    const [editSetData, setEditSetData] = useState({
        name: '',
        description: '',
        repository: 'guideline-repo',
        branch: 'main',
        guideline_ids: []
    });
    const [editGuidelineData, setEditGuidelineData] = useState({
        title: '',
        content: '',
        directory: '',
        repository: 'guideline-repo',
        branch: 'main'
    });

    // Search & View States
    const [guidelineSearch, setGuidelineSearch] = useState('');
    const [setSearch, setSetSearch] = useState('');
    const [activeRepoTab, setActiveRepoTab] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

    React.useEffect(() => {
        if (editingSet) {
            setEditSetData({
                name: editingSet.name || '',
                description: editingSet.description || '',
                repository: editingSet.repository || 'guideline-repo',
                branch: editingSet.branch || 'main',
                guideline_ids: (editingSet.guidelines || []).map(g => g.id)
            });
        }
    }, [editingSet]);

    React.useEffect(() => {
        if (editingGuideline) {
            setEditGuidelineData({
                title: editingGuideline.title || '',
                content: editingGuideline.content || '',
                directory: editingGuideline.directory || '',
                repository: editingGuideline.repository || 'guideline-repo',
                branch: editingGuideline.branch || 'main'
            });
        }
    }, [editingGuideline]);

    // Queries
    const { data: guidelines, isLoading: loadingGuidelines } = useQuery({
        queryKey: ['guidelines'],
        queryFn: () => guidelineRepo.listGuidelines(),
    });

    const { data: guidelineSets, isLoading: loadingSets } = useQuery({
        queryKey: ['guidelineSets'],
        queryFn: () => guidelineRepo.listGuidelineSets(),
    });

    const { data: repositories } = useQuery({
        queryKey: ['repositories'],
        queryFn: () => storageRepo.listRepositories(),
    });

    const { data: guidelineRepositories } = useQuery({
        queryKey: ['guideline-repositories'],
        queryFn: () => guidelineRepo.listGuidelineRepositories(),
    });

    const { data: branchRefs } = useQuery({
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
    const createGuidelineMutation = useMutation({
        mutationFn: (data) => guidelineRepo.createGuideline(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelines'] });
            setIsGuidelineModalOpen(false);
            setGuidelineData({
                title: '',
                content: '',
                directory: '',
                repository: 'guideline-repo',
                branch: 'main'
            });
        }
    });

    const createSetMutation = useMutation({
        mutationFn: (data) => guidelineRepo.createGuidelineSet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelineSets'] });
            setIsSetModalOpen(false);
            setSetData({
                name: '',
                description: '',
                repository: 'guideline-repo',
                branch: 'main',
                guideline_ids: []
            });
        }
    });

    const updateSetMutation = useMutation({
        mutationFn: ({ id, data }) => guidelineRepo.updateGuidelineSet(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelineSets'] });
            setEditingSet(null);
            setIsEditSetModalOpen(false);
        }
    });

    const updateGuidelineMutation = useMutation({
        mutationFn: ({ id, data }) => guidelineRepo.updateGuideline(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guidelines'] });
            setEditingGuideline(null);
            setIsEditGuidelineModalOpen(false);
        }
    });

    const { data: guidelineRefs } = useQuery({
        queryKey: ['storage-refs', guidelineData.repository],
        queryFn: () => storageRepo.listRefs(guidelineData.repository),
        enabled: !!guidelineData.repository,
    });

    const { data: editGuidelineRefs } = useQuery({
        queryKey: ['storage-refs', editGuidelineData.repository],
        queryFn: () => storageRepo.listRefs(editGuidelineData.repository),
        enabled: !!editGuidelineData.repository,
    });

    // Filtered Data
    const filteredGuidelines = guidelines?.filter(g =>
        g.title.toLowerCase().includes(guidelineSearch.toLowerCase()) ||
        g.content.toLowerCase().includes(guidelineSearch.toLowerCase()) ||
        g.directory?.toLowerCase().includes(guidelineSearch.toLowerCase())
    );

    const directories = React.useMemo(() => {
        if (!guidelines) return [];
        const allPaths = new Set();
        guidelines.forEach(g => {
            if (!g.directory) return;
            const parts = g.directory.split('/');
            let current = '';
            parts.forEach((part, index) => {
                current = index === 0 ? part : `${current}/${part}`;
                allPaths.add(current);
            });
        });
        return [...allPaths].sort();
    }, [guidelines]);

    const filteredSets = guidelineSets?.filter(set => {
        const matchesSearch = set.name.toLowerCase().includes(setSearch.toLowerCase()) ||
            set.description?.toLowerCase().includes(setSearch.toLowerCase());
        const matchesRepo = activeRepoTab === 'All' || set.repository === activeRepoTab;
        return matchesSearch && matchesRepo;
    });

    const repoList = ['All', ...new Set(guidelineSets?.map(s => s.repository) || [])];

    return (
        <div className="space-y-10 animate-slide-up pb-20 max-w-[1600px] mx-auto px-4">
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

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar: Guideline Sets */}
                <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-6 sticky top-24">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100">
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
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {repo}
                            </button>
                        ))}
                    </div>

                    {/* Sets Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search sets..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
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
                                        ? 'border-l-purple-600 bg-purple-50/30'
                                        : 'border-l-transparent hover:border-l-purple-300'
                                        }`}
                                    onClick={() => setSelectedSet(set)}
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors line-clamp-1">{set.name}</h4>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase tracking-widest shrink-0">
                                                {set.guidelines?.length || 0}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[12px] line-clamp-2 leading-relaxed font-medium">
                                            {set.description || "Synthesized guideline container."}
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

                {/* Main Content: Guidelines List */}
                <main className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                                <FileText size={22} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-[#1E293B]">Guideline Modules</h3>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group min-w-[240px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Find a module..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    value={guidelineSearch}
                                    onChange={(e) => setGuidelineSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Module Information</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Last Updated</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loadingGuidelines ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={3} className="px-8 py-6 h-16 bg-slate-50/30" />
                                            </tr>
                                        ))
                                    ) : (
                                        filteredGuidelines?.map(guideline => (
                                            <tr
                                                key={guideline.id}
                                                className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                                onClick={() => setSelectedGuideline(guideline)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                                                            <Book size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{guideline.title}</p>
                                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tight">
                                                                    {guideline.repository}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tight">
                                                                    {guideline.directory || '/'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1 max-w-sm">{guideline.content}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg">
                                                        {guideline.createdAt ? new Date(guideline.createdAt).toLocaleDateString() : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right text-indigo-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <ChevronRight size={20} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {filteredGuidelines?.length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 font-bold">No guideline modules match your search.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loadingGuidelines ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[32px]" />)
                            ) : (
                                filteredGuidelines?.map(guideline => (
                                    <Card
                                        key={guideline.id}
                                        className="!p-0 border-white/5 cursor-pointer group hover:border-indigo-300/30 transition-all !rounded-[32px]"
                                        onClick={() => setSelectedGuideline(guideline)}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                    <Book size={24} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-bold text-[#1E293B] leading-tight group-hover:text-indigo-600 transition-colors">{guideline.title}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {guideline.createdAt ? new Date(guideline.createdAt).toLocaleDateString().toUpperCase() : 'NO DATE'}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{guideline.repository}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{guideline.directory || '/'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-all overflow-hidden h-32">
                                                <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap leading-relaxed font-medium">
                                                    {guideline.content}
                                                </p>
                                            </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Repository</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                                    value={guidelineData.repository}
                                    onChange={(e) => setGuidelineData({ ...guidelineData, repository: e.target.value })}
                                >
                                    {guidelineRepositories?.map(repoName => (
                                        <option key={repoName} value={repoName}>{repoName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Branch</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                                    value={guidelineData.branch}
                                    onChange={(e) => setGuidelineData({ ...guidelineData, branch: e.target.value })}
                                >
                                    {guidelineRefs?.map(ref => (
                                        <option key={ref.name} value={ref.name}>{ref.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DirectorySelector
                            value={guidelineData.directory}
                            onChange={(dir) => setGuidelineData({ ...guidelineData, directory: dir })}
                            directories={directories}
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Repository</label>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    {repositories?.filter(r => r.name.toLowerCase().includes('guideline')).map(repo => (
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
                                    {branchRefs?.map(ref => (
                                        <option key={ref.name} value={ref.name}>{ref.name}</option>
                                    ))}
                                    {!branchRefs?.length && <option value="main">main</option>}
                                </select>
                            </div>
                        </div>
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

            {/* Guideline Detail Modal */}
            <Modal
                isOpen={!!selectedGuideline}
                onClose={() => setSelectedGuideline(null)}
                title="Guideline Specification"
            >
                {selectedGuideline && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[28px] relative overflow-hidden">
                            <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-200/20 blur-[60px] rounded-full" />
                            <div className="relative flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                                    <Book size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">{selectedGuideline.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            EST. {selectedGuideline.createdAt ? new Date(selectedGuideline.createdAt).toLocaleDateString().toUpperCase() : 'PENDING'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGuideline.repository}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selectedGuideline.directory || '/'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedGuideline.branch}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-indigo-600" /> Operational Rules
                            </label>
                            <div className="bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/30" />
                                <pre className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap text-sm font-sans">
                                    {selectedGuideline.content}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <Button variant="outline" onClick={() => setSelectedGuideline(null)}>Close</Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setEditingGuideline(selectedGuideline);
                                    setIsEditGuidelineModalOpen(true);
                                    setSelectedGuideline(null);
                                }}
                            >
                                Edit Module
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Guideline Set Detail Modal */}
            <Modal
                isOpen={!!selectedSet}
                onClose={() => setSelectedSet(null)}
                title="Guideline Configuration"
            >
                {selectedSet && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="p-8 bg-purple-50/30 border border-purple-100 rounded-[32px] relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-48 h-48 bg-purple-200/20 blur-[80px] rounded-full" />

                            <div className="relative space-y-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-100 shrink-0">
                                        <Library size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSet.name}</h4>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/50 uppercase tracking-widest">
                                                {selectedSet.repository}
                                            </span>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-widest">
                                                {selectedSet.branch}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-md">
                                    {selectedSet.description || "Synthesized guideline container for AI operational alignment."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Integrated Modules</label>
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                    {selectedSet.guidelines?.length || 0} TOTAL
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                                {selectedSet.guidelines?.map(g => (
                                    <div key={g.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-purple-200 transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-400 group-hover:text-purple-600 transition-colors shadow-sm">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{g.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guideline Module</p>
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
                                Edit
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Guideline Set Edit Modal */}
            <Modal
                isOpen={isEditSetModalOpen}
                onClose={() => {
                    setIsEditSetModalOpen(false);
                    setEditingSet(null);
                }}
                title="Edit Guideline Set"
            >
                <div className="space-y-6">
                    <div className="space-y-6">
                        <Input
                            label="Set Name"
                            placeholder="e.g. Standard Operation Procedures"
                            value={editSetData.name}
                            onChange={(e) => setEditSetData({ ...editSetData, name: e.target.value })}
                        />
                        <Textarea
                            label="Set Context"
                            placeholder="What operational purpose does this collection of guidelines serve?"
                            value={editSetData.description}
                            onChange={(e) => setEditSetData({ ...editSetData, description: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300">Repository</label>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    {repositories?.filter(r => r.name.toLowerCase().includes('guideline')).map(repo => (
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
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-sm font-bold text-slate-600">Module Integration</label>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-wider">{editSetData.guideline_ids.length} integrated</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-100 scrollbar-thin">
                            {guidelines?.map(g => (
                                <label key={g.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer group ${editSetData.guideline_ids.includes(g.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-200'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 bg-white text-indigo-600 focus:ring-0 transition-all cursor-pointer"
                                        checked={editSetData.guideline_ids.includes(g.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked
                                                ? [...editSetData.guideline_ids, g.id]
                                                : editSetData.guideline_ids.filter(id => id !== g.id);
                                            setEditSetData({ ...editSetData, guideline_ids: ids });
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${editSetData.guideline_ids.includes(g.id) ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{g.title}</p>
                                    </div>
                                    <FileText size={16} className={editSetData.guideline_ids.includes(g.id) ? 'text-indigo-400' : 'text-slate-400'} />
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="outline" className="px-6" onClick={() => {
                            setIsEditSetModalOpen(false);
                            setEditingSet(null);
                        }}>Cancel</Button>
                        <Button
                            variant="secondary"
                            className="px-8"
                            loading={updateSetMutation.isPending}
                            onClick={() => updateSetMutation.mutate({
                                id: editingSet.id,
                                data: editSetData
                            })}
                        >
                            Save Set
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Edit Guideline Modal */}
            <Modal
                isOpen={isEditGuidelineModalOpen}
                onClose={() => {
                    setIsEditGuidelineModalOpen(false);
                    setEditingGuideline(null);
                }}
                title="Edit Guideline Module"
            >
                <div className="space-y-6">
                    <div className="space-y-6">
                        <Input
                            label="Module Title"
                            placeholder="e.g. Formatting & Technical Standards"
                            value={editGuidelineData.title}
                            onChange={(e) => setEditGuidelineData({ ...editGuidelineData, title: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Repository</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                                    value={editGuidelineData.repository}
                                    onChange={(e) => setEditGuidelineData({ ...editGuidelineData, repository: e.target.value })}
                                >
                                    {guidelineRepositories?.map(repoName => (
                                        <option key={repoName} value={repoName}>{repoName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Branch</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                                    value={editGuidelineData.branch}
                                    onChange={(e) => setEditGuidelineData({ ...editGuidelineData, branch: e.target.value })}
                                >
                                    {editGuidelineRefs?.map(ref => (
                                        <option key={ref.name} value={ref.name}>{ref.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DirectorySelector
                            value={editGuidelineData.directory}
                            onChange={(dir) => setEditGuidelineData({ ...editGuidelineData, directory: dir })}
                            directories={directories}
                        />

                        <Textarea
                            label="Guideline Content"
                            placeholder="Enter rules, constraints, and best practices..."
                            value={editGuidelineData.content}
                            onChange={(e) => setEditGuidelineData({ ...editGuidelineData, content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="outline" className="px-6" onClick={() => {
                            setIsEditGuidelineModalOpen(false);
                            setEditingGuideline(null);
                        }}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="px-8"
                            loading={updateGuidelineMutation.isPending}
                            onClick={() => updateGuidelineMutation.mutate({
                                id: editingGuideline.id,
                                data: editGuidelineData
                            })}
                        >
                            Update Module
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Sub-component for Folder/Directory Selection
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
                    <option value="">Root (guidelines/)</option>
                    {directories.map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default GuidelineManagement;
