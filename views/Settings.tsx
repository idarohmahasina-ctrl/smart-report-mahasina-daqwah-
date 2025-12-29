
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, getAppData, saveAppData, getSyncStatus, saveSyncStatus, clearAppData, syncWithGDrive } from '../services/dataService';
import { 
  Search, UserPlus, Edit2, Trash2, X, Check, ShieldCheck, Mail, Phone, 
  Users as UsersIcon, Calendar, GraduationCap, Download, Upload, 
  Database, Save, BookOpen, Cloud, CloudOff, RefreshCw, Link2, ExternalLink,
  ShieldAlert, Info, DownloadCloud, UploadCloud, ToggleLeft as ToggleIcon, ToggleRight,
  LogOut, User as UserIcon, ShieldX, Power, Coffee, UserCircle, Briefcase, Settings2, Key, AlertTriangle, HelpCircle, ChevronRight
} from 'lucide-react';

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic, availableClasses }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tempAcademic, setTempAcademic] = useState<AcademicConfig>(academicConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncMeta, setSyncMeta] = useState(getSyncStatus());
  
  const isSuperAdmin = userEmail.toLowerCase() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());

  // =========================================================================
  // KONFIGURASI GOOGLE CLIENT ID
  // Ganti teks di bawah ini dengan Client ID asli dari Google Cloud Console
  // =========================================================================
  const GOOGLE_CLIENT_ID = 'MASUKKAN_CLIENT_ID_ANDA_DISINI.apps.googleusercontent.com';

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

  const handleCloudConnect = () => {
    if (GOOGLE_CLIENT_ID.includes('MASUKKAN_CLIENT_ID')) {
      alert("Akses Ditolak: Client ID belum dipasang di kode program.");
      return;
    }

    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.access_token) {
            setIsSyncing(true);
            const success = await syncWithGDrive(response.access_token);
            if (success) {
              setCloudConnected(true);
              localStorage.setItem('mahasina_cloud_connected', 'true');
              localStorage.setItem('mahasina_cloud_token', response.access_token);
              alert("Koneksi Berhasil! Data Anda sekarang aman di Google Drive.");
            } else {
              alert("Gagal Sinkronisasi. Periksa izin aplikasi di Google.");
            }
            setIsSyncing(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error(e);
      alert("Pastikan Anda membuka aplikasi melalui HTTPS (Vercel).");
    }
  };

  const handleManualSync = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) { handleCloudConnect(); return; }
    setIsSyncing(true);
    const success = await syncWithGDrive(token);
    if (success) {
       alert("Data Terupdate di GDrive!");
       setSyncMeta(getSyncStatus());
    } else {
       alert("Sesi berakhir. Hubungkan ulang akun Google.");
       setCloudConnected(false);
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

  const toggleClass = (cls: string) => {
    const current = formData.classes || [];
    if (current.includes(cls)) {
      setFormData({ ...formData, classes: current.filter(c => c !== cls) });
    } else {
      setFormData({ ...formData, classes: [...current, cls] });
    }
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Modal Panduan Client ID */}
      {showGuide && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowGuide(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 overflow-y-auto max-h-[85vh] no-scrollbar border-4 border-emerald-500">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Panduan Aktivasi GDrive</h3>
                <button onClick={() => setShowGuide(false)} className="p-3 bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
             </div>
             <div className="space-y-8">
                {[
                  { step: "1", text: "Buka Google Cloud Console", desc: "Kunjungi console.cloud.google.com dan buat proyek baru." },
                  { step: "2", text: "Aktifkan API", desc: "Cari 'Google Drive API' lalu klik Enable." },
                  { step: "3", text: "OAuth Consent Screen", desc: "Pilih External, isi nama aplikasi & email pengembang." },
                  { step: "4", text: "Buat Client ID", desc: "Pilih Type: 'Web Application'. Masukkan URL Vercel Anda di 'Authorized JavaScript Origins'." },
                  { step: "5", text: "Update Kode", desc: "Copy Client ID yang muncul dan tempel ke file Settings.tsx di bagian GOOGLE_CLIENT_ID." }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6 items-start">
                    <div className="w-12 h-12 shrink-0 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-900/20">{item.step}</div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.text}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-6 border-t border-slate-100 flex flex-col items-center text-center">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 mb-6">Proses ini Gratis Selamanya</p>
                   <button onClick={() => setShowGuide(false)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em]">Saya Mengerti</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modal Edit/Tambah User (Management User) */}
      {isEditing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsEditing(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar border-2 border-emerald-100">
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

               {formData.role === UserRole.MUSYRIF && (
                <div className="animate-in slide-in-from-bottom-4 pt-2">
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 ml-1">Pilih Kelas Binaan</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableClasses.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClass(cls)}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all border-2 ${
                          (formData.classes || []).includes(cls)
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
               )}

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
        {/* 1. KONEKSI DATA */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-14 space-y-10 border-2 border-slate-50 relative overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${cloudConnected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   {cloudConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cloud Sync (Google Drive)</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Semua data terhimpun dalam 1 file backup</p>
                </div>
              </div>
              <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">
                 <HelpCircle size={16}/> Bantuan Setup
              </button>
           </div>
           
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
              {GOOGLE_CLIENT_ID.includes('MASUKKAN_CLIENT_ID') ? (
                <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-start gap-4 animate-in zoom-in-95">
                   <AlertTriangle className="text-red-600 shrink-0 mt-1" size={24} />
                   <div>
                     <p className="text-xs font-black text-red-800 uppercase tracking-tight">Client ID Belum Terpasang</p>
                     <p className="text-[10px] font-bold text-red-600/70 mt-1 leading-relaxed">
                       Sinkronisasi Cloud tidak aktif. Admin harus memasukkan Google Client ID ke dalam sistem terlebih dahulu.
                     </p>
                   </div>
                </div>
              ) : (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-start gap-4">
                   <ShieldCheck className="text-emerald-600 shrink-0 mt-1" size={24} />
                   <div>
                     <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Sistem Siap Sinkron</p>
                     <p className="text-[10px] font-bold text-emerald-700/70 mt-1 leading-relaxed">
                       Konfigurasi Cloud terdeteksi. Silakan hubungkan akun Google Drive untuk aktivasi data.
                     </p>
                   </div>
                </div>
              )}

              <div className="flex justify-between items-center px-2">
                 <p className="text-[11px] text-slate-600 font-bold italic">
                   Status Koneksi: {cloudConnected ? <span className="text-indigo-600 uppercase font-black">ACTIVE</span> : <span className="text-red-500 uppercase font-black">LOCAL ONLY</span>}
                 </p>
                 {cloudConnected && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update: {syncMeta.timestamp ? new Date(syncMeta.timestamp).toLocaleTimeString() : '-'}</span>}
              </div>

              {!cloudConnected ? (
                <button onClick={handleCloudConnect} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4">
                  {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <Link2 size={20} />} 
                  Hubungkan GDrive Sekarang
                </button>
              ) : (
                <button onClick={handleManualSync} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-4">
                  {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <RefreshCw size={20}/>} 
                  Sinkronkan Manual
                </button>
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
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Operasional Sistem</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Pembelajaran Aktif</p>
                </div>
             </div>
             <button onClick={handleToggleHoliday} className={`w-full py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${tempAcademic.isHoliday ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white shadow-amber-900/20'}`}>
                {tempAcademic.isHoliday ? 'AKTIFKAN KBM NORMAL' : 'AKTIFKAN MODE LIBUR PONDOK'}
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
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profil Petugas</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">{currentUserProfile?.fullName}</p>
              </div>
           </div>
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
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
             <button onClick={() => setIsEditing(true)} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3">
               <UserPlus size={18}/> Tambah/Kelola Petugas
             </button>
           )}
           <button onClick={() => { if(confirm("Yakin ingin keluar?")) window.location.reload(); }} className="w-full py-5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
              <LogOut size={18}/> Keluar Aplikasi
           </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
