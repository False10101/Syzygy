import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ServerIcon,
    CommandLineIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClipboardIcon,
    WrenchScrewdriverIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

// --- TYPES ---
interface RouteItem {
    file: string;
    lineNumber: number;
    type: "consumption" | "definition";
    method: string;
    path: string;
    originalLine: string;
    codeSnippet: string;
}

interface AlignmentResult {
    def: RouteItem;
    matches: RouteItem[];
    status: 'matched' | 'mismatch' | 'orphaned';
    issue: string;
}

// --- CODE PANEL COMPONENT ---
const CodePanel = ({ title, item, icon: Icon, isBackend }: { title: string, item: RouteItem | undefined, icon: any, isBackend: boolean }) => {
    const themeColor = isBackend ? 'purple' : 'cyan';
    const borderColor = isBackend ? 'border-purple-500/20' : 'border-cyan-500/20';
    const bgColor = isBackend ? 'bg-purple-900/[0.05]' : 'bg-cyan-900/[0.05]';
    const textColor = isBackend ? 'text-purple-400' : 'text-cyan-400';
    const highlightColor = isBackend ? 'border-purple-500' : 'border-cyan-500';

    const handleCopyPath = () => {
        if (item?.file) {
            navigator.clipboard.writeText(item.file);
            toast.success("File path copied to clipboard");
        }
    };

    if (!item) {
        return (
            <div className={`relative rounded-xl border border-dashed ${borderColor} h-full min-h-[300px] flex flex-col items-center justify-center text-gray-600 bg-black/20 backdrop-blur-sm`}>
                <Icon className="w-12 h-12 mb-3 opacity-20" />
                <span className="text-xs font-mono uppercase tracking-widest">No {title} Found</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col rounded-xl border ${borderColor} ${bgColor} overflow-hidden backdrop-blur-sm relative group h-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
             {/* Header */}
            <div className={`px-4 py-3 border-b ${borderColor} flex items-center justify-between bg-black/20`}>
                <div className={`flex items-center gap-2 ${textColor}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest shadow-black drop-shadow-sm">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[200px] opacity-70 hover:opacity-100 transition-opacity">{item.file}</span>
                    <button 
                        onClick={handleCopyPath}
                        className="p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-colors"
                        title="Copy file path"
                    >
                        <ClipboardIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Code Area */}
            <div className="p-4 overflow-x-auto custom-scrollbar flex-1 relative min-h-[280px] bg-[#05080F]/80">
                <div className="font-mono text-xs leading-6 text-gray-400">
                    {item.codeSnippet.split('\n').map((line, i) => {
                        const currentLineNum = (item.lineNumber - 2) + i;
                        const isHighlight = line.includes(item.originalLine) || currentLineNum === item.lineNumber;

                        return (
                            <div key={i} className={`flex gap-4 px-2 -mx-2 rounded transition-colors duration-200 ${isHighlight ? `bg-${themeColor}-500/10 border-l-2 ${highlightColor}` : 'hover:bg-white/[0.02]'}`}>
                                <span className="w-8 text-right text-gray-600 select-none opacity-50">{currentLineNum}</span>
                                <span className={`whitespace-pre-wrap flex-1 ${isHighlight ? 'text-gray-100 font-medium' : ''}`}>
                                    {line}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Metadata */}
            <div className={`px-4 py-2 border-t ${borderColor} bg-black/40 flex items-center gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider`}>
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBackend ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}></span>
                    Active Source
                </div>
                <div className="opacity-30">|</div>
                <div>Line {item.lineNumber}</div>
            </div>
        </div>
    );
};

export default function AlignmentDetail() {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const [searchParams] = useSearchParams();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const targetFile = searchParams.get('file');
    const targetLine = searchParams.get('line');

    const [selectedItem, setSelectedItem] = useState<AlignmentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    useEffect(() => {
        if (!uuid || !targetFile || !targetLine) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.post(`${API_URL}/api/scan/details`, { uuid }, { withCredentials: true });
                if (res.data.success) {
                    const allAligned: AlignmentResult[] = res.data.data.aligned;
                    const found = allAligned.find(item =>
                        item.def.file === decodeURIComponent(targetFile) &&
                        String(item.def.lineNumber) === targetLine
                    );

                    if (found) {
                        setSelectedItem(found);
                        setCurrentMatchIndex(0);
                    } else {
                        toast.error("Item not found");
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [uuid, targetFile, targetLine, API_URL]);

    const handleNext = () => {
        if (selectedItem && currentMatchIndex < selectedItem.matches.length - 1) {
            setCurrentMatchIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentMatchIndex > 0) {
            setCurrentMatchIndex(prev => prev - 1);
        }
    };

    // --- NEW: Copy Fix Handler ---
    const handleCopyPatch = () => {
        if (selectedItem && selectedItem.matches[currentMatchIndex]) {
            const match = selectedItem.matches[currentMatchIndex];
            // Replicate the logic used in display to get the exact string
            const fixedLine = match.originalLine.replace(/['"`].*?['"`]/, `'${selectedItem.def.path}'`);
            
            navigator.clipboard.writeText(fixedLine).then(() => {
                toast.success("Patch code copied");
            }).catch(() => {
                toast.error("Failed to copy");
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-[#030712] items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                    <CpuChipIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">ANALYZING CODE VECTOR</h2>
            </div>
        );
    }

    if (!selectedItem) return null;

    const activeMatch = selectedItem.matches[currentMatchIndex];
    const matchCount = selectedItem.matches.length;

    // Status Logic
    const isMismatch = selectedItem.status === 'mismatch';
    const isMatched = selectedItem.status === 'matched';
    const isOrphaned = selectedItem.status === 'orphaned';

    return (
        <div className="flex flex-col h-screen bg-[#030712] text-white font-sans overflow-hidden relative selection:bg-indigo-500/30">
            
            {/* --- BACKGROUND EFFECTS --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>

            {/* === HEADER === */}
            <div className="h-18 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20 relative">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10 group">
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">
                            Drift Inspector
                            <div className="h-4 w-px bg-white/10"></div>
                            
                            {/* Status Badge */}
                            {isMismatch && (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    {selectedItem.issue.includes('Method') ? 'Method Error' : 'Path Drift'}
                                </span>
                            )}
                            {isMatched && (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)] flex items-center gap-2">
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    Synced
                                </span>
                            )}
                            {isOrphaned && (
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center gap-2">
                                    <InformationCircleIcon className="w-3.5 h-3.5" />
                                    Orphaned
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-indigo-200/50 font-mono mt-1 flex items-center gap-2">
                             System Logic Inspection • <span className="text-gray-500">ID: {uuid?.slice(0,8)}</span>
                        </p>
                    </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4">
                    {matchCount > 1 && (
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1 backdrop-blur-sm">
                            <button
                                onClick={handlePrev}
                                disabled={currentMatchIndex === 0}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono px-4 text-gray-400 border-x border-white/5 mx-1">
                                Match <span className="text-white font-bold">{currentMatchIndex + 1}</span> / {matchCount}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={currentMatchIndex === matchCount - 1}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* === SCROLLABLE CONTENT === */}
            <div className="flex-1 overflow-hidden custom-scrollbar p-4 py-auto relative z-10">
                <div className="max-w-[1600px] mx-auto space-y-5">

                    {/* 2. CODE COMPARISON GRID */}
                    <div className="grid grid-cols-2 gap-6">
                        <CodePanel
                            title="Backend Definition"
                            item={selectedItem.def}
                            icon={ServerIcon}
                            isBackend={true}
                        />
                        <CodePanel
                            title="Frontend Consumption"
                            item={activeMatch}
                            icon={CommandLineIcon}
                            isBackend={false}
                        />
                    </div>

                    {/* 3. ANALYSIS & FIX SECTION */}
                    <div className="grid grid-cols-3 gap-6 pb-0">

                        {/* Analysis Panel */}
                        <div className={`col-span-1 rounded-2xl border backdrop-blur-sm p-8 flex flex-col h-full transition-all duration-300
                            ${isMismatch ? 'bg-red-500/[0.02] border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>

                            <h3 className="flex gap-2 items-center text-sm font-bold text-white mb-6 tracking-wide uppercase">
                                {
                                    isMismatch? <ExclamationTriangleIcon className='w-6 h-6 -ml-2.5 text-red-500'/> : <ShieldCheckIcon className='w-6 h-6 -ml-2.5 text-emerald-500 '/>
                                }
                                
                                {isMismatch ? 'Drift Diagnostics' : 'System Status'}
                            </h3>

                            {isMismatch ? (
                                <div className="space-y-3">
                                    <div className="relative pl-6 border-l border-white/10">
                                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#030712] border border-red-500 flex items-center justify-center text-[8px] font-bold text-red-500">1</div>
                                        <h4 className="text-xs font-bold text-red-300 mb-1 uppercase tracking-wider">Root Cause</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed font-mono">
                                            Path mismatch detected. Backend expects <span className="text-purple-300">{selectedItem.def.path}</span> but received <span className="text-cyan-300">{activeMatch?.path || 'unknown'}</span>.
                                        </p>
                                    </div>
                                    <div className="relative pl-6 border-l border-white/10">
                                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#030712] border border-amber-500 flex items-center justify-center text-[8px] font-bold text-amber-500">2</div>
                                        <h4 className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wider">Impact Analysis</h4>
                                        <p className="text-xs text-gray-400 leading-relaxed font-mono">
                                            High probability of <span className="text-red-400">404 Client Error</span>.
                                        </p>
                                    </div>
                                    
                                    {/* --- RESTORED: RELATED FILES SECTION --- */}
                                    <div className="relative pl-6 border-l border-white/10">
                                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#030712] border border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-400">3</div>
                                        <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">Related Files</h4>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-2 p-1.5 rounded bg-purple-500/10 border border-purple-500/20">
                                                <span className="text-[10px] text-purple-400 font-bold uppercase w-16">Backend</span>
                                                <span className="text-[10px] text-gray-300 font-mono truncate">{selectedItem.def.file.split('/').pop()}</span>
                                            </div>
                                            {activeMatch && (
                                                 <div className="flex items-center gap-2 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                                    <span className="text-[10px] text-cyan-400 font-bold uppercase w-16">Frontend</span>
                                                    <span className="text-[10px] text-gray-300 font-mono truncate">{activeMatch.file.split('/').pop()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-full text-center opacity-60">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-gray-300 font-medium">All Systems Nominal</p>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">Endpoint integrity verified.</p>
                                </div>
                            )}
                        </div>

                        {/* Suggested Fix Panel */}
                        <div className={`col-span-2 rounded-2xl border backdrop-blur-sm p-6 flex flex-col transition-all duration-300 relative overflow-hidden
                            ${isMismatch ? 'bg-indigo-900/[0.05] border-indigo-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                            
                            {/* Decorative gradient blob for fix panel */}
                            {isMismatch && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none"></div>}

                            <h3 className="flex items-center gap-3 text-sm font-bold text-white mb-5 tracking-wide uppercase relative z-10">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border
                                    ${isMismatch ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-gray-800/50 border-white/10 text-gray-500'}`}>
                                    <WrenchScrewdriverIcon className="w-4 h-4" />
                                </div>
                                {isMismatch ? 'Auto-Remediation Proposal' : 'Remediation'}
                            </h3>

                            {isMismatch ? (
                                <>
                                    <p className="text-xs text-gray-400 mb-4 font-mono relative z-10">
                                        Apply the following patch to the consumption layer:
                                    </p>
                                    <div className="flex-1 rounded-xl bg-[#020408] border border-white/10 p-5 font-mono text-xs overflow-x-auto relative mb-6 shadow-inner z-10">
                                        <div className="flex items-center w-full bg-red-500/5 -mx-5 px-5 py-1.5 border-l-2 border-red-500/50 opacity-60 mb-1">
                                            <span className="text-red-500 mr-4 select-none font-bold">-</span>
                                            <span className="text-red-400 decoration-line-through decoration-red-500/50">
                                                {activeMatch?.originalLine || "// Code line not found"}
                                            </span>
                                        </div>
                                        <div className="flex items-center w-full bg-emerald-500/5 -mx-5 px-5 py-1.5 border-l-2 border-emerald-500">
                                            <span className="text-emerald-500 mr-4 select-none font-bold">+</span>
                                            <span className="text-emerald-400 font-medium">
                                                {activeMatch?.originalLine.replace(/['"`].*?['"`]/, `'${selectedItem.def.path}'`) || "// Fix unavailable"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-auto relative z-10">
                                        <button 
                                            onClick={handleCopyPatch}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/20"
                                        >
                                            <ClipboardDocumentIcon className="w-4 h-4" />
                                            Copy Patch
                                        </button>
                                        <span className="text-[10px] text-gray-500 font-mono ml-2">Applies to {activeMatch?.file}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full border border-white/5 border-dashed rounded-xl bg-black/20">
                                    <ShieldCheckIcon className="w-12 h-12 text-gray-700 mb-3 opacity-50" />
                                    <span className="text-sm text-gray-500 font-medium">No actions pending</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}