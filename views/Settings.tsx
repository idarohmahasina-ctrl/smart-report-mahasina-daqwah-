
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig } from '../types';
// Removed syncWithGDrive because it is not exported from dataService
import { 
  getUsers, getSyncStatus, pullFromGDrive, getTeamDatabaseId 
} from '../services/dataService';
import { 
  User as UserIcon, Users, Cloud, RefreshCw, LogOut, DownloadCloud, UploadCloud, ShieldCheck, Share2, Link2, Copy, Key, ShieldAlert
} from 'lucide-react';

declare const google: any;

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic, availableClasses }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cloudStatus, setCloudStatus] = useState({ connected: false, pending: false, hasToken: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [copyStatus, setCopyStatus] = useState('Salin Link');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase().trim() === userEmail.toLowerCase().trim());

  useEffect(() => {
    setUsers(getUsers());
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    const hasToken = !!localStorage.getItem('mahasina_cloud_token');
    const sync = getSyncStatus();
    setCloudStatus({ connected, pending: sync.isNewLocal, hasToken });
  }, []);

  const handleRequestToken = () => {
    if (typeof google === 'undefined') {
      alert("Google Library belum siap. Periksa koneksi internet.");
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (res: any) => {
        if (res.access_token) {
          localStorage.setItem('mahasina_cloud_token', res.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          setCloudStatus(prev => ({ ...prev, hasToken: true, connected: true }));
          alert("Izin Drive berhasil diperbarui!");
          window.location.reload();
        }
      }
    });
    client.requestAccessToken();
  };

  const handleCopyLink = () => {
    const dbId = getTeamDatabaseId();
    if (!dbId) {
      alert("Database tim belum terbentuk. Silakan lakukan sinkronisasi pertama kali.");
      return;
    }
    const joinUrl = `${window.location.origin}/?join=${dbId}`;
    navigator.clipboard.writeText(joinUrl);
    setCopyStatus('Berhasil Disalin!');
    setTimeout(() => setCopyStatus('Salin Link'), 2000);
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto px-4 pt-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Akun Section */}
        <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><UserIcon size={28}/></div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Akun Petugas</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{userEmail}</p>
              </div>
           </div>
           
           <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4 border border-slate-100">
              <p className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg self-start uppercase tracking-widest inline-block">{isSuperAdmin ? 'ADMIN UTAMA' : currentUserProfile?.role}</p>
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Anda terhubung ke sistem digital Mahasina untuk pelaporan santri secara real-time.</p>
           </div>

           <div className="space-y-3">
              <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${cloudStatus.hasToken ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cloudStatus.hasToken ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                       <Key size={18}/>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Izin Google Drive</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{cloudStatus.hasToken ? 'Sudah Diberikan' : 'Belum Ada Izin'}</p>
                    </div>
                 </div>
                 <button onClick={handleRequestToken} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition-all">Perbarui Izin</button>
              </div>
              
              {!cloudStatus.hasToken && (
                <div className="flex items-start gap-3 px-6 text-red-600 animate-pulse">
                   <ShieldAlert size={14} className="mt-1 shrink-0"/>
                   <p className="text-[8px] font-black uppercase leading-tight">Tanpa izin Drive, data tidak bisa sinkron ke ustadz lain.</p>
                </div>
              )}
           </div>

           <button onClick={() => {sessionStorage.removeItem('mahasina_active_session'); window.location.reload();}} className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100">
              <LogOut size={18}/> Log Out Sesi
           </button>
        </div>

        {/* Kolaborasi Section */}
        <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Cloud size={28}/></div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kolaborasi Tim</h3>
           </div>
           
           <div className={`p-8 rounded-[2.5rem] border space-y-6 ${cloudStatus.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${cloudStatus.connected ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                      {cloudStatus.connected ? <ShieldCheck size={24}/> : <Cloud size={24}/>}
                   </div>
                   <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{cloudStatus.connected ? 'Mode Tim Aktif' : 'Offline'}</p>
                      <p className={`text-[9px] font-bold uppercase mt-2 ${cloudStatus.pending ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                        {cloudStatus.pending ? 'Data Baru Butuh Push' : 'Data Tim Ter-Update'}
                      </p>
                   </div>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-800 font-black text-[9px] uppercase tracking-widest">
                    <Share2 size={14}/> Bagikan Akses Ke Guru
                  </div>
                  <p className="text-[8px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter">
                    Salin link di bawah dan kirim ke grup WA Ustadz/ah agar mereka otomatis terhubung ke database Mahasina ini.
                  </p>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 bg-slate-50 p-3 rounded-lg border text-[8px] font-mono text-slate-400 truncate uppercase">
                        {getTeamDatabaseId() ? `${window.location.origin}/?join=${getTeamDatabaseId()}` : 'Hubungkan Dulu'}
                     </div>
                     <button onClick={handleCopyLink} className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <Copy size={14}/> <span className="text-[9px] font-black uppercase">{copyStatus}</span>
                     </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
