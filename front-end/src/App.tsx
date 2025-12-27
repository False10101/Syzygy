import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  Squares2X2Icon, 
  PlusCircleIcon, 
  ChartBarIcon, 
  ClockIcon, 
  ArrowLeftOnRectangleIcon,
  CpuChipIcon,
  CommandLineIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import Logo from './assets/Logo.png'

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NewScan from './pages/NewScan';
import AlignmentView from './pages/Alignment';
import AlignmentDetail from './pages/AlignmentDetail';
import ScanHistory from './pages/ScanHistory';
import CommandCenter from './pages/ComandCenter';
import Profile from './pages/Profile';

// ... (DashboardLayout code remains exactly the same) ...
const DashboardLayout = () => {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const NavItem = ({ to, icon: Icon, label, exact = false, readOnly = false }: any) => {
    const isActive = exact ? pathname === to : pathname.startsWith(to);
    
    const baseClasses = `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 border`;
    const activeStyle = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
    const inactiveStyle = 'border-transparent text-gray-400 hover:text-white hover:bg-white/5';
    
    const content = (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>
          )}
          <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
          <span className="font-medium text-sm tracking-wide">{label}</span>
        </>
      );
  
      if (readOnly) {
        return (
          <div className={`${baseClasses} ${isActive ? activeStyle : 'border-transparent text-gray-500 cursor-default opacity-70'}`}>
             {content}
          </div>
        );
      }
  
      return (
        <Link to={to} className={`${baseClasses} ${isActive ? activeStyle : inactiveStyle}`}>
          {content}
        </Link>
      );
  };

  return (
    <div className="flex h-screen bg-[#030712] text-white overflow-hidden relative selection:bg-indigo-500/30 font-sans">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_3px),linear-gradient(to_bottom,#80808012_1px,transparent_3px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/25 via-[#030712] to-[#030712] pointer-events-none"></div>

      <div className="w-[17.5%] border-r border-white/10 bg-[#030712]/60 backdrop-blur-xl flex flex-col shrink-0 relative z-20">
        
        <div className="p-6 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="relative w-10 h-10 flex items-center justify-center ">
              <img 
                src={Logo} 
                alt="Syzygy Logo" 
                className='w-full h-full object-cover scale-300 mt-1 mr-0.5 transition-transform duration-500 hue-rotate-[350deg] saturate-[1.5] brightness-[0.8]'
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">Syzygy</h1>
              <span className="text-[10px] font-semibold tracking-widest text-indigo-400 uppercase">Drift Detection</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">Overview</div>
          
          <NavItem to="/" exact icon={Squares2X2Icon} label="Command Center" />
          <NavItem to="/profile" icon={UserCircleIcon} label="Profile" />
          
          <div className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">Operations</div>
          
          <NavItem to="/new-scan" icon={PlusCircleIcon} label="New Scan" />
          
          {/* Note: This is strictly for visual indication. Actual navigation happens via code */}
          <NavItem to="/alignment" readOnly={true} icon={CommandLineIcon} label="Alignment View" />
          
          <NavItem to="/scan-history" icon={ClockIcon} label="Scan History" />
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group border border-transparent hover:border-red-500/10">
            <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative z-10 scroll-smooth">
        <Outlet />
      </div>

    </div>
  );
};


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(3, 7, 18, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#064e3b' },
              style: {
                border: '1px solid rgba(52, 211, 153, 0.2)',
                background: 'rgba(6, 78, 59, 0.6)',
                color: '#d1fae5',
                boxShadow: '0 0 20px rgba(52, 211, 153, 0.15)',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#450a0a' },
              style: {
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(69, 10, 10, 0.6)',
                color: '#fee2e2',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
              },
            },
            loading: {
              iconTheme: { primary: '#6366f1', secondary: '#1e1b4b' },
              style: {
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'rgba(30, 27, 75, 0.6)',
                color: '#e0e7ff',
              },
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CommandCenter />} />
            
            <Route path="new-scan" element={<NewScan />} />
            
            {/* Main Alignment View */}
            <Route path="alignment/:uuid" element={<AlignmentView />} />
            
            {/* 2. ADDED DETAIL ROUTE */}
            <Route path="alignment/:uuid/detail" element={<AlignmentDetail />} />

            <Route path="scan-history" element={<ScanHistory/>} />

            <Route path="profile" element={<Profile/>} />
            
            <Route path="analytics" element={<div className="p-10">Analytics Module Loading...</div>} />
            <Route path="history" element={<div className="p-10">Temporal Logs Loading...</div>} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}