
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, getAppData, saveAppData, getSyncStatus, saveSyncStatus, clearAppData, syncWithGDrive, downloadFromGDrive } from '../services/dataService';
import { 
  Search, UserPlus, PlusCircle, Edit2, Trash2, X, Check, ShieldCheck, Mail, Phone, 
  Users as UsersIcon, Calendar, GraduationCap, Download, Upload, 
  Database, Save, BookOpen, Cloud, CloudOff, RefreshCw, Link2, ExternalLink,
  ShieldAlert, Info, DownloadCloud, UploadCloud, ToggleLeft as ToggleIcon, ToggleRight,
  LogOut, User as UserIcon, ShieldX, Power, Coffee, UserCircle, Briefcase, Settings2, Key, AlertTriangle, HelpCircle, ChevronRight, Globe, Lock, Layout, Copy, ListChecks, Sparkles, Terminal, AlertCircle
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tempAcademic, setTempAcademic] = useState<AcademicConfig>(academicConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncMeta, setSyncMeta] = useState(getSyncStatus());
  const [showAuthGuide, setShowAuthGuide] = useState(false);
  
  const isSuperAdmin = userEmail.toLowerCase() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());
  
  // Deteksi origin murni tanpa trailing slash untuk Google Console
  const currentOrigin = window.location.origin.replace(/\/$/, "");

  // Client ID Ustadz
  const GOOGLE_CLIENT_ID = '382977690476-qqlbo0r0q27hprcjettr8l34t513pii4.apps.googleusercontent.com';

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '',
    email: '',
    phone: '',
    role: UserRole.GURU,
    classes: []
  });

  useEffect(() => { 
    refreshUsers(); 
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    setCloudConnected(connected);
  }, []);

  const refreshUsers = () => { setUsers(getUsers()); };

  const handleCopyUrl = (text: string) => {
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
          setShowAuthGuide(true);
        },
        callback: async (response: any) => {
          if (response.error) {
            console.error("Response Error:", response.error);
            setShowAuthGuide(true);
            return;
          }
          if (response.access_token) {
            setIsSyncing(true);
            const success = await syncWithGDrive(response.access_token);
            if (success) {
              setCloudConnected(true);
              localStorage.setItem('mahasina_cloud_connected', 'true');
              localStorage.setItem('mahasina_cloud_token', response.access_token);
              alert("Koneksi Berhasil! Database kini tersinkron ke Google Drive.");
            }
            setIsSyncing(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setShowAuthGuide(true);
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
       setShowAuthGuide(true);
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
      setShowAuthGuide(true);
    }
    setIsSyncing(false);
  };

  const handleToggleHoliday = () => {
    const updated = { ...tempAcademic, isHoliday: !tempAcademic.isHoliday };
    setTempAcademic(updated);
    onUpdateAcademic(updated);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUser({ ...selectedUser, ...formData } as UserProfile);
    } else {
      try {
        const newUser: UserProfile = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: formData.fullName || '',
          email: formData.email || '',
          phone: formData.phone || '',
          role: formData.role || UserRole.GURU,
          classes: formData.classes || []
        };
        registerUser(newUser);
      } catch (err: any) { alert(err.message); return; }
    }
    setIsEditing(false);
    refreshUsers();
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Modal Management User */}
      {isEditing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsEditing(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto border-2 border-emerald-100">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8">{selectedUser ? 'Edit Petugas' : 'Tambah Petugas Baru'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                 <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" required />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                 <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" required />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peran / Role</label>
                 <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold">
                   {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
               </div>
               <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest">Batal</button>
                 <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Simpan Petugas</button>
               </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Pengaturan & Akun</h2>
        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.3em] mt-2 italic">Otoritas dan Keamanan Data Mahasina</p>
      </div>

      <div className="space-y-12">
        {/* 1. KONEKSI DATA & TROUBLESHOOTING */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50 relative overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${cloudConnected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   {cloudConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cloud Sync (Google Drive)</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Data tersimpan aman di Google Drive Idaroh</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowAuthGuide(!showAuthGuide)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">
                   <HelpCircle size={16}/> Diagnosa "Akses Diblokir"
                </button>
              </div>
           </div>

           {showAuthGuide && (
             <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] space-y-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                   <ShieldAlert className="text-red-600" size={24} />
                   <h4 className="text-sm font-black text-red-800 uppercase tracking-tight">Solusi Akses Diblokir (Status Production)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">1. Cek Menu "Credentials"</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Buka menu <b>Credentials</b> (di bawah OAuth Consent Screen). Klik nama <b>OAuth 2.0 Client ID</b> Ustadz. Cari bagian <b>Authorized JavaScript Origins</b>.
                      </p>
                      <div className="bg-white p-4 rounded-2xl border border-red-200 space-y-2">
                         <p className="text-[9px] font-bold text-red-600 uppercase">Inputkan URL ini (Wajib Pas):</p>
                         <div className="flex items-center gap-2">
                            <code className="text-[10px] font-black text-slate-800 flex-1 truncate">{currentOrigin}</code>
                            <button onClick={() => handleCopyUrl(currentOrigin)} className="p-2 bg-red-50 text-red-600 rounded-xl"><Copy size={14}/></button>
                         </div>
                         <p className="text-[9px] text-slate-400 italic">Pastikan TIDAK ADA tanda "/" di akhir URL.</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">2. Cek Menu "Branding"</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Klik <b>Edit App</b> di OAuth Consent Screen. Di tab <b>Branding</b>, pastikan kolom ini diisi (gunakan URL web Ustadz):
                      </p>
                      <ul className="text-[10px] font-black space-y-2 text-slate-600">
                         <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> App Domain: {currentOrigin.replace('https://','')}</li>
                         <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Privacy Policy Link: {currentOrigin}</li>
                         <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Terms of Service Link: {currentOrigin}</li>
                      </ul>
                   </div>
                </div>

                <div className="bg-white/50 p-6 rounded-3xl border border-red-100 space-y-4">
                   <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-red-600" />
                      <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">Penting: Cara Melewati Peringatan</p>
                   </div>
                   <p className="text-[11px] text-slate-700 leading-relaxed">
                     Saat login, jika muncul tulisan "Google hasn't verified this app", Ustadz <b>HARUS</b> klik <b>Advanced</b> (Lanjutan) lalu klik <b>Go to Smart Report Mahasina (unsafe)</b>. Tanpa itu, Google akan memblokir akses otomatis karena statusnya belum diverifikasi resmi.
                   </p>
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
                       Database tersinkron secara aman ke Google Drive.
                     </p>
                   </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-100 border-2 border-slate-200 rounded-3xl flex items-start gap-4">
                   <Database className="text-slate-400 shrink-0 mt-1" size={24} />
                   <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Penyimpanan Lokal</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed uppercase tracking-widest">
                       Data hanya tersimpan di browser ini. Klik aktivasi untuk hubungkan ke Idaroh.
                     </p>
                   </div>
                </div>
              )}

              <div className="flex justify-between items-center px-2">
                 <p className="text-[11px] text-slate-600 font-bold italic">
                   Status: {cloudConnected ? <span className="text-indigo-600 uppercase font-black">TERHUBUNG</span> : <span className="text-red-500 uppercase font-black">TERPUTUS</span>}
                 </p>
                 {cloudConnected && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update: {syncMeta.timestamp ? new Date(syncMeta.timestamp).toLocaleTimeString() : '-'}</span>}
              </div>

              {!cloudConnected ? (
                <button onClick={handleCloudConnect} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4">
                  {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <Link2 size={20} />} 
                  AKTIFKAN AUTO-SYNC (GOOGLE DRIVE)
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleManualSync} className="flex-1 py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4">
                    {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <RefreshCw size={20}/>} 
                    SIMPAN KE CLOUD
                  </button>
                  <button onClick={handlePullFromCloud} className="flex-1 py-6 bg-white border-2 border-indigo-600 text-indigo-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-4">
                    {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <DownloadCloud size={20}/>} 
                    AMBIL DARI CLOUD
                  </button>
                </div>
              )}
           </div>
        </div>

        {/* 2. OPERASIONAL KONTROL */}
        {isSuperAdmin && (
          <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50">
             <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl text-white ${tempAcademic.isHoliday ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                   {tempAcademic.isHoliday ? <Coffee size={32}/> : <Power size={32}/>}
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kontrol Operasional</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Keaktifan Presensi Pondok</p>
                </div>
             </div>
             <button onClick={handleToggleHoliday} className={`w-full py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${tempAcademic.isHoliday ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white shadow-amber-900/20'}`}>
                {tempAcademic.isHoliday ? 'AKTIFKAN SISTEM (MASUK KBM)' : 'NONAKTIFKAN SISTEM (MODE LIBUR)'}
             </button>
          </div>
        )}

        {/* 3. PROFIL USER */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                 <UserCircle size={32}/>
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Akun Petugas</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{currentUserProfile?.fullName}</p>
              </div>
           </div>
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">ID Petugas</span>
                 <span className="text-xs font-black text-slate-700">{currentUserProfile?.id}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Email Terdaftar</span>
                 <span className="text-xs font-black text-slate-700">{currentUserProfile?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Jabatan</span>
                 <span className="text-xs font-black text-emerald-700 uppercase">{currentUserProfile?.role}</span>
              </div>
           </div>
           {isSuperAdmin && (
             <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3 text-center">
               <UserPlus size={18}/> Manajemen Akses Petugas
             </button>
           )}
           <button onClick={() => { if(confirm("Yakin ingin keluar dari sistem?")) window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
              <LogOut size={18}/> Logout & Refresh
           </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
