import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ClockIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    CubeIcon,
    CalendarIcon,
    HashtagIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';

interface HistoryItem {
    id: number;
    project: {
        name: string;
        uuid: string;
        env: string;
    };
    date: string;
    status: string;
    stats: {
        total: number;
        drift: number;
        matched: number;
        score: number;
    };
}

// --- VISUAL ASSETS ---
// CRT Scanline Effect Overlay (Matched from CommandCenter)
const ScanlineOverlay = () => (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-10" 
         style={{
             backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
             backgroundSize: '100% 2px, 3px 100%'
         }}
    />
);

export default function ScanHistory() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/scan/history`, { withCredentials: true });
                if (res.data.success) {
                    setHistory(res.data.history);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (loading) {
        return (
            <div className="h-full w-full bg-[#030712] text-white flex flex-col items-center justify-center relative font-sans overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
                 
                 <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-3 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                        <CpuChipIcon className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
                        ACCESSING ARCHIVES
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">Decrypting History Logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#030712] text-white flex flex-col overflow-hidden relative selection:bg-indigo-500/30 font-sans">
            
            {/* === BACKGROUND LAYERS === */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>

            {/* === MAIN CONTENT === */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
                <div className="max-w-[1800px] mx-auto w-full">
                
                    {/* === HEADER SECTION === */}
                    <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-indigo-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative p-3 rounded-xl bg-[#0A0E17] border border-white/10 text-indigo-400 shadow-xl">
                                    <ClockIcon className="w-8 h-8" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                                    Scan Archives
                                </h1>
                                <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] uppercase tracking-wide">
                                        <HashtagIcon className="w-3 h-3 text-gray-600" />
                                        Global_Log
                                    </span>
                                    <span>•</span>
                                    <span className="text-xs">Audit trail for all environments</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate('/new-scan')}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 border border-transparent hover:border-indigo-400/50"
                        >
                            Initiate New Scan
                        </button>
                    </div>

                    {/* === DATA TABLE === */}
                    <div className="relative rounded-sm border border-white/10 bg-[#03050A]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                        
                        {/* CRT Scanline Overlay */}
                        <ScanlineOverlay />

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-black/40 text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] relative z-10">
                            <div className="col-span-4">Project Node</div>
                            <div className="col-span-3">Timestamp</div>
                            <div className="col-span-3">Integrity Metric</div>
                            <div className="col-span-2 text-right">Status Vector</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-white/5 relative z-10">
                            {history.map((scan) => {
                                const dateObj = formatDate(scan.date);
                                return (
                                    <div 
                                        key={scan.id}
                                        onClick={() => navigate(`/alignment/${scan.project.uuid}?scanId=${scan.id}`)}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group"
                                    >
                                        {/* Project Name */}
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                                <div className="relative w-8 h-8 rounded bg-[#0F121C] border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-all">
                                                    <CubeIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors font-mono tracking-tight">
                                                    {scan.project.name}
                                                </div>
                                                <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mt-0.5">
                                                    {scan.project.env}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
                                            <span className="text-[10px] text-gray-500 font-mono">{dateObj}</span>
                                        </div>

                                        {/* Score */}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-1 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                                                    <div 
                                                        className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${scan.stats.score >= 80 ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'}`} 
                                                        style={{ width: `${scan.stats.score}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-xs font-bold font-mono ${scan.stats.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {scan.stats.score}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Drift / Action */}
                                        <div className="col-span-2 flex justify-end">
                                            {scan.stats.drift > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Drift Detected</span>
                                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                     <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">Synced</span>
                                                     <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {history.length === 0 && (
                                <div className="py-24 flex flex-col items-center justify-center text-gray-600">
                                    <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
                                        <ClockIcon className="w-10 h-10 opacity-30" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-400">No Archives Found</h3>
                                    <p className="text-sm text-gray-600 mt-2 max-w-xs text-center font-mono text-xs">Execute a scan to generate your first historical entry.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}