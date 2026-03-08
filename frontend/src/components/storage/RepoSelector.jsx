import React from 'react';
import { Database, ChevronDown } from 'lucide-react';

const RepoSelector = ({ repositories, selectedRepo, onSelect }) => {
    return (
        <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Database className="w-4 h-4 text-blue-400" />
                <select
                    id="repo-selector"
                    value={selectedRepo || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer appearance-none pr-6"
                >
                    <option value="" disabled>저장소 선택...</option>
                    {repositories.map((repo) => (
                        <option key={repo.name} value={repo.name}>
                            {repo.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
            </div>
        </div>
    );
};

export default RepoSelector;
