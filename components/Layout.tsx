
import React, { useState } from 'react';
import { APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { 
  Settings as SettingsIcon, UserCheck, 
  ShieldAlert, Trophy, Info, LogOut, Menu, 
  Zap, LayoutDashboard, ShieldCheck,
  ClipboardCheck, MonitorCheck
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

  const isAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  
  const canSeeRecap = isAdmin || 
                     role === UserRole.PENGASUH || 
                     role === UserRole.IDAROH || 
                     role === UserRole.MUSYRIF || 
                     role === UserRole.GURU;
  
  const canSeeTeacherAttendance = role === UserRole.GURU || role === UserRole.MUSYRIF || role === UserRole.IDAROH || role === UserRole.PENGASUH;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Laporan', icon: <LayoutDashboard size={20} />, visible: true },
    { id: 'absen-guru', label: 'Absen Guru', icon: <MonitorCheck size={20} />, visible: canSeeTeacherAttendance },
    { id: 'absen-kbm', label: 'Absen KBM', icon: <UserCheck size={20} />, visible: true },
    { id: 'absen-sholat', label: 'Absen Pondok', icon: <Zap size={20} />, visible: true },
    { id: 'input-pelanggaran', label: 'Lapor Pelanggaran', icon: <ShieldAlert size={20} />, visible: true },
    { id: 'input-prestasi', label: 'Lapor Prestasi', icon: <Trophy size={20} />, visible: true },
    { id: 'rekap-laporan', label: 'Rekap Laporan', icon: <ClipboardCheck size={20} />, visible: canSeeRecap },
    { id: 'informasi', label: 'Informasi', icon: <Info size={20} />, visible: true },
    { id: 'panel-kontrol', label: 'Panel Kontrol', icon: <ShieldCheck size={20} />, visible: isAdmin },
    { id: 'pengaturan', label: 'Pengaturan', icon: <SettingsIcon size={20} />, visible: true },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans select-none">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#064e3b] text-white flex flex-col z-[70] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <img src={APP_LOGO} alt="Logo" className="w-10 h-10 bg-white p-1 rounded-xl" />
          <div className="flex flex-col">
            <h1 className="font-black text-sm uppercase tracking-tighter text-white">Mahasina</h1>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Smart Report</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.filter(item => item.visible).map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-white/10 text-white font-black' : 'text-emerald-100/50 hover:bg-white/5 hover:text-white'}`}
            >
              <span className={activeTab === item.id ? 'text-emerald-400' : ''}>{item.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all">
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="w-full flex items-center justify-between px-6 py-4 md:px-10 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm pt-safe">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Ahlan, {userName}</h2>
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">{role}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col text-right">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-none tracking-tight">Pesantren Mahasina</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Semester {academicConfig?.semester || '-'} • {academicConfig?.schoolYear || '-'}
                </p>
             </div>
             <img src={APP_LOGO} className="w-10 h-10 p-1 border rounded-xl" alt="Institution" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
          <div className="px-4 md:px-10 py-6 max-w-[1400px] mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
