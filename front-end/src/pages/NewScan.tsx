import { useState, useEffect, useMemo } from 'react';
import {
    ServerIcon,
    CommandLineIcon,
    CodeBracketIcon, // Kept for potential use
    CheckCircleIcon,
    SparklesIcon,
    QuestionMarkCircleIcon,
    CpuChipIcon // Added for loading state
} from '@heroicons/react/24/outline';
import RepoIcon from '../assets/RepoIcon';
import {toast} from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- TYPES ---
interface Token {
    id: number;
    name: string;
    provider: string;
    created_at: string;
}

interface Repo {
    id: number;
    name: string;
    owner: string;
    default_branch: string;
    private: boolean;
    language: string;
    credentialId: number;
    sourceName: string;
    topics : string[];
}

interface RouteItem {
    file: string;
    lineNumber: number;
    type: "consumption" | "definition";
    method: string;
    path: string;
    originalLine: string;
    codeSnippet: string;
}

interface RouteList extends Array<RouteItem>{}

// --- FILTER LOGIC ---
const useRepoFilter = (repos: Repo[]) => {
  return useMemo(() => {
    
    const frontendRepos: Repo[] = [];
    const backendRepos: Repo[] = [];

    repos.forEach((repo) => {
      // Normalize everything to lowercase for easy matching
      const name = repo.name.toLowerCase();
      const topics = (repo.topics || []).map(t => t.toLowerCase());
      const lang = (repo.language || '').toLowerCase();

      // --- 1. DEFINITIONS ---
      const frontKeywords = ['frontend', 'client', 'web', 'ui', 'react', 'mobile', 'app', 'front-end'];
      const backKeywords = ['backend', 'server', 'api', 'database', 'service', 'admin', 'bot', 'back-end'];

      // --- 2. DETECTION ---
      const isNext = name.includes('nextjs') || topics.includes('nextjs');
      const nameIsFront = frontKeywords.some(k => name.includes(k));
      const nameIsBack = backKeywords.some(k => name.includes(k));
      const tagIsFront = topics.some(t => frontKeywords.includes(t) || t === 'css' || t === 'html');
      const tagIsBack = topics.some(t => backKeywords.includes(t) || t === 'node' || t === 'express' || t === 'docker');
      const langIsFront = ['html', 'css', 'swift', 'kotlin', 'dart', 'typescript', 'javascript'].includes(lang);
      const langIsBack = ['java', 'python', 'go', 'rust', 'php', 'c#', 'c++', 'dockerfile', 'shell', 'javascript'].includes(lang);

      // --- 3. SORTING LOGIC ---
      if (isNext) {
        frontendRepos.push(repo);
        backendRepos.push(repo);
        return; 
      }

      let assigned = false;

      if (nameIsFront || tagIsFront) {
        frontendRepos.push(repo);
        assigned = true;
      }

      if (nameIsBack || tagIsBack) {
        backendRepos.push(repo);
        assigned = true;
      }

      if (!assigned) {
        if (langIsBack) {
          backendRepos.push(repo);
        } 
        else if (langIsFront) {
          frontendRepos.push(repo); 
        } 
        else {
          frontendRepos.push(repo);
        }
      }
    });

    return { frontendRepos, backendRepos };
  }, [repos]);
};

export default function NewScan() {
    // --- STATE ---
    const [tokens, setTokens] = useState<Token[]>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

    const [repos, setRepos] = useState<Repo[]>([]);
    const [loadingRepos, setLoadingRepos] = useState<boolean>(false);
    
    // NEW: SCANNING LOADING STATE
    const [isScanning, setIsScanning] = useState<boolean>(false);

    // --- APPLY FILTER HOOK HERE ---
    const { frontendRepos, backendRepos } = useRepoFilter(repos);

    // Project Details
    const [projectName, setProjectName] = useState<string>('');
    const [environment, setEnvironment] = useState<string>('Production');

    // Backend Selection
    const [selectedBackendRepo, setSelectedBackendRepo] = useState<Repo | null>(null);
    const [backendBranches, setBackendBranches] = useState<string[]>([]);
    const [selectedBackendBranch, setSelectedBackendBranch] = useState<string | null>(null);
    const [loadingBackendBranches, setLoadingBackendBranches] = useState<boolean>(false);

    // Frontend Selection
    const [selectedFrontendRepo, setSelectedFrontendRepo] = useState<Repo | null>(null);
    const [frontendBranches, setFrontendBranches] = useState<string[]>([]);
    const [selectedFrontendBranch, setSelectedFrontendBranch] = useState<string | null>(null);
    const [loadingFrontendBranches, setLoadingFrontendBranches] = useState<boolean>(false);

    //API Response
    const [routeList, setRouteList] = useState<RouteList | null>(null);

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    // --- REPO FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoadingRepos(true);
            try {
                // 1. Fetch Tokens
                const tokensRes = await fetch(`${API_URL}/api/tokens`, { credentials: 'include' });
                const tokensResponse = await tokensRes.json();

                // FIX: Handle the { success: true, tokens: [...] } structure
                // If tokensResponse.tokens is undefined, default to empty array to prevent crash
                const tokensData: Token[] = tokensResponse.tokens || [];
                
                setTokens(tokensData);

                // 2. Handle Logic based on Token existence
                if (tokensData.length > 0) {
                    setSelectedTokenId(tokensData[0].id);
                } else {
                    setLoadingRepos(false);
                    return; // Stop if no tokens
                }

                // 3. Fetch Repos using the valid array
                const repoPromises = tokensData.map(async (token) => {
                    try {
                        const res = await fetch(`${API_URL}/api/github/repos?credentialId=${token.id}`, { credentials: 'include' });
                        const data = await res.json();
                        
                        // Safety check: ensure repo data is an array
                        if (Array.isArray(data)) {
                            return data.map((r: any) => ({ ...r, credentialId: token.id, sourceName: token.name }));
                        }
                        return [];
                    } catch (err) {
                        console.error(`Failed to fetch repos for token ${token.name}`);
                        return []; 
                    }
                });

                const results = await Promise.all(repoPromises);
                setRepos(results.flat());

            } catch (err) {
                console.error("Critical error fetching data:", err);
                toast.error("Failed to load repositories");
            } finally {
                setLoadingRepos(false);
            }
        };
        fetchAllData();
    }, [API_URL]);

    // --- BRANCH FETCHING (Backend) ---
    useEffect(() => {
        if (!selectedBackendRepo) return; 
        setLoadingBackendBranches(true);
        fetch(`${API_URL}/api/github/branches/${selectedBackendRepo.owner}/${selectedBackendRepo.name}?credentialId=${selectedBackendRepo.credentialId}`, { credentials: "include" })
            .then(res => res.json())
            .then((data: string[]) => {
                setBackendBranches(data);
                const defaultBranch = data.find(b => b === 'main' || b === 'master') || data[0];
                setSelectedBackendBranch(defaultBranch);
                setLoadingBackendBranches(false);
            })
            .catch(err => {
                setLoadingBackendBranches(false);
            });
    }, [selectedBackendRepo, API_URL]);

    // --- BRANCH FETCHING (Frontend) ---
    useEffect(() => {
        if (!selectedFrontendRepo) return;
        setLoadingFrontendBranches(true);
        fetch(`${API_URL}/api/github/branches/${selectedFrontendRepo.owner}/${selectedFrontendRepo.name}?credentialId=${selectedFrontendRepo.credentialId}`, { credentials: "include" })
            .then(res => res.json())
            .then((data: string[]) => {
                setFrontendBranches(data);
                const defaultBranch = data.find(b => b === 'main' || b === 'master') || data[0];
                setSelectedFrontendBranch(defaultBranch);
                setLoadingFrontendBranches(false);
            })
            .catch(err => {
                setLoadingFrontendBranches(false);
            });
    }, [selectedFrontendRepo, API_URL]);

    // --- START SCAN ---
    const handleStartScan = async () => {

        if(projectName === ''){
            toast.error("Please fill in the Project Designation!");
            return
        }
        else if(!selectedBackendRepo || !selectedFrontendRepo){
            toast.error("Please select both Repos!");
            return
        }
        else if(!selectedBackendBranch || !selectedFrontendBranch){
            toast.error("Please select both Branches!");
            return
        }
        
        // 1. START LOADING
        setIsScanning(true);

        console.log("Starting scan...");

        try {
            const { data } = await axios.post(`${API_URL}/api/scan/start`,{
                name: projectName,
                environment: environment,
                frontendOwner: selectedFrontendRepo?.owner, 
                backendOwner: selectedBackendRepo?.owner , 
                backendRepo: selectedBackendRepo?.name, 
                frontendRepo: selectedFrontendRepo?.name, 
                backendBranch: selectedBackendBranch, 
                frontendBranch: selectedFrontendBranch, 
                frontendCredentialId: selectedFrontendRepo?.credentialId, 
                backendCredentialId: selectedBackendRepo?.credentialId 
            })

            if(data.success === true){
                navigate(`/alignment/${data.uuid}`); 
                console.log(data.uuid);
            }
            else {
                toast.error(data.error.response?.data?.error || 'Scanning failed!');
                setIsScanning(false); // Stop loading on soft error
            }

        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Scanning failed!');
            setIsScanning(false); // Stop loading on hard error
            throw error;
        }
    };

    return (
        <div className="h-full w-full bg-[#030712] text-white flex flex-col overflow-hidden relative selection:bg-indigo-500/30 font-sans">
            
            {/* === LOADING OVERLAY === */}
            {isScanning && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex flex-col items-center justify-center relative">
                        
                        {/* Radar/Spinner Effect */}
                        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                            {/* Outer Ring */}
                            <div className="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                            {/* Inner Ring */}
                            <div className="absolute inset-3 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                            {/* Core Glow */}
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                            {/* Center Icon */}
                            <CpuChipIcon className="w-8 h-8 text-white animate-pulse" />
                        </div>

                        {/* Text Effect */}
                        <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
                            ESTABLISHING UPLINK
                        </h2>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 font-mono">Analyzing Repository Vectors...</p>
                    </div>
                </div>
            )}

            {/* BACKGROUND EFFECTS  */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>

            {/* HEADER */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#030712]/60 backdrop-blur-md shrink-0 z-10 relative">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-3 tracking-tight text-white">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 ml-1">The Scan</span>
                    </h1>
                    <p className="text-xs text-indigo-200/50 mt-0.5 ml-1 font-medium">Scan your repositories</p>
                </div>
                <div className="flex items-center gap-6">
                    {/* Status Pill */}
                    <div className="px-3 py-1 rounded-full bg-black/40 border border-white/5 flex items-center gap-2 text-xs font-medium">
                        <span className={`relative flex h-2 w-2`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedTokenId ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${selectedTokenId ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className={selectedTokenId ? 'text-emerald-400' : 'text-gray-400'}>
                            {selectedTokenId ? 'GitHub Link Active' : 'No Token Found'}
                        </span>
                    </div>

                    <button
                        // FIXED: Removed the arrow function wrapper so it calls on click
                        onClick={handleStartScan}
                        disabled={isScanning}
                        className={`group relative px-5 py-2 rounded-lg bg-indigo-600 overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-100 transition-opacity group-hover:opacity-90" />
                        <div className="relative flex items-center gap-2 text-sm font-semibold text-white">
                            <SparklesIcon className="w-4 h-4" />
                            <span>Initialize Scan</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 max-w-[1800px] mx-auto w-full gap-6 z-0 relative">

                {/* 1. PROJECT DETAILS */}
                <div className="relative bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 py-5 shrink-0 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider opacity-90">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                        Mission Parameters
                    </h2>

                    <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div className="group">
                            <label className="block text-xs font-semibold text-indigo-200/60 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">Project Designation</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    disabled={isScanning}
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g., Orbital E-Commerce Platform"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
                                />
                                <div className="absolute right-3 top-3 text-gray-600">
                                    <CommandLineIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-semibold text-indigo-200/60 mb-2 uppercase tracking-wide group-focus-within:text-indigo-400 transition-colors">Target Environment</label>
                            <div className="relative">
                                <select
                                    disabled={isScanning}
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none shadow-inner cursor-pointer disabled:opacity-50"
                                >
                                    <option className="bg-gray-900">Production</option>
                                    <option className="bg-gray-900">Staging</option>
                                    <option className="bg-gray-900">Development</option>
                                </select>
                                <div className="absolute right-4 top-3.5 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. REPOSITORY SELECTION */}
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">

                    {/* BACKEND COLUMN (Purple Theme) */}
                    <div className="flex flex-col bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>

                        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <ServerIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-100">Backend Core</h3>
                                <p className="text-[10px] uppercase tracking-widest text-purple-300/60 font-semibold">Definition Source</p>
                            </div>
                            <div className="ml-auto text-gray-600 hover:text-purple-300 cursor-help transition-colors" title="Missing a repo? Add 'backend' or 'nextjs' to your GitHub Repository Topics.">
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative z-10">
                            {loadingRepos ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2">
                                    <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    <span>Scanning Uplink...</span>
                                </div>
                            ) : backendRepos.map(repo => (
                                <div
                                    key={repo.id}
                                    onClick={() => !isScanning && setSelectedBackendRepo(repo)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between group/item relative overflow-hidden
                                ${selectedBackendRepo?.id === repo.id
                                            ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}
                                ${isScanning ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden relative z-10">
                                        <div className={`p-1.5 rounded-md ${selectedBackendRepo?.id === repo.id ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 group-hover/item:text-white'}`}>
                                            <RepoIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`text-sm font-medium truncate ${selectedBackendRepo?.id === repo.id ? 'text-white' : 'text-gray-300'}`}>
                                                {repo.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 truncate font-mono">{repo.owner}</span>
                                        </div>
                                    </div>
                                    {selectedBackendRepo?.id === repo.id && (
                                        <div className="text-purple-400 animate-in fade-in zoom-in duration-200">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FRONTEND COLUMN (Blue/Cyan Theme) */}
                    <div className="flex flex-col bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700"></div>

                        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                <CommandLineIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-100">Frontend Interface</h3>
                                <p className="text-[10px] uppercase tracking-widest text-cyan-300/60 font-semibold">Consumption Source</p>
                            </div>
                            <div className="ml-auto text-gray-600 hover:text-cyan-300 cursor-help transition-colors" title="Missing a repo? Add 'frontend', 'react', or 'nextjs' to your GitHub Repository Topics.">
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative z-10">
                            {loadingRepos ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2">
                                    <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                                    <span>Scanning Uplink...</span>
                                </div>
                            ) : frontendRepos.map(repo => (
                                <div
                                    key={repo.id}
                                    onClick={() => !isScanning && setSelectedFrontendRepo(repo)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center justify-between group/item relative overflow-hidden
                                ${selectedFrontendRepo?.id === repo.id
                                            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}
                                ${isScanning ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden relative z-10">
                                        <div className={`p-1.5 rounded-md ${selectedFrontendRepo?.id === repo.id ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-400 group-hover/item:text-white'}`}>
                                            <RepoIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`text-sm font-medium truncate ${selectedFrontendRepo?.id === repo.id ? 'text-white' : 'text-gray-300'}`}>
                                                {repo.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500 truncate font-mono">{repo.owner}</span>
                                        </div>
                                    </div>
                                    {selectedFrontendRepo?.id === repo.id && (
                                        <div className="text-cyan-400 animate-in fade-in zoom-in duration-200">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. BRANCH SELECTION */}
                <div className="relative bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shrink-0 h-[220px] shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl pointer-events-none" />

                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider opacity-90 relative z-10">
                        <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                        Target Coordinates
                    </h2>

                    <div className="grid grid-cols-2 gap-6 h-[140px] relative z-10">

                        {/* Backend Branches */}
                        <div className="border border-white/5 rounded-xl p-1 bg-black/20 overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#0A0D16] z-10 py-1.5 px-3 mb-1 border-b border-white/5 backdrop-blur-md">
                                <h4 className="text-[10px] text-purple-300/80 uppercase font-bold tracking-widest">Backend Branch</h4>
                            </div>
                            <div className="p-1 space-y-1">
                                {loadingBackendBranches ? (
                                    <div className="text-xs text-gray-500 px-3 py-2 italic">Fetching vectors...</div>
                                ) : !selectedBackendRepo ? (
                                    <div className="text-xs text-gray-600 px-3 py-2 italic flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                                        Awaiting Repo Selection
                                    </div>
                                ) : (
                                    backendBranches.map(branch => (
                                        <div
                                            key={branch}
                                            onClick={() => !isScanning && setSelectedBackendBranch(branch)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all
                                ${selectedBackendBranch === branch
                                                    ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
                                ${isScanning ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full flex items-center justify-center ${selectedBackendBranch === branch ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-gray-700'}`}></div>
                                            <span className="font-mono">{branch}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Frontend Branches */}
                        <div className="border border-white/5 rounded-xl p-1 bg-black/20 overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#0A0D16] z-10 py-1.5 px-3 mb-1 border-b border-white/5 backdrop-blur-md">
                                <h4 className="text-[10px] text-cyan-300/80 uppercase font-bold tracking-widest">Frontend Branch</h4>
                            </div>
                            <div className="p-1 space-y-1">
                                {loadingFrontendBranches ? (
                                    <div className="text-xs text-gray-500 px-3 py-2 italic">Fetching vectors...</div>
                                ) : !selectedFrontendRepo ? (
                                    <div className="text-xs text-gray-600 px-3 py-2 italic flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                                        Awaiting Repo Selection
                                    </div>
                                ) : (
                                    frontendBranches.map(branch => (
                                        <div
                                            key={branch}
                                            onClick={() => !isScanning && setSelectedFrontendBranch(branch)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all
                                ${selectedFrontendBranch === branch
                                                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
                                ${isScanning ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full flex items-center justify-center ${selectedFrontendBranch === branch ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-gray-700'}`}></div>
                                            <span className="font-mono">{branch}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}