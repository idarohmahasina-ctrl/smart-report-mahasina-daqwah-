
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, UserProfile, AcademicConfig, AppData } from '../types.ts';
import { 
  getAllUsers, registerUser, deleteUser, resetFirestoreData, clearAppData 
} from '../services/dataService.ts';
import { 
  User as UserIcon, Users, Cloud, RefreshCw, LogOut, Trash2, 
  ShieldCheck, ShieldAlert, Edit, Ban, Check, X, Calendar, 
  BookOpen, Trash, Save, UserPlus, Info, DatabaseZap
} from 'lucide-react';

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
  students: any[];
}

const Settings: React.FC<SettingsProps & { students: any[] }> = ({ userEmail, academicConfig, onUpdateAcademic, students }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'academic' | 'kbm' | 'sync' | 'reset'>('users');
  const [allSystemUsers, setAllSystemUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsers();
      setAllSystemUsers(users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUser = async (u: UserProfile) => {
    await registerUser(u);
    setEditingUser(null);
    loadUsers();
    alert("Data user berhasil diperbarui.");
  };

  const handleDeleteUser = async (email: string) => {
    if (confirm(`Hapus akses untuk ${email}? User harus mendaftar ulang.`)) {
      await deleteUser(email);
      loadUsers();
    }
  };

  const handleToggleBlock = async (u: UserProfile) => {
    const updated = { ...u, isBlocked: !u.isBlocked };
    await registerUser(updated);
    loadUsers();
    alert(updated.isBlocked ? "User berhasil diblokir." : "Blokir user dibuka.");
  };

  const allAvailableClasses = useMemo(() => {
    const cls = new Set<string>();
    students.forEach(s => {
      if (s.formalClass) cls.add(s.formalClass);
      if (s.sessionClasses) {
        Object.values(s.sessionClasses).forEach((c: any) => { if(c) cls.add(c); });
      }
    });
    return Array.from(cls).sort();
  }, [students]);

  const toggleClassHoliday = (className: string) => {
    const current = { ...academicConfig.excludedClasses };
    if (current[className]) delete current[className];
    else current[className] = true;
    onUpdateAcademic({ ...academicConfig, excludedClasses: current });
  };

  const handleFactoryReset = async () => {
    if (confirm("🚨 TINDAKAN BERBAHAYA: Anda akan mengosongkan seluruh database (Laporan & Master Data). Lanjutkan?")) {
      const code = prompt("Ketik 'KOSONGKAN' untuk konfirmasi:");
      if (code === 'KOSONGKAN') {
        await resetFirestoreData();
        alert("Database telah dikosongkan.");
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-10 pb-32 max-w-6xl mx-auto px-4 pt-6">
      
      {/* 1. SEKSI UMUM (Selalu Muncul untuk Semua User) */}
      <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
                  <UserIcon size={32}/>
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Akun Profil</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{userEmail}</p>
               </div>
            </div>
            <button 
              onClick={() => { clearAppData(); window.location.reload(); }} 
              className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm"
            >
               <LogOut size={18}/> Keluar (Log Out)
            </button>
         </div>
      </div>

      {/* 2. SEKSI KHUSUS ADMIN (Hanya idarohmahasina@gmail.com) */}
      {isSuperAdmin && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
           <div className="flex items-center gap-4 text-emerald-900 px-2">
              <ShieldCheck size={28}/>
              <h2 className="text-2xl font-black uppercase tracking-tight">Menu Pengaturan Admin</h2>
           </div>

           <div className="bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
              {/* Sidebar Navigasi Admin */}
              <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                 {[
                   { id: 'sync', label: 'Sinkronisasi Cloud', icon: <Cloud size={18}/> },
                   { id: 'users', label: 'Manajemen User', icon: <Users size={18}/> },
                   { id: 'academic', label: 'Periode Belajar', icon: <Calendar size={18}/> },
                   { id: 'kbm', label: 'Manajemen KBM', icon: <BookOpen size={18}/> },
                   { id: 'reset', label: 'Kosongkan Database', icon: <Trash size={18}/> }
                 ].map(tab => (
                   <button 
                     key={tab.id} 
                     onClick={() => setActiveAdminTab(tab.id as any)} 
                     className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAdminTab === tab.id ? 'bg-emerald-950 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-emerald-700'}`}
                   >
                     {tab.icon} {tab.label}
                   </button>
                 ))}
                 <button 
                    onClick={() => { clearAppData(); window.location.reload(); }}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all mt-10"
                 >
                    <LogOut size={18}/> Log Out Admin
                 </button>
              </div>

              {/* Konten Tab Admin */}
              <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-white">
                 
                 {/* TAB 1: SINKRONISASI CLOUD */}
                 {activeAdminTab === 'sync' && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Sinkronisasi Cloud Firebase</h4>
                      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                            <Cloud size={32} />
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-slate-800 uppercase">Status Koneksi Real-time</p>
                            <p className="text-[9px] font-bold text-emerald-600 uppercase mt-2 flex items-center justify-center gap-2">
                               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> Terkoneksi (Migrasi Firebase Selesai)
                            </p>
                         </div>
                         <button onClick={() => window.location.reload()} className="px-10 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
                            <RefreshCw size={16}/> Jalankan Sinkronisasi Paksa
                         </button>
                      </div>
                      <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4 text-blue-800">
                         <Info size={20}/>
                         <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed">Seluruh data laporan dan master data kini tersimpan secara otomatis di Firebase. Tombol ini berguna jika data antar perangkat belum sinkron.</p>
                      </div>
                   </div>
                 )}

                 {/* TAB 2: MANAJEMEN USER */}
                 {activeAdminTab === 'users' && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Manajemen User (Sign-Up)</h4>
                         <button onClick={loadUsers} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all">
                            <RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''}/>
                         </button>
                      </div>

                      <div className="space-y-4">
                         {allSystemUsers.map(user => (
                           <div key={user.email} className={`p-6 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4 ${user.isBlocked ? 'bg-red-50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="flex items-center gap-5 flex-1">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                                    {user.fullName[0]}
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-black uppercase text-slate-800">{user.fullName} {user.isBlocked && <span className="text-red-600 font-black ml-2 text-[8px]">[TERBLOKIR]</span>}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{user.role} • {user.email}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={() => setEditingUser(user)} className="p-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all border shadow-sm" title="Edit Profil"><Edit size={16}/></button>
                                 <button onClick={() => handleToggleBlock(user)} className={`p-3 rounded-xl border shadow-sm transition-all ${user.isBlocked ? 'bg-emerald-600 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`} title={user.isBlocked ? "Buka Blokir" : "Blokir Akses"}>
                                    {user.isBlocked ? <Check size={16}/> : <Ban size={16}/>}
                                 </button>
                                 <button onClick={() => handleDeleteUser(user.email)} className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all border shadow-sm" title="Hapus User"><Trash2 size={16}/></button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* TAB 3: PERIODE AKADEMIK */}
                 {activeAdminTab === 'academic' && (
                   <div className="space-y-10 animate-in fade-in duration-500">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Tahun Ajaran & Semester</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tahun Ajaran</label>
                            <input 
                              type="text" 
                              value={academicConfig.schoolYear} 
                              onChange={e => onUpdateAcademic({...academicConfig, schoolYear: e.target.value})}
                              placeholder="Contoh: 2024/2025" 
                              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-sm uppercase shadow-inner"
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semester Aktif</label>
                            <select 
                              value={academicConfig.semester} 
                              onChange={e => onUpdateAcademic({...academicConfig, semester: e.target.value as any})}
                              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-xs uppercase shadow-inner"
                            >
                               <option value="I (Ganjil)">I (Ganjil)</option>
                               <option value="II (Genap)">II (Genap)</option>
                            </select>
                         </div>
                      </div>
                   </div>
                 )}

                 {/* TAB 4: MANAJEMEN KBM (LIBUR) */}
                 {activeAdminTab === 'kbm' && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Manajemen Libur Kelas</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Sesi yang diliburkan tidak dianggap Alpa</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => onUpdateAcademic({...academicConfig, excludedClasses: {}})} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase">Aktifkan Semua</button>
                            <button onClick={() => {
                              const all = {}; allAvailableClasses.forEach(c => all[c] = true);
                              onUpdateAcademic({...academicConfig, excludedClasses: all});
                            }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase">Liburkan Semua</button>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                         {allAvailableClasses.map(cls => (
                           <button 
                             key={cls} 
                             onClick={() => toggleClassHoliday(cls)}
                             className={`p-5 rounded-2xl border-2 text-left transition-all ${academicConfig.excludedClasses[cls] ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}
                           >
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black uppercase text-slate-800">{cls}</span>
                                 {academicConfig.excludedClasses[cls] ? <Ban size={14} className="text-orange-600"/> : <Check size={14} className="text-emerald-600"/>}
                              </div>
                              <p className={`text-[8px] font-black uppercase mt-2 ${academicConfig.excludedClasses[cls] ? 'text-orange-700' : 'text-emerald-700'}`}>
                                 {academicConfig.excludedClasses[cls] ? 'SEDANG LIBUR' : 'AKTIF KBM'}
                              </p>
                           </button>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* TAB 5: KOSONGKAN DATABASE */}
                 {activeAdminTab === 'reset' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                       <h4 className="text-sm font-black uppercase tracking-widest text-red-600">Danger Zone (Pembersihan Data)</h4>
                       <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] space-y-6">
                          <div className="flex items-center gap-4 text-red-800">
                             <ShieldAlert size={32}/>
                             <p className="text-[10px] font-bold uppercase leading-relaxed max-w-md">Fungsi ini akan menghapus SELURUH data laporan (Absensi, Pelanggaran, Prestasi) dan data master dari server. Lakukan hanya untuk reset tahun ajaran baru.</p>
                          </div>
                          <button onClick={handleFactoryReset} className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95">
                             <Trash size={18}/> Kosongkan & Reset Database Laporan
                          </button>
                       </div>
                    </div>
                 )}

              </div>
           </div>
        </div>
      )}

      {/* MODAL EDIT USER PROFILE */}
      {editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h3 className="text-lg font-black uppercase tracking-tight">Edit Data User</h3>
                 <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all"><X/></button>
              </div>
              <div className="space-y-5">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input type="text" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Sign-In)</label>
                    <input type="email" value={editingUser.email} disabled className="w-full p-4 bg-slate-100 border rounded-2xl outline-none font-bold text-sm text-slate-400" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Peran Akses</label>
                    <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-black text-xs uppercase">
                       {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
              </div>
              <button onClick={() => handleUpdateUser(editingUser)} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3">
                 <Save size={18}/> Simpan Perubahan User
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
