import React from 'react';
import { FileCode, Download, Copy } from 'lucide-react';

const FileViewer = ({ fileContent, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950/50">
                <div className="animate-pulse text-slate-500">불러오는 중...</div>
            </div>
        );
    }

    if (!fileContent) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/50 text-slate-600">
                <FileCode className="w-12 h-12 mb-4 opacity-20" />
                <p>파일을 선택하여 내용을 확인하세요</p>
            </div>
        );
    }

    return (
        <div id="file-viewer-container" className="flex-1 flex flex-col bg-slate-950 border-l border-slate-800">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-300 truncate max-w-md">
                        {fileContent.path}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button id="copy-file-btn" className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button id="download-file-btn" className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-slate-300">
                <pre id="file-content-pre" className="whitespace-pre-wrap">
                    {fileContent.content}
                </pre>
            </div>
        </div>
    );
};

export default FileViewer;
