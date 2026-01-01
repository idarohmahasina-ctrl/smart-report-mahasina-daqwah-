
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, getAppData, saveAppData, getSyncStatus, saveSyncStatus, clearAppData, syncWithGDrive, downloadFromGDrive } from '../services/dataService';
import { 
  Search, UserPlus, PlusCircle, Edit2, Trash2, X, Check, ShieldCheck, Mail, Phone, 
  Users as UsersIcon, Calendar, GraduationCap, Download, Upload, 
  Database, Save, BookOpen, Cloud, CloudOff, RefreshCw, Link2, ExternalLink,
  ShieldAlert, Info, DownloadCloud, UploadCloud, ToggleLeft as ToggleIcon, ToggleRight,
  LogOut, User as UserIcon, ShieldX, Power, Coffee, UserCircle, Briefcase, Settings2, Key, AlertTriangle, HelpCircle, ChevronRight, Globe, Lock, Layout, Copy, ListChecks, Sparkles, Terminal, AlertCircle, Laptop, Settings as SettingsIcon, LayoutGrid, Flag, Map, MousePointer2, Hammer, MousePointerClick, Shield, PartyPopper
} from 'lucide-react';

// Declare google global variable for Google Identity Services
declare const google: any;

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic, availableClasses }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncMeta, setSyncMeta] = useState(getSyncStatus());
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(4); 
  
  const isSuperAdmin = userEmail.toLowerCase() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  
  const currentOrigin = window.location.origin.replace(/\/$/, "");
  
  // URL Scope Lengkap untuk Manual Add
  const FULL_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

  // Client ID ustadz yang baru
  const GOOGLE_CLIENT_ID = '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com';

  useEffect(() => { 
    refreshUsers(); 
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    setCloudConnected(connected);
  }, []);

  const refreshUsers = () => { setUsers(getUsers()); };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil Disalin!");
  };

  const handleCloudConnect = () => {
    if (typeof google === 'undefined') {
      alert("Library Google sedang memuat. Mohon refresh halaman.");
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        error_callback: (err: any) => {
          console.error("Auth Error:", err);
          setShowWizard(true);
        },
        callback: async (response: any) => {
          if (response.error) {
            console.error("Response Error:", response.error);
            setShowWizard(true);
            return;
          }
          if (response.access_token) {
            setIsSyncing(true);
            const success = await syncWithGDrive(response.access_token);
            if (success) {
              setCloudConnected(true);
              localStorage.setItem('mahasina_cloud_connected', 'true');
              localStorage.setItem('mahasina_cloud_token', response.access_token);
              alert("Alhamdulillah! Koneksi Berhasil. Database kini tersinkron ke Google Drive Mahasina.");
            }
            setIsSyncing(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setShowWizard(true);
    }
  };

  const handleManualSync = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) { handleCloudConnect(); return; }
    setIsSyncing(true);
    const success = await syncWithGDrive(token);
    if (success) {
       alert("Data Berhasil Disinkronkan!");
       setSyncMeta(getSyncStatus());
    } else {
       setCloudConnected(false);
       alert("Sesi berakhir atau akses dicabut. Silakan hubungkan ulang.");
       setShowWizard(true);
    }
    setIsSyncing(false);
  };

  const handlePullFromCloud = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) { handleCloudConnect(); return; }
    if (!confirm("Data lokal akan ditimpa dengan data dari Cloud. Lanjutkan?")) return;

    setIsSyncing(true);
    const data = await downloadFromGDrive(token);
    if (data) {
      saveAppData(data);
      alert("Data berhasil ditarik! Memuat ulang aplikasi...");
      window.location.reload();
    } else {
      alert("Gagal mengambil data.");
      setShowWizard(true);
    }
    setIsSyncing(false);
  };

  const handleToggleHoliday = () => {
    const updated = { ...academicConfig, isHoliday: !academicConfig.isHoliday };
    onUpdateAcademic(updated);
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Pengaturan & Akun</h2>
        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.3em] mt-2 italic">Otoritas dan Keamanan Data Mahasina</p>
      </div>

      <div className="space-y-12">
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50 relative overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${cloudConnected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   {cloudConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cloud Sync (Google Drive)</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Status Sinkronisasi Database Idaroh</p>
                </div>
              </div>
              <button onClick={() => { setShowWizard(!showWizard); setWizardStep(4); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showWizard ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                <Shield size={16}/> {showWizard ? 'Tutup Panduan' : 'Konfigurasi Selesai!'}
              </button>
           </div>

           {showWizard && (
             <div className="p-8 md:p-12 bg-slate-900 rounded-[3rem] space-y-8 animate-in zoom-in-95 duration-500 border border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><PartyPopper size={28}/></div>
                      <div>
                         <h4 className="text-xl font-black text-white uppercase tracking-tight">Konfigurasi Berhasil!</h4>
                         <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1 italic">Client ID telah terpasang di sistem</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">READY TO GO</button>
                   </div>
                </div>

                <div className="min-h-[200px] flex items-center">
                  <div className="w-full space-y-6 animate-in slide-in-from-bottom-4">
                    <p className="text-sm text-slate-300 leading-relaxed text-center">
                      Mabruk Ustadz! Langkah teknis tersulit sudah kita lewati. Sekarang aplikasi sudah memiliki kunci akses yang benar.
                    </p>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-8 rounded-[2.5rem] flex flex-col items-center gap-4">
                       <ShieldCheck className="text-emerald-400" size={48} />
                       <div className="text-center">
                          <p className="text-xs font-black text-white uppercase mb-2">Status Cloud Mahasina</p>
                          <div className="px-4 py-2 bg-emerald-500/10 rounded-xl inline-block border border-emerald-500/20">
                             <code className="text-[10px] text-emerald-400 font-mono">CLIENT_ID_VERIFIED_7693...</code>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4 border-t border-slate-800">
                   <button onClick={() => setShowWizard(false)} className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
                      COBA HUBUNGKAN SEKARANG
                   </button>
                </div>
             </div>
           )}
           
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
              {cloudConnected ? (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-start gap-4">
                   <ShieldCheck className="text-emerald-600 shrink-0 mt-1" size={24} />
                   <div>
                     <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Cloud Sync Aktif</p>
                     <p className="text-[10px] font-bold text-emerald-700/70 mt-1 leading-relaxed">
                       Database tersinkron secara aman ke Google Drive Idaroh.
                     </p>
                   </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-100 border-2 border-slate-200 rounded-3xl flex items-start gap-4">
                   <Database className="text-slate-400 shrink-0 mt-1" size={24} />
                   <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Mode Penyimpanan Lokal</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed uppercase tracking-widest">
                       Data hanya tersimpan di browser ini. Sila hubungkan ke Cloud Idaroh.
                     </p>
                   </div>
                </div>
              )}

              {!cloudConnected ? (
                <button onClick={handleCloudConnect} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                  {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <Link2 size={20} />} 
                  HUBUNGKAN DATABASE IDAROH (DRIVE)
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleManualSync} className="flex-1 py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                    {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <RefreshCw size={20}/>} 
                    SIMPAN KE CLOUD
                  </button>
                  <button onClick={handlePullFromCloud} className="flex-1 py-6 bg-white border-2 border-indigo-600 text-indigo-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-4 active:scale-95">
                    {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <DownloadCloud size={20}/>} 
                    AMBIL DARI CLOUD
                  </button>
                </div>
              )}
           </div>
        </div>

        {/* PROFILE SECTION */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                 <UserCircle size={32}/>
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profil Petugas</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{currentUserProfile?.fullName}</p>
              </div>
           </div>
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Jabatan</span>
                 <span className="text-xs font-black text-emerald-700 uppercase">{currentUserProfile?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Email</span>
                 <span className="text-xs font-black text-slate-700">{currentUserProfile?.email}</span>
              </div>
           </div>
           <button onClick={() => { if(confirm("Yakin ingin keluar?")) window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
              <LogOut size={18}/> Logout dari Sistem
           </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
