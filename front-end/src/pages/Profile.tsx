import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    UserCircleIcon, 
    ShieldCheckIcon, 
    KeyIcon, 
    FingerPrintIcon, 
    ArrowPathIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    IdentificationIcon,
    CpuChipIcon,
    CommandLineIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

//Types
interface Token {
    id: number;
    name: string;
    provider: string;
    created_at: string;
}

// --- VISUAL ASSETS ---
const ScanlineOverlay = () => (
    <div className="absolute inset-0 pointer-events-none z-0 opacity-10" 
         style={{
             backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
             backgroundSize: '100% 2px, 3px 100%'
         }}
    />
);

const CornerBrackets = () => (
    <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg className="absolute top-0 left-0 w-4 h-4" viewBox="0 0 24 24">
            <path d="M1,23 V1 H23" fill="none" stroke="#6366f1" strokeWidth="2" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-4 h-4" viewBox="0 0 24 24">
            <path d="M23,1 V23 H1" fill="none" stroke="#6366f1" strokeWidth="2" />
        </svg>
    </div>
);

export default function Profile() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const { logout } = useAuth();

    // Profile State
    const [profile, setProfile] = useState({ full_name: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Token State
    const [tokens, setTokens] = useState<Token[]>([]);
    const [newTokenName, setNewTokenName] = useState('');
    const [newTokenValue, setNewTokenValue] = useState('');
    const [addingToken, setAddingToken] = useState(false);

    // Password State
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [savingPass, setSavingPass] = useState(false);

    // Initialize
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profRes, tokenRes] = await Promise.all([
                    axios.get(`${API_URL}/api/user/profile`),
                    axios.get(`${API_URL}/api/tokens`) // Assuming your route is mounted here
                ]);
                
                if (profRes.data.success) setProfile(profRes.data.user);
                if (tokenRes.data.success) setTokens(tokenRes.data.tokens);
                
            } catch (err) {
                toast.error("Failed to load user data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- HANDLERS ---

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            await axios.put(`${API_URL}/api/user/profile`, profile);
            toast.success("Identity record updated");
        } catch (err) {
            toast.error("Update rejected by server");
        } finally {
            setSaving(false);
        }
    };

    const handleAddToken = async () => {
        if(!newTokenName || !newTokenValue) {
            toast.error("Credentials incomplete");
            return;
        }
        setAddingToken(true);
        try {
            await axios.post(`${API_URL}/api/tokens`, { name: newTokenName, token: newTokenValue });
            // Refresh list
            const res = await axios.get(`${API_URL}/api/tokens`);
            setTokens(res.data.tokens);
            setNewTokenName('');
            setNewTokenValue('');
            toast.success("New uplink established");
        } catch (err) {
            toast.error("Failed to add token");
        } finally {
            setAddingToken(false);
        }
    }

    const handleDeleteToken = async (id: number) => {
        if(!window.confirm("Revoke this credential? This may break existing automated scans.")) return;
        try {
            await axios.delete(`${API_URL}/api/tokens/${id}`);
            setTokens(tokens.filter(t => t.id !== id));
            toast.success("Credential revoked");
        } catch (err) {
            toast.error("Revocation failed");
        }
    }

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error("Encryption keys do not match");
            return;
        }
        setSavingPass(true);
        try {
            await axios.put(`${API_URL}/api/user/password`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success("Security credentials rotated");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Authorization Failed");
        } finally {
            setSavingPass(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full bg-[#030712] flex items-center justify-center relative font-sans overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712]"></div>
                 <div className="flex flex-col items-center justify-center relative z-10 animate-pulse">
                    <CpuChipIcon className="w-12 h-12 text-indigo-500 mb-4" />
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-300">Loading User Matrix...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#030712] text-white flex flex-col overflow-hidden relative selection:bg-indigo-500/30 font-sans">
            
            {/* === BACKGROUND LAYERS === */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* HEADER */}
                    <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <FingerPrintIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Operative Profile</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-mono mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                ID: {profile.email.split('@')[0].toUpperCase()} // LEVEL 1 CLEARANCE
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* === LEFT COLUMN: IDENTITY & DANGER (Takes 1/4 of width) === */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            
                            {/* CARD 1: IDENTITY */}
                            <div className="relative group rounded-2xl bg-[#0A0E17]/60 backdrop-blur-sm border border-white/10 p-6 shadow-2xl overflow-hidden">
                                <CornerBrackets />
                                <ScanlineOverlay />
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 p-0.5 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                        <div className="w-full h-full rounded-full bg-[#0A0E17] flex items-center justify-center overflow-hidden">
                                            <span className="text-3xl font-bold text-white font-mono">{profile.full_name.charAt(0)}</span>
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-lg font-bold text-white text-center break-words w-full">{profile.full_name}</h2>
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30 mt-2">
                                        Active User
                                    </span>

                                    <div className="w-full h-px bg-white/5 my-6"></div>

                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 uppercase tracking-wider">Role</span>
                                            <span className="text-gray-300 font-mono">ADMINISTRATOR</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 uppercase tracking-wider">Status</span>
                                            <span className="text-emerald-400 font-mono">ONLINE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: DANGER ZONE */}
                            <div className="border border-red-500/20 bg-red-500/[0.02] rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                                        <ExclamationTriangleIcon className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Danger Zone</h4>
                                </div>
                                <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                                    Terminating your account will permanently wipe all scan history.
                                </p>
                                <button 
                                    onClick={() => {
                                        if(window.confirm("CONFIRM TERMINATION: Are you strictly sure?")) {
                                            axios.delete(`${API_URL}/api/user/account`).then(logout);
                                        }
                                    }}
                                    className="w-full py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest bg-red-500/5"
                                >
                                    Terminate Account
                                </button>
                            </div>
                        </div>

                        {/* === RIGHT AREA (Takes 3/4 of width) === */}
                        <div className="lg:col-span-3 space-y-6">
                            
                            {/* TOP ROW: PROFILE & PASSWORD (SIDE BY SIDE) */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                
                                {/* 1. EDIT PROFILE FORM */}
                                <div className="relative rounded-2xl bg-[#0A0E17]/40 backdrop-blur-sm border border-white/10 p-6 shadow-xl h-full flex flex-col">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl opacity-50"></div>
                                    
                                    <div className="flex items-center gap-2 mb-6">
                                        <IdentificationIcon className="w-5 h-5 text-indigo-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Update Credentials</h3>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="group">
                                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-indigo-400 transition-colors">Full Name</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={profile.full_name}
                                                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all font-mono"
                                                />
                                                <UserCircleIcon className="w-4 h-4 absolute left-3 top-3 text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-indigo-400 transition-colors">Email Address</label>
                                            <div className="relative">
                                                <input 
                                                    type="email" 
                                                    value={profile.email}
                                                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all font-mono"
                                                />
                                                <EnvelopeIcon className="w-4 h-4 absolute left-3 top-3 text-gray-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button 
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ShieldCheckIcon className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                {/* 2. SECURITY FORM */}
                                <div className="relative rounded-2xl bg-[#0A0E17]/40 backdrop-blur-sm border border-white/10 p-6 shadow-xl h-full flex flex-col">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl opacity-50"></div>

                                    <div className="flex items-center gap-2 mb-6">
                                        <KeyIcon className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Security Protocol</h3>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="group">
                                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-purple-400 transition-colors">Current Password</label>
                                            <input 
                                                type="password" 
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-purple-400 transition-colors">New Password</label>
                                                <input 
                                                    type="password" 
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all font-mono"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-purple-400 transition-colors">Confirm Password</label>
                                                <input 
                                                    type="password" 
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button 
                                            onClick={handleChangePassword}
                                            disabled={savingPass}
                                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {savingPass ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : "Update Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 3. DIGITAL KEYCHAIN (FULL WIDTH BOTTOM) */}
                            <div className="relative rounded-2xl bg-[#0A0E17]/40 backdrop-blur-sm border border-white/10 p-8 shadow-xl">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl opacity-50"></div>

                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <CommandLineIcon className="w-5 h-5 text-emerald-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Digital Keychain</h3>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {tokens.length} ACTIVE KEYS
                                    </div>
                                </div>

                                {/* SCROLLABLE List of Existing Tokens - FIX FOR "PUSHING DOWN" */}
                                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {tokens.map(token => (
                                        <div key={token.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded bg-white/5 text-emerald-500">
                                                    <KeyIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-200">{token.name}</div>
                                                    <div className="text-[9px] text-gray-500 font-mono">
                                                        GITHUB_PAT • ADDED {new Date(token.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteToken(token.id)}
                                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {tokens.length === 0 && (
                                        <div className="text-center p-4 border border-dashed border-white/10 rounded-lg text-xs text-gray-600 font-mono">
                                            No secure uplinks found.
                                        </div>
                                    )}
                                </div>

                                {/* Add New Token Form */}
                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Establish New Uplink</h4>
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <input 
                                                type="text" 
                                                placeholder="Label (e.g. Work)"
                                                value={newTokenName}
                                                onChange={(e) => setNewTokenName(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                type="password" 
                                                placeholder="ghp_xxxxxxxxxxxx"
                                                value={newTokenValue}
                                                onChange={(e) => setNewTokenValue(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleAddToken}
                                            disabled={addingToken}
                                            className="px-4 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 transition-all"
                                        >
                                            {addingToken ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <PlusIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}