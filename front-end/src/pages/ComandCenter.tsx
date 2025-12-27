import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Squares2X2Icon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    CubeIcon,
    ChartBarIcon,
    SignalIcon,
    BoltIcon,
    CpuChipIcon,
    GlobeAmericasIcon,
    ServerIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

// --- TYPES ---
interface HistoryItem {
    id: number;
    project: {
        name: string;
        uuid: string;
        env: string;
    };
    date: string;
    stats: {
        total: number;
        drift: number;
        score: number;
    };
}

// --- DYNAMIC COMPONENTS ---

// 1. System Status Ticker (Cycles through messages)
const StatusTicker = () => {
    const messages = [
        "SYSTEM INTEGRITY: VERIFIED",
        "ENCRYPTED UPLINK: ACTIVE",
        "SCANNING REPOSITORY VECTORS...",
        "DRIFT DETECTION: ENABLED",
        "NODE SYNC: COMPLETE"
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400/80 h-4 overflow-hidden">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="animate-in fade-in slide-in-from-bottom-1 duration-500 key={index}">
                {messages[index]}
            </span>
        </div>
    );
};

// 2. Simulated Network Latency (Jitters slightly)
const NetworkLatency = () => {
    const [ms, setMs] = useState(24);

    useEffect(() => {
        const interval = setInterval(() => {
            setMs(Math.floor(Math.random() * (45 - 12 + 1) + 12));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <SignalIcon className="w-3 h-3" />
            {ms}ms LATENCY
        </div>
    );
};

// 3. Dynamic Region Indicator (Replaces Hardcoded US-EAST-1)
const RegionIndicator = () => {
    const [region, setRegion] = useState("DETECTING...");

    useEffect(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Convert something like "Asia/Bangkok" to "ASIA-SE-NODE" or "America/New_York" to "AMER-EAST-NODE"
            let code = "GLOBAL";
            
            if (tz.includes('Asia')) code = "ASIA-PACIFIC";
            else if (tz.includes('Europe')) code = "EU-CENTRAL";
            else if (tz.includes('America')) code = "AMER-NORTH";
            else if (tz.includes('Africa')) code = "AFR-NODE";
            else if (tz.includes('Australia')) code = "OCEANIA";

            setRegion(`${code}-01`);
        } catch (e) {
            setRegion("GLOBAL-RELAY");
        }
    }, []);

    return (
        <div className="flex items-center gap-1.5">
            <GlobeAmericasIcon className="w-3.5 h-3.5" />
            {region}
        </div>
    );
};

// 4. HUD Corner Brackets
const CornerBrackets = ({ color }: { color: string }) => {
    const hex = color.includes('emerald') ? '#34d399' : color.includes('rose') ? '#fb7185' : '#818cf8';
    return (
        <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="absolute top-0 left-0 w-3 h-3 transition-all group-hover:w-5 group-hover:h-5 duration-500" viewBox="0 0 24 24">
                <path d="M1,23 V1 H23" fill="none" stroke={hex} strokeWidth="2" />
            </svg>
            <svg className="absolute bottom-0 right-0 w-3 h-3 transition-all group-hover:w-5 group-hover:h-5 duration-500" viewBox="0 0 24 24">
                <path d="M23,1 V23 H1" fill="none" stroke={hex} strokeWidth="2" />
            </svg>
        </div>
    );
};

// 5. SVG Trend Chart
const HealthTrendChart = ({ color }: { color: string }) => {
    const strokeColor = color.includes('emerald') ? '#34d399' : color.includes('amber') ? '#fbbf24' : '#6366f1';
    return (
        <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-500 mix-blend-screen">
            <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`grad-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M0,35 C20,32 30,25 50,28 C70,31 80,15 100,10 V40 H0 Z" fill={`url(#grad-${strokeColor})`} />
                <path d="M0,35 C20,32 30,25 50,28 C70,31 80,15 100,10" fill="none" stroke={strokeColor} strokeWidth="0.5" vectorEffect="non-scaling-stroke"/>
            </svg>
        </div>
    );
};

// --- DASHBOARD CARD ---
const DashboardCard = ({ title, value, subtext, icon: Icon, trend, color, showChart = false }: any) => (
    <div className="relative group overflow-hidden rounded-2xl bg-gray-900/40 backdrop-blur-sm border border-white/10 p-6 h-40 flex flex-col justify-between transition-all duration-300 hover:bg-gray-900/60 shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
        
        {/* Structural Borders */}
        <CornerBrackets color={color} />
        
        {/* Background Icon Watermark */}
        <div className={`absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 ${color} blur-sm`}>
            <Icon className="w-32 h-32" />
        </div>

        {/* Chart */}
        {showChart && <HealthTrendChart color={color} />}
        
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-2">
                <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${color} opacity-90`}>
                    <Icon className="w-4 h-4" />
                    <span>{title}</span>
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-black/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <SignalIcon className="w-2.5 h-2.5 animate-pulse" />
                        {trend}
                    </div>
                )}
            </div>
            
            <div>
                <div className="text-4xl font-bold text-white mb-1 font-mono tracking-tighter drop-shadow-md">{value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${color.replace('text-', 'bg-')}`}></div>
                    {subtext}
                </div>
            </div>
        </div>
    </div>
);

export default function CommandCenter() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalScans: 0,
        avgHealth: 0,
        activeDrifts: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/scan/history`, { withCredentials: true });
                if (res.data.success) {
                    const allHistory = res.data.history;
                    
                    const total = allHistory.length;
                    const drifts = allHistory.reduce((acc: number, curr: HistoryItem) => acc + curr.stats.drift, 0);
                    const avg = total > 0 
                        ? Math.round(allHistory.reduce((acc: number, curr: HistoryItem) => acc + curr.stats.score, 0) / total)
                        : 0;

                    setStats({
                        totalScans: total,
                        avgHealth: avg,
                        activeDrifts: drifts
                    });

                    setRecentScans(allHistory.slice(0, 5));
                }
            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // --- DYNAMIC BACKGROUND STATE ---
    const ambientColor = stats.activeDrifts > 0 ? 'bg-rose-600/5' : 'bg-indigo-600/5';
    const secondaryAmbient = stats.activeDrifts > 0 ? 'bg-amber-600/5' : 'bg-purple-600/5';

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
                        SYSTEM STARTUP
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">Initializing Command Interface...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#030712] text-white flex flex-col overflow-hidden relative selection:bg-indigo-500/30 font-sans">
            
            {/* === DYNAMIC ATMOSPHERE === */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>
            
            <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${ambientColor} animate-pulse`}></div>
            <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${secondaryAmbient}`}></div>

            {/* === MAIN SCROLLABLE AREA === */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
                <div className="max-w-[1800px] mx-auto w-full space-y-8">
                    
                    {/* === HEADER === */}
                    <div className="flex items-end justify-between border-b border-white/5 pb-6 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm relative overflow-hidden">
                        {/* Header Scanline */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Squares2X2Icon className="w-8 h-8 text-indigo-400" />
                                <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
                            </div>
                            
                            <StatusTicker />
                        </div>

                        <div className="text-right hidden md:block">
                             <div className="flex items-center justify-end gap-3 text-xs text-gray-500 font-mono mb-2">
                                <NetworkLatency />
                                <span className="text-gray-700">|</span>
                                {/* REPLACED HARDCODED US-EAST-1 */}
                                <RegionIndicator />
                             </div>
                            
                            <div className="text-xs font-bold text-white tracking-[0.2em] flex items-center gap-2 justify-end bg-black/40 px-3 py-1.5 rounded border border-white/10">
                                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${stats.activeDrifts > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                {stats.activeDrifts > 0 ? 'ANOMALIES DETECTED' : 'SYSTEM NOMINAL'}
                            </div>
                        </div>
                    </div>

                    {/* === KPI CARDS === */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard 
                            title="Total Operations" 
                            value={stats.totalScans.toLocaleString()} 
                            subtext="Cumulative scans executed" 
                            icon={CubeIcon} 
                            color="text-indigo-400"
                            trend="Active"
                        />
                        <DashboardCard 
                            title="System Integrity" 
                            value={`${stats.avgHealth}%`} 
                            subtext="Average health score" 
                            icon={ChartBarIcon} 
                            color={stats.avgHealth > 80 ? "text-emerald-400" : "text-amber-400"}
                            showChart={true}
                        />
                        <DashboardCard 
                            title="Active Anomalies" 
                            value={stats.activeDrifts} 
                            subtext="Drifts requiring attention" 
                            icon={BoltIcon} 
                            color="text-rose-400"
                            trend={stats.activeDrifts > 0 ? "Critical" : "Stable"}
                        />
                    </div>

                    {/* === RECENT ACTIVITY FEED === */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                                    Ingestion Log
                                </h3>
                            </div>
                            <button 
                                onClick={() => navigate('/scan-history')}
                                className="text-[10px] text-gray-500 hover:text-white font-mono uppercase tracking-wider flex items-center gap-2 transition-colors border-b border-transparent hover:border-white/20 pb-0.5 group"
                            >
                                View Archives <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Table Container */}
                        <div className="relative bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            
                            {/* Scanning Beam Animation */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="w-full h-[2px] bg-indigo-500/20 blur-sm absolute top-0 animate-[scan_4s_ease-in-out_infinite]"></div>
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-black/20 text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] relative z-10">
                                <div className="col-span-4">Project Node</div>
                                <div className="col-span-3">Timestamp</div>
                                <div className="col-span-3">Integrity Metric</div>
                                <div className="col-span-2 text-right">Status Vector</div>
                            </div>

                            {/* List Items */}
                            <div className="divide-y divide-white/5 relative z-10">
                                {recentScans.map((scan) => (
                                    <div 
                                        key={scan.id}
                                        onClick={() => navigate(`/alignment/${scan.project.uuid}?scanId=${scan.id}`)}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                                <div className="relative w-8 h-8 rounded bg-[#0F121C] border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-all">
                                                    <CubeIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors font-mono tracking-tight">{scan.project.name}</div>
                                                <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">{scan.project.env}</div>
                                            </div>
                                        </div>

                                        <div className="col-span-3 text-[10px] text-gray-500 font-mono">
                                            {formatDate(scan.date)}
                                        </div>

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

                                        <div className="col-span-2 flex justify-end">
                                            {scan.stats.drift > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Drift</span>
                                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                     <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">Synced</span>
                                                     <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {recentScans.length === 0 && (
                                    <div className="p-12 text-center flex flex-col items-center justify-center opacity-40">
                                        <CpuChipIcon className="w-12 h-12 text-gray-500 mb-2" />
                                        <div className="text-xs font-mono uppercase tracking-widest text-gray-500">System Idle - No Data</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Inline Styles for Custom Scan Animation */}
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}