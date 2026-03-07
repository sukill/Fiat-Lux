import React, { useState, useEffect, useMemo } from 'react';
import {
    Play,
    Loader2,
    CheckCircle,
    AlertCircle,
    Users,
    BookOpen,
    Send,
    Terminal,
    Settings,
    ChevronDown
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import { ApiPersonaRepository } from '../../../infrastructure/agent/persona/adapters/ApiPersonaRepository';
import { ApiGuidelineRepository } from '../../../infrastructure/agent/guideline/adapters/ApiGuidelineRepository';
import ApiWorkflowRepository from '../../../infrastructure/agent/workflow/adapters/ApiWorkflowRepository';

const WorkflowExecution = () => {
    const [userRequest, setUserRequest] = useState('');
    const [personaSets, setPersonaSets] = useState([]);
    const [guidelineSets, setGuidelineSets] = useState([]);
    const [selectedPersonaSet, setSelectedPersonaSet] = useState('');
    const [selectedGuidelineSet, setSelectedGuidelineSet] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [runResult, setRunResult] = useState(null);
    const [selectedPersonaIndex, setSelectedPersonaIndex] = useState(null);
    const [error, setError] = useState(null);

    const personaRepo = useMemo(() => new ApiPersonaRepository(), []);
    const guidelineRepo = useMemo(() => new ApiGuidelineRepository(), []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pSets, gSets] = await Promise.all([
                    personaRepo.listPersonaSets(),
                    guidelineRepo.listGuidelineSets()
                ]);
                setPersonaSets(pSets);
                setGuidelineSets(gSets);
            } catch (err) {
                console.error('Failed to fetch sets:', err);
                setError('Failed to load configuration sets.');
            } finally {
                setIsFetching(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let pollInterval;

        const pollStatus = async () => {
            if (runResult && ['planning', 'executing', 'waiting'].includes(runResult.status)) {
                try {
                    const response = await ApiWorkflowRepository.getRunStatus(runResult.id);
                    setRunResult(response.run);
                } catch (err) {
                    console.error('Polling failed:', err);
                }
            } else if (runResult && ['completed', 'failed'].includes(runResult.status)) {
                clearInterval(pollInterval);
            }
        };

        if (runResult && !['completed', 'failed'].includes(runResult.status)) {
            pollInterval = setInterval(pollStatus, 2000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [runResult?.id, runResult?.status]);

    const handleRun = async () => {
        if (!userRequest.trim()) return;

        setIsLoading(true);
        setError(null);
        setRunResult(null);
        setSelectedPersonaIndex(null);

        try {
            const response = await ApiWorkflowRepository.runWorkflow(
                userRequest,
                selectedPersonaSet || null,
                selectedGuidelineSet || null
            );
            setRunResult(response.run);
        } catch (err) {
            console.error('Workflow execution failed:', err);
            setError('Workflow execution failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[1440px] mx-auto py-10 px-6 animate-fade-in text-left">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Terminal size={20} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Execution Engine</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Workflow Command Center</h1>
                <p className="text-slate-500 mt-2 font-medium">Inject context, select personas, and trigger autonomous agent workflows.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Configuration Panel - Col 1-3 */}
                <div className="xl:col-span-3 space-y-6">
                    <Card className="p-6 border-slate-200/60 shadow-sm rounded-3xl bg-white/50 backdrop-blur-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Settings className="text-slate-400" size={16} />
                            RUN CONFIGURATION
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Users size={12} /> Persona Set
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer pr-10"
                                        value={selectedPersonaSet}
                                        onChange={(e) => setSelectedPersonaSet(e.target.value)}
                                        disabled={isFetching}
                                    >
                                        <option value="">Auto-infer (Dynamic)</option>
                                        {personaSets.map(set => (
                                            <option key={set.id} value={set.id}>{set.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BookOpen size={12} /> Guideline Set
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer pr-10"
                                        value={selectedGuidelineSet}
                                        onChange={(e) => setSelectedGuidelineSet(e.target.value)}
                                        disabled={isFetching}
                                    >
                                        <option value="">None (Optional)</option>
                                        {guidelineSets.map(set => (
                                            <option key={set.id} value={set.id}>{set.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-shake">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                {/* Execution & Status Panel - Col 4-8 */}
                <div className="xl:col-span-5 space-y-6">
                    <Card className="p-8 border-slate-200/60 shadow-xl rounded-[2.5rem] bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Play size={120} fill="currentColor" className="text-blue-600" />
                        </div>

                        <div className="relative z-10">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                MISSION OBJECTIVE
                            </label>
                            <textarea
                                className="w-full h-40 bg-slate-50/50 border-none rounded-3xl p-6 text-lg font-medium placeholder:text-slate-300 focus:ring-0 transition-all resize-none mb-6"
                                placeholder="What should the agent accomplish? Provide enough context for optimal persona selection..."
                                value={userRequest}
                                onChange={(e) => setUserRequest(e.target.value)}
                            />

                            <button
                                onClick={handleRun}
                                disabled={isLoading || !userRequest.trim()}
                                className={`
                                    w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300
                                    ${isLoading || !userRequest.trim()
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]'}
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>INITIATING WORKFLOW...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>EXECUTE RUN</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>

                    {runResult && (
                        <div className="space-y-6">
                            {runResult.selected_personas && runResult.selected_personas.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                        ORCHESTRATED TEAM ({runResult.selected_personas.length})
                                    </p>
                                    <div className="grid grid-cols-1 gap-4">
                                        {runResult.selected_personas.map((sel, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedPersonaIndex(selectedPersonaIndex === idx ? null : idx)}
                                                className={`
                                                    p-5 border transition-all cursor-pointer rounded-3xl relative overflow-hidden group
                                                    ${selectedPersonaIndex === idx
                                                        ? 'bg-blue-50/50 border-blue-400 shadow-md scale-[1.02]'
                                                        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200'
                                                    }
                                                `}
                                            >
                                                {sel.status === 'executing' && (
                                                    <div className="absolute top-0 left-0 h-1 bg-blue-500 animate-pulse w-full" />
                                                )}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${selectedPersonaIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <h5 className={`text-sm font-bold transition-colors ${selectedPersonaIndex === idx ? 'text-blue-700' : 'text-slate-900'}`}>
                                                                {sel.persona?.name || <span className="text-slate-300 italic font-medium">No Name</span>}
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-50 rounded-md ml-2">{sel.persona?.role || 'Custom Agent'}</span>
                                                            </h5>
                                                            <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1 italic">"{sel.assigned_task || 'Preparing...'}"</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${sel.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                        sel.status === 'executing' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {sel.status === 'executing' && <Loader2 size={10} className="animate-spin" />}
                                                        {sel.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-slate-900 rounded-[2rem] text-slate-300 font-mono text-[11px] leading-relaxed relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Terminal size={60} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-800 pb-3">
                                        <Terminal size={14} />
                                        <span className="font-bold uppercase tracking-widest">System Execution Logs</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p><span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-green-400">INFO:</span> Orchestrator initialized.</p>
                                        <p><span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span> <span className="text-yellow-400">STATUS:</span> {runResult.status} phase active.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Output Sidebar - Col 9-12 */}
                <div className="xl:col-span-4 xl:sticky xl:top-10 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto pr-2 custom-scrollbar">
                    {runResult ? (
                        <>
                            {runResult.status === 'completed' && runResult.collective_result && (
                                <div className="animate-slide-up">
                                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-2 mb-4">
                                        ASSEMBLED INTELLIGENCE
                                    </p>
                                    <div className="p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                            <Terminal size={60} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                {runResult.collective_result}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {runResult.selected_personas?.some(sel => sel.output) && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            {selectedPersonaIndex !== null ? 'TARGET OBSERVATION' : 'PERSONA OBSERVATIONS'}
                                        </p>
                                        {selectedPersonaIndex !== null && (
                                            <button
                                                onClick={() => setSelectedPersonaIndex(null)}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                                            >
                                                Show All
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {runResult.selected_personas
                                            .map((sel, idx) => ({ ...sel, originalIndex: idx }))
                                            .filter((sel) => sel.output && (selectedPersonaIndex === null || sel.originalIndex === selectedPersonaIndex))
                                            .map((sel, idx) => (
                                                <div key={sel.originalIndex} className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl animate-fade-in relative overflow-hidden group">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${selectedPersonaIndex === sel.originalIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {sel.originalIndex + 1}
                                                        </div>
                                                        <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                            {sel.persona?.name || 'Researcher'}
                                                        </h6>
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                                        {sel.output}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {!runResult.collective_result && !runResult.selected_personas?.some(sel => sel.output) && (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center animate-pulse">
                                    <Loader2 size={40} className="mb-4 animate-spin opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting output stream...</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
                            <Terminal size={48} className="mb-6 opacity-10" />
                            <p className="text-xs font-bold uppercase tracking-widest">Waiting for mission start</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowExecution;
