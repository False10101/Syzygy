import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    ArrowLeftIcon, 
    FunnelIcon, 
    MagnifyingGlassIcon, 
    ArrowPathIcon,
    ExclamationTriangleIcon,
    ServerIcon,
    CommandLineIcon,
    WrenchScrewdriverIcon,
    ArrowDownTrayIcon,
    CpuChipIcon,
    LinkIcon,
    CodeBracketIcon,
    InformationCircleIcon
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

interface ScanStats {
    totalMatches: number;
    totalMismatches: number;
    totalOrphans: number;
    healthScore: string;
}

interface ProjectInfo {
    name: string;
    environment: string;
    lastScanned: string;
}

interface ScanResponseData {
    project: ProjectInfo;
    aligned: AlignmentResult[];
    frontendOrphans: RouteItem[];
    stats: ScanStats;
}

// --- HELPER COMPONENTS ---
const MethodBadge = ({ method }: { method: string }) => {
    const colors: Record<string, string> = {
        GET: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]',
        POST: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-[0_0_10px_rgba(96,165,250,0.2)]',
        PUT: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
        DELETE: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.2)]',
        PATCH: 'text-purple-400 bg-purple-400/10 border-purple-400/20 shadow-[0_0_10px_rgba(192,132,252,0.2)]',
    };
    const style = colors[method.toUpperCase()] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    return <span className={`px-2 py-0.5 text-[10px] font-bold border rounded tracking-wider ${style}`}>{method.toUpperCase()}</span>;
};

const StatusPill = ({ type, text }: { type: 'error' | 'warning' | 'orphan', text: string }) => {
    const styles = {
        error: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        orphan: 'bg-gray-800/50 text-gray-500 border-gray-700/50'
    };
    return <span className={`ml-auto px-2.5 py-1 rounded-md text-[10px] border font-medium uppercase tracking-wide ${styles[type]}`}>{text}</span>;
};

export default function AlignmentView() {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const [data, setData] = useState<ScanResponseData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchScanResults = async (force: boolean = false) => {
        if (!uuid) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/api/scan/details`, { uuid, forceScan: force }, { withCredentials: true });
            if (res.data.success) {
                setData(res.data.data);

                if (force) toast.success("Rescan complete");
            } else {
                setError("Failed to load scan data.");
                toast.error("Failed to load scan data.");
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || "Network Error";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScanResults();
    }, [uuid]);

    // --- NAVIGATION HANDLER ---
    const handleCardClick = (item: AlignmentResult) => {
        // We use the file path and line number to identify the unique definition
        // encodeURIComponent is crucial because paths contain '/'
        const encodedFile = encodeURIComponent(item.def.file);
        navigate(`/alignment/${uuid}/detail?file=${encodedFile}&line=${item.def.lineNumber}`);
    };

    // --- LOADING STATE ---
    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-[#030712] items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                    <CpuChipIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">DECRYPTING MATRIX</h2>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col h-screen bg-[#030712] items-center justify-center text-white">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-400">Connection Failed</h2>
                <p className="text-gray-500 mt-2">{error || "No data available"}</p>
                <button onClick={()=>fetchScanResults()} className="mt-6 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Retry</button>
            </div>
        );
    }

    const { aligned, frontendOrphans, stats, project } = data;

    return (
        <div className="flex flex-col h-screen bg-[#030712] text-white font-sans overflow-hidden relative selection:bg-indigo-500/30">
            
            {/* --- BACKGROUND EFFECTS --- */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>

            {/* --- HEADER --- */}
            <div className="h-20 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20 relative">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">
                                {project.name}
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400">
                                {project.environment}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1">
                             <div className="text-xs text-indigo-200/50 font-mono flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Sync Active
                            </div>
                            {stats.totalMismatches > 0 && (
                                <span className="text-red-400 text-xs font-medium flex items-center gap-1.5 animate-pulse">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    {stats.totalMismatches} Drift Detected
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Score HUD */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Health Score</div>
                            <div className={`text-xl font-mono font-bold ${Number(stats.healthScore) > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {stats.healthScore}%
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center relative">
                            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className={`${Number(stats.healthScore) > 80 ? 'text-emerald-500' : 'text-amber-500'}`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray={`${stats.healthScore}, 100`}
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2"></div>

                    <div className="relative group">
                         <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"></div>
                        <button 
                            onClick={()=>fetchScanResults(true)}
                            className="relative flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            RE-SCAN
                        </button>
                    </div>
                </div>
            </div>

            {/* --- COLUMN HEADERS --- */}
            <div className="flex border-b border-white/5 bg-[#030712]/90 shrink-0 text-xs font-bold text-gray-500 uppercase tracking-[0.1em] backdrop-blur-sm z-10">
                <div className="w-1/2 p-4 flex items-center justify-between border-r border-white/5 bg-purple-900/5">
                    <div className="flex items-center gap-2 text-purple-300">
                        <ServerIcon className="w-4 h-4" />
                        <span>Backend Definitions</span>
                    </div>
                    <span className="text-gray-600 font-mono bg-black/40 px-2 py-0.5 rounded">{aligned.length} ENDPOINTS</span>
                </div>
                <div className="w-1/2 p-4 flex items-center justify-between bg-cyan-900/5">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <CommandLineIcon className="w-4 h-4" />
                        <span>Frontend Consumption</span>
                    </div>
                    <span className="text-gray-600 font-mono bg-black/40 px-2 py-0.5 rounded">{aligned.reduce((acc, curr) => acc + curr.matches.length, 0) + frontendOrphans.length} CALLS</span>
                </div>
            </div>

            {/* --- MAIN SCROLL AREA --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-0">
                <div className="max-w-[1920px] mx-auto space-y-6">

                    {/* === INSTRUCTION BANNER === */}
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <InformationCircleIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-1">System Advisory: Drift Resolution</h3>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                                Select any matching pair to initialize the <strong>Detailed Inspector</strong>. 
                                For definitions with multiple consumers (One-to-Many), clicking the specific frontend card will 
                                target that exact consumption instance. Default selection targets the primary definition.
                            </p>
                        </div>
                    </div>
                    
                    {/* 1. MAPPED ROWS (Backend -> Frontend) */}
                    {aligned.map((item, idx) => (
                        <div key={idx} className="flex gap-8 group relative">
                            
                            {/* Visual Connector Line */}
                            {item.status !== 'orphaned' && item.matches.length > 0 && (
                                <div className={`absolute left-1/2 top-8 -translate-x-1/2 w-8 h-px z-0 transition-colors duration-300
                                    ${item.status === 'matched' 
                                        ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 group-hover:from-purple-500 group-hover:to-cyan-500' 
                                        : 'bg-gradient-to-r from-purple-500/30 to-red-500/30 group-hover:from-purple-500 group-hover:to-red-500'}`} 
                                />
                            )}

                            {/* LEFT: BACKEND CARD (Clickable) */}
                            <div 
                                // === NEW: REAL NAVIGATION ===
                                onClick={() => handleCardClick(item)}
                                className={`w-1/2 relative rounded-xl border p-5 transition-all duration-300 backdrop-blur-sm z-10 cursor-pointer
                                ${item.status === 'mismatch' ? 'bg-red-500/[0.02] border-red-500/30 hover:border-red-500/50' : 
                                  item.status === 'orphaned' ? 'bg-gray-900/20 border-white/5 border-dashed opacity-60 hover:opacity-100' : 
                                  'bg-purple-900/[0.05] border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-900/[0.08] hover:shadow-[0_0_20px_rgba(168,85,247,0.05)]'}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <MethodBadge method={item.def.method} />
                                        <span className="font-mono text-sm text-gray-200 font-medium tracking-tight">{item.def.path}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${item.status === 'matched' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : item.status === 'mismatch' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                                        <CodeBracketIcon className="w-3.5 h-3.5" />
                                        <span>{item.def.file}:{item.def.lineNumber}</span>
                                    </div>
                                    
                                    {/* Multi-Match Indicator */}
                                    {item.matches.length > 1 && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-medium">
                                            <LinkIcon className="w-3 h-3" />
                                            <span>{item.matches.length} Linked Calls</span>
                                        </div>
                                    )}

                                    {item.status === 'orphaned' && (
                                        <StatusPill type="orphan" text="Unused Endpoint" />
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: FRONTEND CARD(S) (Clickable individually) */}
                            <div className="w-1/2 space-y-4">
                                {item.matches.length > 0 ? (
                                    item.matches.map((match, mIdx) => (
                                        <div 
                                            key={mIdx} 
                                            // === NEW: REAL NAVIGATION ===
                                            // Currently goes to same place, but logic is hooked up
                                            onClick={() => handleCardClick(item)}
                                            className={`relative rounded-xl border p-5 transition-all duration-300 backdrop-blur-sm z-10 cursor-pointer
                                            ${item.status === 'mismatch' 
                                                ? 'bg-red-500/[0.02] border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:border-red-500/50' 
                                                : 'bg-cyan-900/[0.05] border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-900/[0.08] hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]'}`}
                                        >
                                            
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <MethodBadge method={match.method} />
                                                    <span className="font-mono text-sm text-gray-200 font-medium truncate max-w-[350px]" title={match.originalLine}>
                                                        {match.path}
                                                    </span>
                                                </div>
                                                {item.status === 'mismatch' ? (
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 animate-pulse" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                    <span>{match.file}:{match.lineNumber}</span>
                                                </div>
                                                
                                                {item.status === 'mismatch' && (
                                                    <StatusPill type="error" text={item.issue.split(":")[0]} />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    // Empty state on the right
                                    <div className="h-full border border-white/5 border-dashed rounded-xl flex items-center justify-center text-gray-700 text-xs italic bg-black/20">
                                        No frontend consumption detected
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 2. FRONTEND ORPHANS */}
                    {frontendOrphans.map((orphan, idx) => (
                        <div key={`orphan-${idx}`} className="flex gap-8 opacity-70 hover:opacity-100 transition-opacity">
                            {/* Empty Left */}
                            <div className="w-1/2 border border-white/5 border-dashed rounded-xl flex items-center justify-center text-gray-700 text-xs italic bg-black/20">
                                No backend definition found
                            </div>

                            {/* Orphaned Frontend Card */}
                            <div className="w-1/2 relative rounded-xl border border-amber-500/30 bg-amber-500/[0.02] p-5 hover:bg-amber-500/[0.05] transition-colors cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <MethodBadge method={orphan.method} />
                                        <span className="font-mono text-sm text-gray-200 font-medium">{orphan.path}</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-[10px] text-gray-500 font-mono">{orphan.file}:{orphan.lineNumber}</div>
                                    <StatusPill type="warning" text="Orphaned Call" />
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="h-16 border-t border-white/5 bg-[#030712]/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-8 text-xs font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                        <span className="text-gray-400">Matched: <span className="text-white font-bold text-sm ml-1">{stats.totalMatches}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                        <span className="text-gray-400">Drift: <span className="text-white font-bold text-sm ml-1">{stats.totalMismatches}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                        <span className="text-gray-400">Orphaned: <span className="text-white font-bold text-sm ml-1">{stats.totalOrphans}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download Report
                    </button>
                </div>
            </div>

        </div>
    );
}