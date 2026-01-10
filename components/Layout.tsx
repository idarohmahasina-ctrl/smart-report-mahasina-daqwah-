
import React, { useState, useEffect } from 'react';
import { APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { 
  Settings as SettingsIcon, Home, UserCheck, 
  ShieldAlert, Trophy, Info, LogOut, Menu, 
  Cloud, Zap, LayoutDashboard, CloudOff, RefreshCw
} from 'lucide-react';
import { getSyncStatus } from '../services/dataService.ts';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  academicConfig: AcademicConfig;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, role, userName, userEmail, onLogout, academicConfig
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncVisual, setSyncVisual] = useState<'idle' | 'syncing' | 'error'>('idle');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  useEffect(() => {
    const interval = setInterval(() => {
      const isNew = getSyncStatus().isNewLocal;
      if (isNew) {
        setSyncVisual('syncing');
        setTimeout(() => setSyncVisual('idle'), 2000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'absen-guru', label: 'Absen Guru', icon: <UserCheck size={20} /> },
    { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={20} /> },
    { id: 'absen-sholat', label: 'Absen Sholat Santri', icon: <Zap size={20} /> },
    { id: 'pelanggaran', label: 'Input Pelanggaran', icon: <ShieldAlert size={20} /> },
    { id: 'prestasi', label: 'Input Prestasi', icon: <Trophy size={20} /> },
    { id: 'informasi', label: 'Informasi Data', icon: <Info size={20} /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <SettingsIcon size={20} /> },
    { id: 'panel-kontrol', label: 'Panel Kontrol', icon: <LayoutDashboard size={20} />, superOnly: true },
  ].filter(item => {
    if (item.superOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#fcfdfd] overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-emerald-950 text-white flex flex-col z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 pb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-black text-lg leading-none tracking-tighter text-white uppercase">Mahasina</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-800 text-white font-black shadow-lg' : 'hover:bg-emerald-900 text-emerald-100/50 hover:text-white'}`}>
              <span className={activeTab === item.id ? 'text-emerald-300' : 'text-emerald-500'}>{item.icon}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-900/50 bg-emerald-950/50">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-900/30 hover:bg-red-900/30 text-emerald-400 transition-all">
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Keluar</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="w-full flex items-center justify-between px-6 py-4 md:px-10 z-30 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-50">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={22} /></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-800 leading-none tracking-tight">Ahlan, {userName.split(' ')[0]}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{role}</span>
                 <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${syncVisual === 'syncing' ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">Live Cloud Sync</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-sm border border-slate-100 flex items-center justify-center">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
          <div className="px-4 pb-12 md:px-10 lg:px-12 max-w-[1400px] mx-auto pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
