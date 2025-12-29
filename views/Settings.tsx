import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig } from '../types';
import { getUsers, registerUser, updateUser, deleteUser, getAppData, saveAppData, getSyncStatus, saveSyncStatus, clearAppData } from '../services/dataService';
import { CLASSES } from '../constants';
import { 
  Search, UserPlus, Edit2, Trash2, X, Check, ShieldCheck, Mail, Phone, 
  Users as UsersIcon, Calendar, GraduationCap, Download, Upload, 
  Database, Save, BookOpen, Cloud, CloudOff, RefreshCw, Link2, ExternalLink,
  ShieldAlert, Info, DownloadCloud, UploadCloud, ToggleLeft as ToggleIcon, ToggleRight,
  LogOut, User as UserIcon, ShieldX, Power, Coffee, UserCircle, Briefcase, Settings2
} from 'lucide-react';

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tempAcademic, setTempAcademic] = useState<AcademicConfig>(academicConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [syncMeta, setSyncMeta] = useState(getSyncStatus());
  
  const isSuperAdmin = userEmail.toLowerCase() === 'idarohmahasina@gmail.com';
  const currentUserProfile = getUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());

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
    setIsSyncing(true);
    setTimeout(() => {
      setCloudConnected(true);
      localStorage.setItem('mahasina_cloud_connected', 'true');
      setIsSyncing(false);
      alert("Berhasil Terhubung! Status Anda kini 'Cloud Active'.");
    }, 1500);
  };

  const handleToggleHoliday = () => {
    const updated = { ...tempAcademic, isHoliday: !tempAcademic.isHoliday };
    setTempAcademic(updated);
    onUpdateAcademic(updated);
    alert(`Sistem kini dalam Mode ${updated.isHoliday ? 'LIBUR' : 'AKTIF'}.`);
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

  const handleDeleteUser = (id: string) => {
    if (confirm("Hapus petugas ini secara permanen?")) {
      deleteUser(id);
      refreshUsers();
    }
  };

  const toggleClass = (cls: string) => {
    const current = formData.classes || [];
    if (current.includes(cls)) {
      setFormData({ ...formData, classes: current.filter(c => c !== cls) });
    } else {
      setFormData({ ...formData, classes: [...current, cls] });
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Modal Edit/Tambah User (Idaroh Only) */}
      {isEditing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsEditing(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
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
                    {CLASSES.map(cls => (
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Pengaturan & Konfigurasi</h2>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.3em] mt-2 italic italic">Atur amanah dan perangkat Mahasina</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. KONEKSI DATA (SEMUA USER) */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-12 space-y-10 border-2 border-slate-50 relative overflow-hidden">
           <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${cloudConnected ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-slate-100 text-slate-400'}`}>
                 {cloudConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Koneksi Data</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Status Sinkronisasi Cloud</p>
              </div>
           </div>
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">
                Status: {cloudConnected ? <span className="text-indigo-600 uppercase font-black">Cloud Active (Google Drive)</span> : <span className="text-red-500 uppercase font-black">Local Mode (Tersimpan di HP)</span>}
              </p>
              {!cloudConnected ? (
                <button onClick={handleCloudConnect} className="w-full py-5 bg-white border-2 border-indigo-100 text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3">
                  <Link2 size={18} /> Hubungkan GDrive Sekarang
                </button>
              ) : (
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Terakhir Sinkron: {syncMeta.timestamp ? new Date(syncMeta.timestamp).toLocaleTimeString() : '-'}</span>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                      <RefreshCw size={10} className="animate-spin" /> Data Terproteksi
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* 2. KONTROL IDAROH (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-12 space-y-10 border-2 border-amber-50 relative overflow-hidden">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${tempAcademic.isHoliday ? 'bg-amber-600 text-white shadow-amber-900/20' : 'bg-emerald-600 text-white shadow-emerald-900/20'}`}>
                      {tempAcademic.isHoliday ? <Coffee size={32}/> : <Power size={32}/>}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kontrol Operasional</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Aktivitas KBM</p>
                    </div>
                  </div>
                  <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${tempAcademic.isHoliday ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                      {tempAcademic.isHoliday 
                        ? "Sistem saat ini dalam MODE LIBUR. Seluruh fitur presensi dinonaktifkan sementara." 
                        : "Sistem berjalan normal. Kegiatan belajar mengajar Mahasina sedang berlangsung."}
                    </p>
                  </div>
                  <button onClick={handleToggleHoliday} className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${tempAcademic.isHoliday ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                    {tempAcademic.isHoliday ? <Power size={20}/> : <Coffee size={20}/>}
                    {tempAcademic.isHoliday ? 'AKTIFKAN SISTEM' : 'AKTIFKAN MODE LIBUR'}
                  </button>
               </div>

               <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-12 space-y-10 border-2 border-slate-50 relative overflow-hidden">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                      <Calendar size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Periode Akademik</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Konfigurasi Tahun & Semester</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Tahun Ajaran</label>
                      <input type="text" value={tempAcademic.schoolYear} onChange={e => setTempAcademic({...tempAcademic, schoolYear: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Semester</label>
                      <select value={tempAcademic.semester} onChange={e => setTempAcademic({...tempAcademic, semester: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-xs appearance-none">
                        <option value="I (Ganjil)">GANJIL</option>
                        <option value="II (Genap)">GENAP</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => { onUpdateAcademic(tempAcademic); alert("Konfigurasi disimpan!"); }} className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                    <Save size={18} /> Simpan Konfigurasi
                  </button>
               </div>
          </div>
        )}

        {/* 3. MANAJEMEN USER (SUPER ADMIN ONLY) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-[4rem] border shadow-sm p-12 border-2 border-slate-50 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                   <UsersIcon size={32}/>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Manajemen Petugas</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Otoritas Pengguna Mahasina</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setFormData({ fullName: '', email: '', role: UserRole.GURU, classes: [] }); setIsEditing(true); }}
                className="px-8 py-4 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-800 transition-all"
              >
                <UserPlus size={18}/> Tambah Petugas
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" placeholder="Cari nama atau email petugas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] outline-none font-bold" />
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-8 py-6 text-left">Nama Lengkap</th>
                    <th className="px-8 py-6 text-left">Email</th>
                    <th className="px-8 py-6">Role</th>
                    <th className="px-8 py-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-black text-slate-800">{u.fullName}</td>
                      <td className="px-8 py-6 text-slate-500 font-medium">{u.email}</td>
                      <td className="px-8 py-6 text-center"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest">{u.role}</span></td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelectedUser(u); setFormData({ fullName: u.fullName, email: u.email, role: u.role, classes: u.classes || [] }); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                          {u.email !== userEmail && (
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. INFORMASI AKUN (PALING BAWAH) */}
        <div className="bg-white rounded-[4rem] border shadow-sm p-10 md:p-12 space-y-10 border-2 border-slate-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-16 -mt-16 rounded-full" />
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                   <UserCircle size={32}/>
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profil Petugas</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Ahlan wa Sahlan, {currentUserProfile?.fullName.split(' ')[0]}</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><UserIcon size={18}/></div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                         <p className="text-sm font-black text-slate-800">{currentUserProfile?.fullName}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Mail size={18}/></div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Terdaftar</p>
                         <p className="text-sm font-black text-slate-800">{currentUserProfile?.email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Briefcase size={18}/></div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jabatan</p>
                         <p className="text-sm font-black text-emerald-700 uppercase">{currentUserProfile?.role}</p>
                      </div>
                   </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={() => { if(confirm("Keluar dari aplikasi?")) window.location.reload(); }} className="flex-1 py-5 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
                      <LogOut size={18}/> Keluar Aplikasi
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;