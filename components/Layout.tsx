
import React, { useState, useEffect } from 'react';
import { APP_LOGO } from '../constants.tsx';
import { UserRole, AcademicConfig } from '../types.ts';
import { 
  Settings as SettingsIcon, Home, UserCheck, 
  ShieldAlert, Trophy, Info, LogOut, Menu, X, User, ChevronRight,
  Cloud, CloudOff, RefreshCw, Zap, LayoutDashboard, DownloadCloud, UploadCloud, AlertCircle
} from 'lucide-react';
import { getSyncStatus, syncWithGDrive, pullFromGDrive } from '../services/dataService.ts';

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
  const [cloudStatus, setCloudStatus] = useState({ connected: false, pending: false, lastSync: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const checkStatus = () => {
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    const sync = getSyncStatus();
    setCloudStatus({ 
      connected, 
      pending: sync.isNewLocal,
      lastSync: sync.timestamp ? new Date(sync.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
    });
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickSync = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) {
      alert("Sesi Cloud habis. Silakan Logout dan Login kembali untuk memperbarui akses Google Drive.");
      return;
    }
    
    setIsProcessing(true);
    try {
      if (cloudStatus.pending) {
        // Ada data baru di HP -> Kirim (Push)
        const pushSuccess = await syncWithGDrive(token);
        if (pushSuccess) {
           await pullFromGDrive(token); // Setelah kirim, tarik data rekan lain
           alert("Data berhasil dikirim dan digabungkan dengan data tim di Cloud.");
           window.location.reload();
        } else {
           alert("Gagal mengirim data. Cek koneksi internet.");
        }
      } else {
        // Tidak ada data baru di HP -> Hanya ambil (Pull) data terbaru tim
        const pullSuccess = await pullFromGDrive(token);
        if (pullSuccess) {
           alert("Data tim terbaru berhasil ditarik dari Cloud.");
           window.location.reload();
        } else {
           alert("Data Anda sudah versi terbaru.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat sinkronisasi.");
    } finally {
      setIsProcessing(false);
      checkStatus();
    }
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
    { id: 'panel-kontrol', label: 'Panel Kontrol', icon: <LayoutDashboard size={20} />, superOnly: true },
  ].filter(item => {
    if (item.superOnly && !isSuperAdmin) return false;
    if (item.id === 'absen-guru') return role !== UserRole.SANTRI_OFFICER;
    return true;
  });

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-[#fcfdfd] overflow-hidden font-sans">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-emerald-950 text-white flex flex-col z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 shadow-2xl lg:shadow-none'}`}>
        <div className="p-8 pb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-xl transition-transform hover:rotate-3">
              <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none tracking-tighter text-white uppercase">Mahasina</h1>
              <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-1.5 block">Digital Boarding System</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-emerald-800 text-white font-black shadow-lg border border-emerald-700/50' 
                : 'hover:bg-emerald-900 text-emerald-100/50 hover:text-white'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-emerald-300' : 'text-emerald-500 group-hover:text-emerald-300'}`}>
                {item.icon}
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto text-emerald-400" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-emerald-900/50 bg-emerald-950/50">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-900/30 hover:bg-red-900/30 text-emerald-400 hover:text-red-400 transition-all group"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="w-full flex items-center justify-between px-4 py-4 md:px-10 lg:px-12 z-30 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-50">
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <h2 className="text-[11px] sm:text-sm md:text-base font-black text-slate-800 leading-none tracking-tight">
                Ahlan, <span className="text-emerald-700">{userName.split(' ')[0]}</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
               <div className="hidden md:flex flex-col items-end pr-2 pl-3">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                    {cloudStatus.pending ? 'BUTUH UPDATE' : 'SINKRON'}
                  </span>
                  <span className={`text-[8px] font-black uppercase ${cloudStatus.pending ? 'text-amber-600' : 'text-slate-800'}`}>
                    {cloudStatus.lastSync}
                  </span>
               </div>
               <button 
                disabled={!cloudStatus.connected || isProcessing}
                onClick={handleQuickSync}
                title={cloudStatus.pending ? "Klik untuk mengirim data Anda ke Cloud" : "Klik untuk mengambil data terbaru dari tim"}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                  isProcessing ? 'bg-indigo-50 text-indigo-600' :
                  cloudStatus.pending ? 'bg-amber-500 text-white shadow-lg animate-bounce' : 
                  'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                } disabled:opacity-30`}
               >
                 {isProcessing ? <RefreshCw size={16} className="animate-spin"/> : 
                  cloudStatus.pending ? <AlertCircle size={16}/> : <DownloadCloud size={16}/>}
                 <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest">
                    {isProcessing ? 'Proses...' : cloudStatus.pending ? 'Kirim Sekarang' : 'Tarik Data'}
                 </span>
               </button>
            </div>
            
            <div className="w-9 h-9 md:w-11 md:h-11 bg-white rounded-xl p-1 shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
              <img src={APP_LOGO} alt="Mahasina" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
          <div className="px-4 pb-12 md:px-10 lg:px-12 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
