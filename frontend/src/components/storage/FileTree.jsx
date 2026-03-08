import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';

const FileTreeEntry = ({ entry, onNavigate, onFileSelect, currentPath }) => {
    const [isOpen, setIsOpen] = useState(false);
    const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    const handleToggle = (e) => {
        e.stopPropagation();
        if (entry.is_dir) {
            setIsOpen(!isOpen);
            onNavigate(fullPath);
        } else {
            onFileSelect(fullPath);
        }
    };

    return (
        <div className="select-none">
            <div
                id={`file-tree-entry-${fullPath}`}
                onClick={handleToggle}
                className="flex items-center gap-2 py-1 px-2 hover:bg-slate-800 rounded cursor-pointer group transition-colors"
                data-path={fullPath}
            >
                {entry.is_dir ? (
                    <>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                        <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                    </>
                ) : (
                    <>
                        <div className="w-4" /> {/* Spacer for alignment */}
                        <File className="w-4 h-4 text-slate-400" />
                    </>
                )}
                <span className="text-sm text-slate-300 group-hover:text-white truncate">
                    {entry.name}
                </span>
            </div>

            {/* Recursion would happen here if we pre-fetched children, 
          but for simplicity in this browse-based model, we might fetch on click.
          Let's assume the parent handles child rendering for now. */}
        </div>
    );
};

const FileTree = ({ entries, onNavigate, onFileSelect, currentPath }) => {
    if (!entries || entries.length === 0) {
        return <div className="p-4 text-sm text-slate-500">파일이 없습니다.</div>;
    }

    return (
        <div id="file-explorer-tree" className="flex flex-col gap-0.5 p-2">
            {entries.map((entry) => (
                <FileTreeEntry
                    key={entry.name}
                    entry={entry}
                    onNavigate={onNavigate}
                    onFileSelect={onFileSelect}
                    currentPath={currentPath}
                />
            ))}
        </div>
    );
};

export default FileTree;
