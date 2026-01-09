
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig, SessionType } from '../types';
import { 
  getUsers, updateUser, deleteUser, registerUser, getSyncStatus, syncWithGDrive 
} from '../services/dataService';
import { 
  Settings as SettingsIcon, Calendar, Coffee, User as UserIcon, Users, Edit2, Trash2, 
  Save, PlusCircle, X, Mail, Phone, ShieldCheck, Cloud, RefreshCw, Power, 
  Clock, LogOut, ChevronRight, ToggleLeft as ToggleIcon, UserMinus, ShieldAlert
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

  // Cek apakah user adalah Admin Utama
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

  const handleSaveAcademic = () => {
    onUpdateAcademic(localAcademic);
    alert("Konfigurasi akademik pesantren berhasil disimpan!");
  };

  const toggleSessionHoliday = (st: SessionType) => {
    setLocalAcademic(prev => ({
      ...prev,
      sessionHolidays: {
        ...prev.sessionHolidays,
        [st]: !prev.sessionHolidays?.[st]
      }
    }));
  };

  const handleCloudSync = async () => {
    const token = localStorage.getItem('mahasina_cloud_token');
    if (!token) {
      alert("Cloud belum terhubung. Silakan login ulang.");
      return;
    }
    setIsSyncing(true);
    const success = await syncWithGDrive(token);
    if (success) {
      setCloudStatus(prev => ({ ...prev, pending: false }));
      alert("Database master disinkronkan ke Drive.");
    } else {
      alert("Gagal sinkronisasi cloud.");
    }
    setIsSyncing(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const allUsers = getUsers();
    if (allUsers.find(u => u.id === editingUser.id)) {
      updateUser(editingUser);
    } else {
      try {
        registerUser(editingUser);
      } catch (err: any) {
        alert(err.message);
        return;
      }
    }
    
    refreshUserList();
    setShowUserModal(false);
    setEditingUser(null);
    alert("Database user berhasil dimodifikasi.");
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Hapus pendaftaran ${name}? User ini akan diputus aksesnya dan harus Sign Up ulang jika ingin masuk kembali.`)) {
      deleteUser(id);
      refreshUserList();
    }
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
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Identitas Nama</span>
                 <p className="text-base font-black text-slate-800 uppercase">{currentUserProfile?.fullName || 'Admin Idaroh'}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wewenang Sistem</span>
                 <p className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg self-start uppercase tracking-widest">{isSuperAdmin ? 'OTORITAS PENUH (IDAROH)' : currentUserProfile?.role}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Terkait</span>
                  <p className="text-[10px] font-bold text-slate-600 truncate">{userEmail}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</span>
                  <p className="text-[10px] font-bold text-slate-600">{currentUserProfile?.phone || '-'}</p>
                </div>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100 transition-colors">
              <LogOut size={18}/> Log Out dari Sesi Ini
           </button>
        </div>

        <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-50 flex flex-col justify-center">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Cloud size={28}/></div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Status Cloud Storage</h3>
           </div>
           <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between ${cloudStatus.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-5">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${cloudStatus.connected ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {cloudStatus.connected ? <ShieldCheck size={24}/> : <Cloud size={24}/>}
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{cloudStatus.connected ? 'Google Drive Terkoneksi' : 'Cloud Tidak Aktif'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{cloudStatus.pending ? 'Sinkronisasi Tertunda' : 'Semua Data Ter-backup'}</p>
                 </div>
              </div>
              {cloudStatus.connected && (
                <button onClick={handleCloudSync} disabled={isSyncing} className="p-4 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                  {isSyncing ? <RefreshCw size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                </button>
              )}
           </div>
        </div>
      </div>

      {/* 2. Admin Otoritas Section */}
      {isSuperAdmin ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-6">
           {/* Master User Management */}
           <div className="bg-white rounded-[4rem] border shadow-2xl p-12 space-y-10 border-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl"><Users size={32}/></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Database Semua Pendaftar</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <ShieldAlert size={14} className="text-red-500"/> Manajemen Akses Global Mahasina • {users.length} Akun
                       </p>
                    </div>
                 </div>
                 <button onClick={() => { setEditingUser({ id: Math.random().toString(36).substr(2, 9), fullName: '', email: '', phone: '', role: UserRole.GURU, classes: [] }); setShowUserModal(true); }} className="px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-900 active:scale-95 transition-all">
                    <PlusCircle size={20}/> Daftarkan Akun Petugas
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto no-scrollbar p-1">
                 {users.map(u => (
                   <div key={u.id} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col gap-6 hover:bg-white hover:shadow-2xl transition-all group">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-800 font-black text-xs border border-slate-100 shadow-inner group-hover:bg-emerald-950 group-hover:text-white transition-all">{u.fullName ? u.fullName[0] : '?'}</div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase leading-none">{u.fullName || 'User Tanpa Nama'}</p>
                               <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase mt-2 inline-block border border-indigo-100">{u.role}</span>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-3 bg-white text-blue-600 rounded-xl border border-slate-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={14}/></button>
                            <button onClick={() => handleDeleteUser(u.id, u.fullName)} className="p-3 bg-white text-red-600 rounded-xl border border-slate-100 shadow-sm hover:bg-red-600 hover:text-white transition-all"><UserMinus size={14}/></button>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
                         <div className="flex items-center gap-3">
                            <Mail size={14} className="text-slate-400"/>
                            <span className="text-[10px] font-bold text-slate-500 truncate">{u.email}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <Phone size={14} className="text-slate-400"/>
                            <span className="text-[10px] font-bold text-slate-500">{u.phone || '-'}</span>
                         </div>
                         {u.role === UserRole.MUSYRIF && (
                            <div className="flex items-center gap-3">
                               <Calendar size={14} className="text-slate-400"/>
                               <span className="text-[10px] font-black text-emerald-700">WALI KELAS: {u.classes?.join(', ') || '-'}</span>
                            </div>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Academic & Operations */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white rounded-[3.5rem] border shadow-xl p-10 space-y-8 border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl"><Calendar size={28}/></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Status Periode Akademik</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <div className="space-y-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun Ajaran</p>
                       <input type="text" value={localAcademic.schoolYear} onChange={e => setLocalAcademic({...localAcademic, schoolYear: e.target.value})} className="w-full p-4 bg-white rounded-2xl text-xs font-black outline-none border border-slate-100 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</p>
                       <select value={localAcademic.semester} onChange={e => setLocalAcademic({...localAcademic, semester: e.target.value as any})} className="w-full p-4 bg-white rounded-2xl text-xs font-black outline-none border border-slate-100 shadow-inner">
                          <option value="I (Ganjil)">I (Ganjil)</option>
                          <option value="II (Genap)">II (Genap)</option>
                       </select>
                    </div>
                 </div>
                 <button onClick={handleSaveAcademic} className="w-full py-5 bg-emerald-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-800">
                    <Save size={20}/> Update Periode Global
                 </button>
              </div>

              <div className="bg-white rounded-[3.5rem] border shadow-xl p-10 space-y-8 border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-xl"><Power size={28}/></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Libur Sesi Pesantren</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                   {Object.values(SessionType).map(session => (
                     <div key={session} className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all ${localAcademic.sessionHolidays?.[session] ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                           <Clock size={18} className={localAcademic.sessionHolidays?.[session] ? 'text-red-500' : 'text-slate-400'}/>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${localAcademic.sessionHolidays?.[session] ? 'text-red-800' : 'text-slate-700'}`}>{session}</span>
                        </div>
                        <button onClick={() => toggleSessionHoliday(session)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${localAcademic.sessionHolidays?.[session] ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-emerald-800 border border-emerald-100 shadow-sm'}`}>
                           {localAcademic.sessionHolidays?.[session] ? 'DILIBURKAN' : 'AKTIF'}
                        </button>
                     </div>
                   ))}
                </div>
                <button onClick={handleSaveAcademic} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-4">
                   <Save size={20}/> Simpan Status Libur
                </button>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-emerald-950 p-16 rounded-[4rem] text-white flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
           <ShieldCheck size={80} className="text-emerald-400 animate-pulse"/>
           <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tight">Area Terproteksi Admin</h3>
              <p className="text-[12px] font-medium text-emerald-200/70 max-w-sm mx-auto leading-relaxed">Menu Manajemen User dan Operasional hanya tersedia untuk Admin Idaroh Mahasina demi keamanan data pesantren.</p>
           </div>
        </div>
      )}

      {/* User Editing Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modifikasi Akun Petugas</h3>
                 <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-red-500 transition-colors p-3"><X size={28}/></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-6">
                 <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                       <input required type="text" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="Contoh: Ustadz Ahmad" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Otoritas</label>
                       <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="email@mahasina.id" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Peran di Sistem</label>
                       <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-none appearance-none cursor-pointer">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    {editingUser.role === UserRole.MUSYRIF && (
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Binaan (Wali Kelas)</label>
                         <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl">
                           {availableClasses.map(cls => (
                             <button type="button" key={cls} onClick={() => {
                               const current = editingUser.classes || [];
                               const updated = current.includes(cls) ? current.filter(c => c !== cls) : [...current, cls];
                               setEditingUser({...editingUser, classes: updated});
                             }} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${editingUser.classes?.includes(cls) ? 'bg-emerald-800 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
                               {cls}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                 </div>
                 <button type="submit" className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl mt-8 active:scale-95 transition-all">
                    Terapkan Perubahan Data
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
