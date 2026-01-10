
import React, { useState, useEffect } from 'react';
import { APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { 
  Settings as SettingsIcon, Home, UserCheck, 
  ShieldAlert, Trophy, Info, LogOut, Menu, 
  Cloud, Zap, LayoutDashboard, CloudOff, RefreshCw, AlertCircle
} from 'lucide-react';
import { getSyncStatus } from '../services/dataService.ts';

declare const google: any;

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
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'expired' | 'none'>('none');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  useEffect(() => {
    const checkCloud = () => {
      const hasToken = !!localStorage.getItem('mahasina_cloud_token');
      if (hasToken) setCloudStatus('connected');
      else if (localStorage.getItem('mahasina_cloud_connected') === 'true') setCloudStatus('expired');
      else setCloudStatus('none');
    };
    checkCloud();
    const intv = setInterval(checkCloud, 5000);
    return () => clearInterval(intv);
  }, []);

  const handleReconnect = () => {
    if (typeof google === 'undefined') return;
    const client = google.accounts.oauth2.initTokenClient({
      client_id: '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (res: any) => {
        if (res.access_token) {
          localStorage.setItem('mahasina_cloud_token', res.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          setCloudStatus('connected');
          window.location.reload();
        }
      }
    });
    client.requestAccessToken();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'absen-guru', label: 'Absen Guru', icon: <UserCheck size={20} /> },
    { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={20} /> },
    { id: 'absen-sholat', label: 'Absen Sholat Santri', icon: <Zap size={20} /> },
    { id: 'pelanggaran', label: 'Input Pelanggaran', icon: <ShieldAlert size={20} /> },
    { id: 'prestasi', label: 'Input Prestasi', icon: <Trophy size={20} /> },
    { id: 'informasi', label: 'Informasi Data', icon: <Info size={20} /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <SettingsIcon size={20} /> },
  ];

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
            <span className="text-[10px] font-black uppercase tracking-widest">Keluar Sesi</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="w-full flex items-center justify-between px-6 py-4 md:px-10 z-30 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={22} /></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-800 leading-none tracking-tight">Ustadz/ah {userName.split(' ')[0]}</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {cloudStatus === 'connected' && (
               <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"/>
                  <span className="text-[9px] font-black text-emerald-700 uppercase">Cloud Aktif</span>
               </div>
             )}
             
             {cloudStatus === 'expired' && (
               <button onClick={handleReconnect} className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100 hover:bg-red-100 transition-all group animate-bounce">
                  <AlertCircle size={14} className="text-red-600"/>
                  <span className="text-[9px] font-black text-red-700 uppercase group-hover:underline">Klik Untuk Re-Sync</span>
               </button>
             )}

             <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-sm border border-slate-100 flex items-center justify-center">
               <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
          <div className="px-4 pb-12 md:px-10 lg:px-12 max-w-[1400px] mx-auto pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
