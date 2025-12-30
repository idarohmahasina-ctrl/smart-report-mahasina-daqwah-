
import React, { useState, useEffect } from 'react';
import { ICONS, APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { Menu, X, Settings as SettingsIcon, Calendar, Cloud, CloudOff, RefreshCw, Coffee, ShieldCheck } from 'lucide-react';
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
  children, 
  activeTab, 
  setActiveTab, 
  role, 
  userName, 
  userEmail, 
  onLogout,
  academicConfig
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ connected: false, pending: false });

  useEffect(() => {
    const checkStatus = () => {
      const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
      const sync = getSyncStatus();
      setCloudStatus({ connected, pending: sync.isNewLocal });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.Dashboard },
    { id: 'absen-guru', label: 'Absen Guru', icon: ICONS.Absensi, hidden: role === UserRole.SANTRI_OFFICER },
    { id: 'absen-santri', label: 'Absen Santri', icon: ICONS.Students },
    { id: 'pelanggaran', label: 'Input Pelanggaran', icon: ICONS.Violations },
    { id: 'prestasi', label: 'Input Prestasi', icon: ICONS.Achievements },
    { id: 'informasi', label: 'Informasi', icon: ICONS.Info },
    { id: 'pengaturan', label: 'Pengaturan & Akun', icon: <SettingsIcon size={20} /> },
  ].filter(item => !item.hidden);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
          <img src={APP_LOGO} alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <div>
          <h1 className="font-black text-lg leading-none tracking-tighter text-white">SMART REPORT</h1>
          <span className="text-[7px] text-emerald-300 font-bold uppercase tracking-widest mt-1 block">Pondok Pesantren Mahasina<br/>Darul Quran wal Hadis</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
              ? 'bg-white text-emerald-800 font-black shadow-xl shadow-emerald-950/30 -translate-y-0.5' 
              : 'hover:bg-emerald-700/50 text-emerald-50'
            }`}
          >
            <span className={`${activeTab === item.id ? 'text-emerald-600' : 'text-emerald-300 group-hover:scale-110 transition-transform'}`}>
              {item.icon}
            </span>
            <span className="text-sm uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 mt-6 border-t border-emerald-700/50">
        <div className="px-5 mb-6 bg-emerald-900/40 p-4 rounded-2xl border border-emerald-700/30">
          <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-2">Petugas Aktif</p>
          <p className="text-sm font-black truncate leading-tight mb-1 text-white">{userName}</p>
          <div className="inline-block px-2 py-0.5 rounded-lg bg-emerald-600 text-[9px] font-black uppercase tracking-widest text-white">{role}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-red-600 transition-all text-emerald-200 hover:text-white group"
        >
          <span className="group-hover:rotate-12 transition-transform">{ICONS.Logout}</span>
          <span className="text-sm font-bold uppercase tracking-widest">Keluar Sistem</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="hidden lg:flex flex-col w-72 bg-emerald-800 text-white p-6 shrink-0 shadow-2xl z-30">
        <SidebarContent />
      </aside>

      <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-80 bg-emerald-800 text-white p-6 shadow-2xl transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-emerald-700 rounded-full transition-colors text-white">
              <X size={28} />
            </button>
          </div>
          <SidebarContent />
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-emerald-800">
              <Menu size={26} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assalamu'alaikum,</h2>
              <h2 className="text-base font-black text-slate-800 leading-none tracking-tight">
                Ustadz/ah <span className="text-emerald-600">{userName.split(' ')[0]}</span>
              </h2>
              <button 
                onClick={() => handleTabChange('pengaturan')}
                className="flex items-center gap-2 group text-left mt-1"
              >
                {cloudStatus.connected ? (
                  <div className="flex items-center gap-1">
                    <Cloud size={10} className={`${cloudStatus.pending ? 'text-amber-500 animate-pulse' : 'text-indigo-500'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${cloudStatus.pending ? 'text-amber-500' : 'text-indigo-500'}`}>
                      {cloudStatus.pending ? 'Syncing...' : 'Cloud Active'}
                    </span>
                    {cloudStatus.pending && <RefreshCw size={8} className="text-amber-500 animate-spin ml-1" />}
                    {!cloudStatus.pending && <ShieldCheck size={8} className="text-indigo-400 ml-1" />}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <CloudOff size={10} className="text-slate-300" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Local Mode (Off-sync)</span>
                  </div>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                 {academicConfig.isHoliday ? <Coffee size={18} className="text-amber-600"/> : <Calendar size={18} className="text-emerald-600" />}
                 {academicConfig.isHoliday && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Mode Libur</span>}
              </div>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-800 leading-none">TA {academicConfig.schoolYear}</span>
                <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-1">SEM {academicConfig.semester.split(' ')[0]}</span>
              </div>
            </div>
            
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1 shadow-sm overflow-hidden">
              <img src={APP_LOGO} alt="Avatar" className="w-full h-full object-contain" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
