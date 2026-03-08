import React, { useRef } from 'react';
import { FileCode, Download, Copy, Check } from 'lucide-react';

const FileViewer = ({ fileContent, isLoading }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!fileContent?.content) return;
        navigator.clipboard.writeText(fileContent.content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownload = () => {
        if (!fileContent?.content) return;
        const filename = fileContent.path?.split('/').pop() || 'file.txt';
        const blob = new Blob([fileContent.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-950/50">
                <div className="animate-pulse text-slate-500">불러오는 중...</div>
            </div>
        );
    }

    if (!fileContent) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950/50 text-slate-600">
                <FileCode className="w-12 h-12 mb-4 opacity-20" />
                <p>파일을 선택하여 내용을 확인하세요</p>
            </div>
        );
    }

    const lines = (fileContent.content || '').split('\n');
    const lineCount = lines.length;
    const lineNumWidth = String(lineCount).length;

    return (
        <div id="file-viewer-container" className="h-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-300 truncate">
                        {fileContent.path}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-600 shrink-0">
                        {lineCount} lines
                    </span>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button
                        id="copy-file-btn"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        title="복사"
                    >
                        {copied
                            ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
                            : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                        }
                    </button>
                    <button
                        id="download-file-btn"
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        title="다운로드"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* Code viewer with line numbers — scrollable */}
            <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed">
                <table className="w-full border-collapse min-w-0">
                    <tbody>
                        {lines.map((line, idx) => (
                            <tr
                                key={idx}
                                className="hover:bg-slate-900/60 group"
                            >
                                {/* Line number gutter */}
                                <td
                                    className="select-none text-right pr-4 pl-4 text-slate-600 group-hover:text-slate-400 transition-colors border-r border-slate-800 w-px whitespace-nowrap align-top"
                                    style={{ minWidth: `${lineNumWidth + 2}ch` }}
                                >
                                    {idx + 1}
                                </td>
                                {/* Line content */}
                                <td className="pl-4 pr-4 text-slate-300 whitespace-pre-wrap break-all align-top">
                                    {line || '\u00A0'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FileViewer;
