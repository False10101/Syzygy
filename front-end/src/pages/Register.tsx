import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    UserIcon, 
    EnvelopeIcon, 
    LockClosedIcon, 
    ArrowRightIcon, 
    SparklesIcon 
} from '@heroicons/react/24/outline';
import Logo from '../assets/Logo.png';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(email, password, fullName);
      navigate('/');
    } catch (err) {
      console.error("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // MAIN CONTAINER: Dark Space Theme
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* BACKGROUND EFFECTS */}
      {/* 1. Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* 2. Radial Gradient Spotlights (Slightly different positions than Login for variety) */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* CARD WRAPPER */}
      <div className="w-full max-w-[440px] relative group z-10">
        
        {/* Card Glow Effect (Behind) */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-2xl opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>

        <div className="relative w-full bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              {/* 1. Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-600/30 blur-[60px] rounded-full pointer-events-none"></div>
              
              {/* 2. Logo Wrapper (Invisible Frame) */}
              <div className="relative h-24 w-24 mx-auto flex items-center justify-center overflow-hidden rounded-full">
                <img 
                  src={Logo} 
                  alt="App Logo"
                  // Matching the scaling logic from Login.tsx
                  className="w-full h-full object-contain scale-[2.8] drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Initialize Account
            </h1>
            <p className="text-indigo-200/50 text-sm mt-2">Join the Syzygy network</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-indigo-200/60 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="text" 
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-black/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-indigo-200/60 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-black/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-indigo-200/60 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-black/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none blur-md"></div>
               <div className="relative flex items-center justify-center gap-2">
                 {isLoading ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     <span>Registering...</span>
                   </>
                 ) : (
                   <>
                     <span>Create Account</span>
                     <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
              </div>
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors relative group/link">
                Sign in
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-indigo-400 transition-all group-hover/link:w-full"></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 text-xs text-gray-600 font-mono opacity-50">
        SECURE TERMINAL ACCESS v2.0
      </div>

    </div>
  );
}