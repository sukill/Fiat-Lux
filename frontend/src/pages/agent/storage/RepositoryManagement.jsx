import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Library, Trash2, Plus, ExternalLink, Database, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import CreateRepoModal from '../../../components/storage/CreateRepoModal';
import { ApiStorageRepository } from '../../../infrastructure/agent/storage/adapters/ApiStorageRepository';

const storageRepo = new ApiStorageRepository();

const RepositoryManagement = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch repositories
    const { data: repositories, isLoading, error } = useQuery({
        queryKey: ['repositories'],
        queryFn: () => storageRepo.listRepositories()
    });

    // Delete mutation
    const deleteRepositoryMutation = useMutation({
        mutationFn: (name) => storageRepo.deleteRepository(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
        }
    });

    const handleDeleteRepository = (name) => {
        if (window.confirm(`"${name}" 리포지토리를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다.`)) {
            deleteRepositoryMutation.mutate(name);
        }
    };

    const handleOpenBrowser = (name) => {
        navigate(`/browser?repo=${name}`);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <Database size={28} />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Repositories</h2>
                    </div>
                    <p className="text-slate-500 font-medium max-w-md">
                        Manage your DocuHub storage instances. Connect guidelines and personas to these version-controlled repositories.
                    </p>
                </div>
                <Button variant="primary" className="px-6 h-12" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={20} className="mr-2" /> Create New Repository
                </Button>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-[32px] bg-slate-50 animate-pulse border border-slate-100" />
                    ))
                ) : error ? (
                    <div className="col-span-full p-8 rounded-[32px] bg-red-50 border border-red-100 flex flex-col items-center gap-4 text-center">
                        <AlertCircle size={48} className="text-red-400" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-red-900">Failed to load repositories</h3>
                            <p className="text-sm text-red-600">Please verify your DocuHub connection and try again.</p>
                        </div>
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['repositories'] })}>Retry</Button>
                    </div>
                ) : repositories?.length === 0 ? (
                    <div className="col-span-full p-20 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center gap-6 text-center bg-slate-50/50">
                        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-slate-300 shadow-sm">
                            <Library size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-400 italic">Storage is empty</h3>
                            <p className="text-slate-400 font-medium">Initialize your first repository to get started.</p>
                        </div>
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create First Repo</Button>
                    </div>
                ) : (
                    repositories?.map(repo => (
                        <div key={repo.name} className="group relative bg-white p-8 rounded-[32px] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col justify-between overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors" />

                            <div className="relative space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all duration-300">
                                        <Library size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenBrowser(repo.name)}
                                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Open in Browser"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRepository(repo.name)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Repository"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-900 transition-colors">{repo.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Storage</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>DocuHub Managed</span>
                                <span className="group-hover:text-blue-500 transition-colors">v1.0.0</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateRepoModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['repositories'] });
                }}
            />
        </div>
    );
};

export default RepositoryManagement;
