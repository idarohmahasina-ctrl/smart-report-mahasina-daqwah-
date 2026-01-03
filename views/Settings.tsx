
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AcademicConfig, SessionType } from '../types';
import { 
  getUsers, updateUser, deleteUser, registerUser, getSyncStatus, syncWithGDrive 
} from '../services/dataService';
import { 
  Settings as SettingsIcon, Calendar, Coffee, User as UserIcon, Users, Edit2, Trash2, 
  Save, PlusCircle, X, Mail, Phone, ShieldCheck, Cloud, RefreshCw, Power, 
  Clock, LogOut, ChevronRight, ToggleLeft as ToggleIcon
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
    setUsers(getUsers());
    const connected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    const sync = getSyncStatus();
    setCloudStatus({ connected, pending: sync.isNewLocal });
  }, []);

  const handleSaveAcademic = () => {
    onUpdateAcademic(localAcademic);
    alert("Konfigurasi akademik dan operasional berhasil disimpan!");
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
      alert("Cloud belum terhubung. Silakan login ulang untuk aktivasi cloud.");
      return;
    }
    setIsSyncing(true);
    const success = await syncWithGDrive(token);
    if (success) {
      setCloudStatus(prev => ({ ...prev, pending: false }));
      alert("Data berhasil disinkronkan ke Google Drive.");
    } else {
      alert("Gagal sinkronisasi cloud.");
    }
    setIsSyncing(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (users.find(u => u.id === editingUser.id)) {
      updateUser(editingUser);
    } else {
      registerUser(editingUser);
    }
    
    setUsers(getUsers());
    setShowUserModal(false);
    setEditingUser(null);
    alert("Data petugas berhasil diperbarui.");
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Hapus akses petugas ini? Petugas tidak akan bisa login lagi.")) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  const handleLogout = () => {
    if (confirm("Keluar dari sistem?")) {
      sessionStorage.removeItem('mahasina_active_session');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pengaturan</h2>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2 italic">Otorisasi & Kontrol Sistem Mahasina</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SISI KIRI: Profil & Cloud (Berlaku untuk SEMUA User) */}
        <div className="space-y-8">
          
          {/* Akun Saya */}
          <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-6 border-slate-50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><UserIcon size={24}/></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Profil Akun</h3>
             </div>
             <div className="p-8 bg-slate-50 rounded-[2rem] space-y-6 border border-slate-100 shadow-inner">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</span>
                   <p className="text-base font-black text-slate-800 uppercase tracking-tight">{currentUserProfile?.fullName || 'User Mahasina'}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Jabatan & Hak Akses</span>
                   <p className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg self-start uppercase tracking-widest">{currentUserProfile?.role}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                    <p className="text-[10px] font-bold text-slate-600 truncate">{userEmail}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kontak</span>
                    <p className="text-[10px] font-bold text-slate-600">{currentUserProfile?.phone || '-'}</p>
                  </div>
                </div>
             </div>
             <button 
               onClick={handleLogout}
               className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100 transition-colors"
             >
                <LogOut size={18}/> Keluar Dari Sistem
             </button>
          </div>

          {/* Sinkronisasi Cloud */}
          <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-6 border-slate-50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Cloud size={24}/></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sinkronisasi Cloud</h3>
             </div>
             <div className={`p-6 rounded-2xl border flex items-center justify-between ${cloudStatus.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cloudStatus.connected ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                      {cloudStatus.connected ? <ShieldCheck size={20}/> : <Cloud size={20}/>}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase">{cloudStatus.connected ? 'Terhubung ke Google Drive' : 'Cloud Tidak Aktif'}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{cloudStatus.pending ? 'Terdapat data belum sinkron' : 'Data sudah mutakhir'}</p>
                   </div>
                </div>
                {cloudStatus.connected && (
                  <button 
                    onClick={handleCloudSync}
                    disabled={isSyncing}
                    className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100 hover:shadow-md active:scale-90 transition-all"
                  >
                    {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  </button>
                )}
             </div>
             {!cloudStatus.connected && (
               <p className="text-[8px] font-bold text-amber-600 uppercase text-center">* Fitur Cloud memerlukan izin akses Google Drive pada saat pendaftaran awal.</p>
             )}
          </div>
        </div>

        {/* SISI KANAN: Kontrol Admin (Hanya idarohmahasina@gmail.com) */}
        <div className="space-y-8">
          {isSuperAdmin ? (
            <>
              {/* Pengaturan Operasional (Libur Sesi) */}
              <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-8 border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-800 text-white rounded-xl flex items-center justify-center shadow-lg"><Power size={24}/></div>
                    <div className="flex-1">
                       <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Kontrol Operasional</h3>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Aktif/Nonaktifkan Presensi per Sesi</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   {Object.values(SessionType).map(session => (
                     <div key={session} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${localAcademic.sessionHolidays?.[session] ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                           <Clock size={16} className={localAcademic.sessionHolidays?.[session] ? 'text-red-400' : 'text-slate-400'}/>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${localAcademic.sessionHolidays?.[session] ? 'text-red-700' : 'text-slate-700'}`}>{session}</span>
                        </div>
                        <button 
                          onClick={() => toggleSessionHoliday(session)}
                          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${localAcademic.sessionHolidays?.[session] ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-emerald-700 border border-emerald-100 shadow-sm'}`}
                        >
                           {localAcademic.sessionHolidays?.[session] ? 'LIBUR' : 'AKTIF'}
                        </button>
                     </div>
                   ))}
                </div>
                <button onClick={handleSaveAcademic} className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all">
                   <Save size={18}/> Simpan Kontrol Operasional
                </button>
              </div>

              {/* Pengaturan Periode Akademik */}
              <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 space-y-8 border-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Calendar size={24}/></div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Periode Akademik</h3>
                 </div>
                 <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[7px] font-black text-slate-400 uppercase ml-1">Tahun Ajaran</p>
                             <input type="text" value={localAcademic.schoolYear} onChange={e => setLocalAcademic({...localAcademic, schoolYear: e.target.value})} className="w-full p-3 bg-white rounded-xl text-[10px] font-black outline-none border border-slate-100" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[7px] font-black text-slate-400 uppercase ml-1">Semester</p>
                             <select value={localAcademic.semester} onChange={e => setLocalAcademic({...localAcademic, semester: e.target.value as any})} className="w-full p-3 bg-white rounded-xl text-[10px] font-black outline-none border border-slate-100">
                                <option value="I (Ganjil)">I (Ganjil)</option>
                                <option value="II (Genap)">II (Genap)</option>
                             </select>
                          </div>
                       </div>
                    </div>
                    <button onClick={handleSaveAcademic} className="w-full py-4 bg-emerald-800 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                       <Save size={18}/> Perbarui Periode Belajar
                    </button>
                 </div>
              </div>

              {/* Manajemen User (Petugas) */}
              <div className="bg-white rounded-[3rem] border shadow-sm p-8 space-y-8 border-slate-50">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Users size={24}/></div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Manajemen Petugas</h3>
                    </div>
                    <button 
                      onClick={() => { setEditingUser({ id: Math.random().toString(36).substr(2, 9), fullName: '', email: '', phone: '', role: UserRole.GURU, classes: [] }); setShowUserModal(true); }}
                      className="p-3 bg-emerald-700 text-white rounded-xl shadow-lg hover:bg-emerald-800 transition-all active:scale-90"
                    >
                      <PlusCircle size={20}/>
                    </button>
                 </div>
                 
                 <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                    {users.map(u => (
                      <div key={u.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 hover:bg-white hover:shadow-xl transition-all group">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 font-black text-xs border border-slate-100">{u.fullName[0]}</div>
                               <div>
                                  <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{u.fullName}</p>
                                  <span className="text-[8px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase mt-1.5 inline-block">{u.role}</span>
                               </div>
                            </div>
                            <div className="flex gap-1.5">
                               <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 bg-white text-blue-600 rounded-lg border border-slate-200 shadow-sm"><Edit2 size={12}/></button>
                               <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-white text-red-600 rounded-lg border border-slate-200 shadow-sm"><Trash2 size={12}/></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                               <Mail size={12} className="text-slate-400 shrink-0"/>
                               <span className="text-[9px] font-bold text-slate-500 truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Phone size={12} className="text-slate-400 shrink-0"/>
                               <span className="text-[9px] font-bold text-slate-500">{u.phone || '-'}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </>
          ) : (
            <div className="bg-emerald-950 p-12 rounded-[3rem] text-white flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <ShieldCheck size={48} className="text-emerald-400 animate-pulse"/>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Status User Standar</h3>
                  <p className="text-[10px] font-medium text-emerald-300/80 mt-2 px-6 leading-relaxed">Akses konfigurasi operasional dan manajemen petugas dibatasi hanya untuk Admin Idaroh Mahasina.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* User Editing Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Otorisasi Petugas</h3>
                 <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-red-500 transition-colors p-2"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-5">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                       <input required type="text" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-[11px] shadow-inner" placeholder="Ustadz/ah..." />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Login</label>
                       <input required type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-[11px] shadow-inner" placeholder="email@mahasina.id" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">No. HP</label>
                       <input required type="tel" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-[11px] shadow-inner" placeholder="08..." />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan Sistem</label>
                       <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[10px] uppercase shadow-inner border-none appearance-none">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-emerald-800 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl mt-6 active:scale-95 transition-all">
                    Simpan Otoritas Petugas
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
