
import React, { useState, useEffect } from 'react';
import { APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { 
  Settings as SettingsIcon, UserCheck, 
  ShieldAlert, Trophy, Info, LogOut, Menu, 
  Zap, LayoutDashboard, ShieldCheck,
  Bell, Cloud, CloudOff, ChevronRight, UserRoundCheck
} from 'lucide-react';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const isAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isPetugasSantri = role === UserRole.SANTRI_OFFICER;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, visible: true },
    { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={20} />, visible: true },
    { id: 'absen-sholat', label: 'Absen Sholat', icon: <Zap size={20} />, visible: true },
    { id: 'absen-guru', label: 'Absen Guru', icon: <UserRoundCheck size={20} />, visible: !isPetugasSantri },
    { id: 'pelanggaran', label: 'Laporan VP', icon: <ShieldAlert size={20} />, visible: true },
    { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={20} />, visible: true },
    { id: 'informasi', label: 'Data Master', icon: <Info size={20} />, visible: isAdmin || role === UserRole.GURU || role === UserRole.IDAROH },
    { id: 'control-panel', label: 'Control Panel', icon: <ShieldCheck size={20} />, visible: isAdmin },
    { id: 'pengaturan', label: 'Pengaturan', icon: <SettingsIcon size={20} />, visible: true },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans select-none">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar Desktop & Mobile */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#064e3b] text-white flex flex-col z-[70] transition-transform duration-500 ease-out shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl ring-4 ring-emerald-500/10">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg leading-none tracking-tighter uppercase">Mahasina</h1>
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-1">Smart Report</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-5 text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-4">Navigasi Utama</p>
          {menuItems.filter(item => item.visible).map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-white/10 text-white font-black border-l-4 border-emerald-400 shadow-lg' : 'hover:bg-white/5 text-emerald-100/40 hover:text-white'}`}
            >
              <div className="flex items-center gap-4">
                <span className={activeTab === item.id ? 'text-emerald-400' : 'text-emerald-700 group-hover:text-emerald-400 transition-colors'}>{item.icon}</span>
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="text-emerald-400" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout Sistem</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <header className="w-full flex items-center justify-between px-6 py-4 md:px-10 z-40 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm pt-safe">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-95"><Menu size={22} /></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-800 leading-none tracking-tight">Ustadz/ah {userName.split(' ')[0]}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase tracking-widest border border-emerald-100">{role}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{academicConfig?.semester}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                {isOnline ? <Cloud size={14}/> : <CloudOff size={14}/>}
                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">
                  {isOnline ? 'Cloud Terhubung' : 'Offline'}
                </span>
             </div>
             <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 relative active:scale-90">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-12 bg-[#f8fafc]">
          <div className="px-4 md:px-10 lg:px-12 py-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/95 backdrop-blur-xl border border-slate-200 p-2 flex justify-around items-center z-50 shadow-2xl rounded-[2.5rem] pb-safe">
           {[
             { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={22} /> },
             { id: 'absen-santri', label: 'Absen', icon: <UserCheck size={22} /> },
             { id: 'absen-sholat', label: 'Sholat', icon: <Zap size={22} /> },
             { id: 'pelanggaran', label: 'Lapor', icon: <ShieldAlert size={22} /> },
             { id: 'pengaturan', label: 'Menu', icon: <SettingsIcon size={22} /> }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id)} 
               className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#064e3b] text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
             >
                {item.icon}
                <span className={`text-[7px] font-black uppercase tracking-widest ${activeTab === item.id ? 'opacity-100 mt-1' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
             </button>
           ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
