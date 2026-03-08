import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import RepoSelector from '../../../components/storage/RepoSelector';
import FileTree from '../../../components/storage/FileTree';
import FileViewer from '../../../components/storage/FileViewer';
import { FolderTree, Home, ChevronRight, GitBranch } from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const BrowserPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const repoParam = searchParams.get('repo');
    const pathParam = searchParams.get('path') || '';
    const refParam = searchParams.get('ref') || 'main';

    // 브랜치/태그 목록 조회
    const { data: refs } = useQuery({
        queryKey: ['refs', repoParam],
        queryFn: async () => {
            if (!repoParam) return { refs: [] };
            const params = new URLSearchParams({ repo_name: repoParam });
            const res = await fetch(`${API_BASE_URL}/storage/refs?${params}`);
            if (!res.ok) return { refs: [] };
            return res.json();
        },
        enabled: !!repoParam,
    });

    // 저장소 목록 조회
    const { data: repos = [] } = useQuery({
        queryKey: ['repositories'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/storage/repositories`);
            if (!res.ok) throw new Error('Failed to fetch repos');
            return res.json();
        }
    });

    // 파일 목록 조회
    const { data: entries = [], isLoading: isTreeLoading } = useQuery({
        queryKey: ['files', repoParam, pathParam, refParam],
        queryFn: async () => {
            if (!repoParam) return [];
            const params = new URLSearchParams({ repo_name: repoParam, path: pathParam, ref: refParam });
            const res = await fetch(`${API_BASE_URL}/storage/files?${params}`);
            if (!res.ok) throw new Error('Failed to fetch files');
            return res.json();
        },
        enabled: !!repoParam
    });

    // 파일 내용 조회 (선택된 것이 파일인 경우에만)
    const [selectedFile, setSelectedFile] = useState(null);
    const { data: fileContent, isLoading: isContentLoading } = useQuery({
        queryKey: ['file', repoParam, selectedFile, refParam],
        queryFn: async () => {
            if (!repoParam || !selectedFile) return null;
            const params = new URLSearchParams({ repo_name: repoParam, path: selectedFile, ref: refParam });
            const res = await fetch(`${API_BASE_URL}/storage/file?${params}`);
            if (!res.ok) throw new Error('Failed to fetch file content');
            return res.json();
        },
        enabled: !!repoParam && !!selectedFile
    });

    const handleRepoSelect = (repoName) => {
        setSearchParams({ repo: repoName, path: '', ref: 'main' });
        setSelectedFile(null);
    };

    const handleNavigate = (newPath) => {
        setSearchParams({ repo: repoParam, path: newPath, ref: refParam });
    };

    const handleFileSelect = (filePath) => {
        setSelectedFile(filePath);
    };

    const breadcrumbs = pathParam.split('/').filter(Boolean);

    return (
        <div id="browser-page" className="h-full flex flex-col bg-slate-900">
            {/* Sub-header for Browser controls */}
            <div id="browser-controls" className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <FolderTree className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-300">Storage Explorer</span>
                </div>
                <div id="repo-selector-container" className="flex items-center gap-3">
                    {/* Branch selector */}
                    {repoParam && (
                        <CustomSelect
                            id="branch-select"
                            icon={<GitBranch className="w-4 h-4" />}
                            value={refParam}
                            options={refs?.refs?.map((r) => ({ value: r.name, label: r.name })) || []}
                            onChange={(val) => {
                                setSearchParams({ repo: repoParam, path: pathParam, ref: val });
                                setSelectedFile(null);
                            }}
                            placeholder={refParam}
                        />
                    )}
                    <RepoSelector
                        repositories={repos}
                        selectedRepo={repoParam}
                        onSelect={handleRepoSelect}
                    />
                </div>
            </div>

            {/* Breadcrumbs / Path bar */}
            <div id="browser-breadcrumbs" className="px-6 py-2 border-b border-slate-800 bg-slate-950 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button
                    onClick={() => handleNavigate('')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                    <Home className="w-4 h-4" />
                </button>
                {repoParam && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className="text-sm font-medium text-blue-400">{repoParam}</span>
                        {breadcrumbs.map((segment, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                                <button
                                    onClick={() => handleNavigate(breadcrumbs.slice(0, idx + 1).join('/'))}
                                    className="text-sm text-slate-400 hover:text-white hover:underline"
                                >
                                    {segment}
                                </button>
                            </React.Fragment>
                        ))}
                    </>
                )}
            </div>

            {/* Content Area */}
            <div id="browser-content" className="flex-1 flex overflow-hidden">
                {/* Left: File Tree */}
                <div id="file-tree-sidebar" className="w-80 flex flex-col border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
                    {repoParam ? (
                        <FileTree
                            entries={entries}
                            onNavigate={handleNavigate}
                            onFileSelect={handleFileSelect}
                            currentPath={pathParam}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 italic text-sm text-center p-8">
                            상단 드롭다운에서 저장소를 선택하여 탐색을 시작하세요.
                        </div>
                    )}
                </div>

                {/* Right: Viewer */}
                <div id="file-viewer-main" className="flex-1 overflow-hidden">
                    <FileViewer fileContent={fileContent} isLoading={isContentLoading} />
                </div>
            </div>
        </div>
    );
};

export default BrowserPage;
