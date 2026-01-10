
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig, SessionType } from '../types';
import { 
  getUsers, updateUser, deleteUser, registerUser, getSyncStatus, syncWithGDrive, pullFromGDrive 
} from '../services/dataService';
import { 
  Settings as SettingsIcon, Calendar, Coffee, User as UserIcon, Users, Edit2, Trash2, 
  Save, PlusCircle, X, Mail, Phone, ShieldCheck, Cloud, RefreshCw, Power, 
  Clock, LogOut, ChevronRight, ToggleLeft as ToggleIcon, UserMinus, ShieldAlert, DownloadCloud, UploadCloud, AlertCircle, Info, Share2
} from 'lucide-react';

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic, availableClasses }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [localAcademic, setLocalAcademic] = useState<AcademicConfig>(academicConfig);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [cloudStatus, setCloudStatus] = useState({ connected: false, pending: false });
  const [isSyncing, setIsSyncing] = useState(false);

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase().trim() === userEmail.toLowerCase().trim());

  useEffect(() => {
    refreshUserList();
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    const sync = getSyncStatus();
    setCloudStatus({ connected, pending: sync.isNewLocal });
  }, []);

  const refreshUserList = () => {
    setUsers(getUsers());
  };

  const handleCloudPush = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) {
      alert("Sesi Cloud habis. Silakan Logout dan Login kembali.");
      return;
    }
    setIsSyncing(true);
    const success = await syncWithGDrive(token);
    if (success) {
      setCloudStatus(prev => ({ ...prev, pending: false }));
      alert("Sinkronisasi Berhasil! Data Anda digabungkan ke Cloud tanpa menghapus data rekan lain.");
    } else {
      alert("Gagal sinkronisasi. Cek koneksi internet.");
    }
    setIsSyncing(false);
  };

  const handleCloudPull = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) {
      alert("Cloud belum terhubung.");
      return;
    }
    setIsSyncing(true);
    const success = await pullFromGDrive(token);
    if (success) {
      alert("Data terbaru dari seluruh tim berhasil ditarik!");
      window.location.reload();
    } else {
      alert("Gagal menarik data.");
    }
    setIsSyncing(false);
  };

  const handleLogout = () => {
    if (confirm("Keluar dari sistem Mahasina?")) {
      sessionStorage.removeItem('mahasina_active_session');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto px-4">
      
      {/* 1. Profil & Cloud Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-50 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><UserIcon size={28}/></div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Akun Petugas</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Sesi Aktif</p>
              </div>
           </div>
           
           <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100 shadow-inner">
              <div className="flex flex-col gap-1.5">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Terdaftar</span>
                 <p className="text-sm font-black text-slate-800 uppercase">{userEmail}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wewenang Sistem</span>
                 <p className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg self-start uppercase tracking-widest">{isSuperAdmin ? 'OTORITAS PENUH (IDAROH)' : currentUserProfile?.role}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100 transition-colors">
              <LogOut size={18}/> Log Out dari Sesi Ini
           </button>
        </div>

        <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-50 relative overflow-hidden">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Cloud size={28}/></div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cloud Multi-User</h3>
           </div>
           
           <div className={`p-8 rounded-[2.5rem] border flex flex-col gap-6 ${cloudStatus.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${cloudStatus.connected ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                      {cloudStatus.connected ? <ShieldCheck size={24}/> : <Cloud size={24}/>}
                   </div>
                   <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{cloudStatus.connected ? 'Cloud Terhubung' : 'Offline'}</p>
                      <p className={`text-[9px] font-bold uppercase mt-2 ${cloudStatus.pending ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                        {cloudStatus.pending ? 'Data Baru Tersedia di HP' : 'Data Tim Sinkron'}
                      </p>
                   </div>
                </div>
                {isSyncing && <RefreshCw size={20} className="animate-spin text-indigo-600" />}
              </div>

              {isSuperAdmin && (
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-800 font-black text-[9px] uppercase tracking-widest">
                    <Share2 size={14}/> Instruksi Berbagi (Admin)
                  </div>
                  <p className="text-[9px] text-indigo-600 leading-relaxed font-medium">
                    Agar Ustadz lain bisa mengakses database yang sama: <br/>
                    1. Buka Google Drive Anda.<br/>
                    2. Cari file <b>mahasina_backup.json</b>.<br/>
                    3. Klik Kanan > Bagikan > Masukkan email Google para Ustadz.<br/>
                    4. Pastikan aksesnya sebagai <b>Editor</b>.
                  </p>
                </div>
              )}
              
              {cloudStatus.connected && (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleCloudPush} disabled={isSyncing} className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm border active:scale-95 transition-all ${cloudStatus.pending ? 'bg-amber-500 text-white border-amber-400' : 'bg-white text-emerald-700 border-emerald-100'}`}>
                    <UploadCloud size={16}/> Push (Gabung Data)
                  </button>
                  <button onClick={handleCloudPull} disabled={isSyncing} className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
                    <DownloadCloud size={16}/> Pull (Ambil Data Tim)
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* 2. Admin Otoritas Section */}
      {isSuperAdmin && (
        <div className="bg-white rounded-[4rem] border shadow-2xl p-12 space-y-10 border-slate-50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl"><Users size={32}/></div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Manajemen User</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Daftar Akun Terverifikasi</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getUsers().map(u => (
              <div key={u.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-sm font-black text-slate-800 uppercase">{u.fullName}</p>
                <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase mt-3 inline-block">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
