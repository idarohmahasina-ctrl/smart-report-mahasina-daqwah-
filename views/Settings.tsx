
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, UserProfile, AcademicConfig, AppData, PrayerTime } from '../types.ts';
import { 
  getAllUsers, registerUser, deleteUser, resetFirestoreData, clearAppData 
} from '../services/dataService.ts';
import { 
  User as UserIcon, Users, Cloud, RefreshCw, LogOut, Trash2, 
  ShieldCheck, ShieldAlert, Edit, Ban, Check, X, Calendar, 
  BookOpen, Trash, Save, Info, Clock, Zap
} from 'lucide-react';
import { normalizeSessionName } from './utils/nameMatchers.ts';

interface SettingsProps {
  userEmail: string;
  academicConfig: AcademicConfig;
  onUpdateAcademic: (config: AcademicConfig) => void;
  availableClasses: string[];
  students: any[];
  schedules: any[];
}

const Settings: React.FC<SettingsProps> = ({ userEmail, academicConfig, onUpdateAcademic, students, schedules }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'academic' | 'kbm' | 'sync' | 'reset'>('users');
  const [allSystemUsers, setAllSystemUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const allAvailableSessions = useMemo(() => {
    const sessSet = new Set<string>();
    schedules.forEach(s => sessSet.add(normalizeSessionName(s.sessionType)));
    Object.values(PrayerTime).forEach(p => sessSet.add(normalizeSessionName(p)));
    return Array.from(sessSet).sort();
  }, [schedules]);

  const [selectedSessionForExclusion, setSelectedSessionForExclusion] = useState<string>(allAvailableSessions[0] || 'Madrasah');

  useEffect(() => {
    if (isSuperAdmin) loadUsers();
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsers();
      setAllSystemUsers(users);
    } catch (err) { console.error(err); } finally { setLoadingUsers(false); }
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
    return Array.from(cls).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students]);

  const toggleSessionHolidayGlobal = (session: string) => {
    const current = { ...academicConfig.excludedSessions || {} };
    if (current[session]) delete current[session];
    else current[session] = true;
    onUpdateAcademic({ ...academicConfig, excludedSessions: current });
  };

  const toggleClassInSession = (session: string, className: string) => {
    const currentExclusions = { ...academicConfig.sessionClassExclusions || {} };
    const sessionExclusions = { ...currentExclusions[session] || {} };
    
    if (sessionExclusions[className]) delete sessionExclusions[className];
    else sessionExclusions[className] = true;
    
    currentExclusions[session] = sessionExclusions;
    onUpdateAcademic({ ...academicConfig, sessionClassExclusions: currentExclusions });
  };

  const handleFactoryReset = async () => {
    if (confirm("🚨 TINDAKAN BERBAHAYA: Anda akan mengosongkan seluruh database. Lanjutkan?")) {
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
      <div className="bg-white rounded-[3rem] border shadow-sm p-10 space-y-8 border-slate-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl"><UserIcon size={32}/></div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Profil Petugas</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{userEmail}</p>
               </div>
            </div>
            <button onClick={() => { clearAppData(); window.location.reload(); }} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm">
               <LogOut size={18}/> Logout
            </button>
         </div>
      </div>

      {isSuperAdmin && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
           <div className="flex items-center gap-4 text-emerald-900 px-2">
              <ShieldCheck size={28}/>
              <h2 className="text-2xl font-black uppercase tracking-tight">Admin Control Panel</h2>
           </div>

           <div className="bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
              <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                 {[
                   { id: 'sync', label: 'Cloud Sync', icon: <Cloud size={18}/> },
                   { id: 'users', label: 'Daftar Petugas', icon: <Users size={18}/> },
                   { id: 'academic', label: 'Semester Aktif', icon: <Calendar size={18}/> },
                   { id: 'kbm', label: 'Manajemen Libur', icon: <BookOpen size={18}/> },
                   { id: 'reset', label: 'Reset Sistem', icon: <Trash size={18}/> }
                 ].map(tab => (
                   <button key={tab.id} onClick={() => setActiveAdminTab(tab.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAdminTab === tab.id ? 'bg-emerald-950 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-emerald-700'}`} >
                     {tab.icon} {tab.label}
                   </button>
                 ))}
              </div>

              <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-white">
                 {activeAdminTab === 'kbm' && (
                   <div className="space-y-12 animate-in fade-in duration-500">
                      <div className="space-y-6">
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> 1. Libur Sesi (Global)</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allAvailableSessions.map(sess => (
                               <button key={sess} onClick={() => toggleSessionHolidayGlobal(sess)} className={`p-4 rounded-xl border-2 text-left transition-all ${(academicConfig.excludedSessions || {})[sess] ? 'bg-orange-50 border-orange-200 shadow-inner' : 'bg-blue-50 border-blue-200'}`}>
                                  <div className="flex justify-between items-center">
                                     <span className="text-[10px] font-black uppercase text-slate-800">{sess}</span>
                                     {(academicConfig.excludedSessions || {})[sess] ? <Zap size={14} className="text-orange-600"/> : <Check size={14} className="text-blue-600"/>}
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-6 pt-10 border-t border-slate-100">
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><Users size={18} className="text-emerald-500"/> 2. Libur Kelas Per Sesi</h4>
                         <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6 shadow-inner">
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
                               {allAvailableSessions.map(sess => (
                                  <button key={sess} onClick={() => setSelectedSessionForExclusion(sess)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSessionForExclusion === sess ? 'bg-emerald-950 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>{sess}</button>
                               ))}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                               {allAvailableClasses.map(cls => {
                                 const isExcluded = academicConfig.sessionClassExclusions?.[selectedSessionForExclusion]?.[cls];
                                 return (
                                   <button key={cls} onClick={() => toggleClassInSession(selectedSessionForExclusion, cls)} className={`p-3 rounded-xl border-2 text-center transition-all ${isExcluded ? 'bg-orange-50 border-orange-200 text-orange-800 shadow-inner' : 'bg-white border-slate-100 text-slate-600'}`}>
                                      <span className="text-[9px] font-black uppercase">{cls}</span>
                                      <div className="mt-1">{isExcluded ? <span className="text-[7px] font-black">LIBUR</span> : <span className="text-[7px] font-black opacity-30">AKTIF</span>}</div>
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {activeAdminTab === 'users' && (
                   <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center">
                         <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Daftar Petugas</h4>
                         <button onClick={loadUsers} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl"><RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''}/></button>
                      </div>
                      <div className="space-y-4">
                         {allSystemUsers.map(user => (
                           <div key={user.email} className={`p-6 rounded-[2rem] border flex flex-col md:flex-row justify-between items-center gap-4 ${user.isBlocked ? 'bg-red-50 opacity-60' : 'bg-slate-50'}`}>
                              <div className="flex items-center gap-5 flex-1 w-full">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">{user.fullName[0]}</div>
                                 <div className="min-w-0"><p className="text-[11px] font-black uppercase text-slate-800 truncate">{user.fullName}</p><p className="text-[9px] font-bold text-slate-400 uppercase truncate">{user.role} • {user.email}</p></div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={() => setEditingUser(user)} className="p-3 bg-white text-blue-600 rounded-xl border shadow-sm"><Edit size={16}/></button>
                                 <button onClick={() => handleToggleBlock(user)} className={`p-3 rounded-xl border shadow-sm ${user.isBlocked ? 'bg-emerald-600 text-white' : 'bg-white text-orange-600'}`}>{user.isBlocked ? <Check size={16}/> : <Ban size={16}/>}</button>
                                 <button onClick={() => handleDeleteUser(user.email)} className="p-3 bg-white text-red-600 rounded-xl border shadow-sm"><Trash2 size={16}/></button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {activeAdminTab === 'academic' && (
                   <div className="space-y-10 animate-in fade-in duration-500">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Konfigurasi Semester</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tahun Ajaran</label>
                            <input type="text" value={academicConfig.schoolYear} onChange={e => onUpdateAcademic({...academicConfig, schoolYear: e.target.value})} placeholder="2024/2025" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semester Aktif</label>
                            <select value={academicConfig.semester} onChange={e => onUpdateAcademic({...academicConfig, semester: e.target.value as any})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner" >
                               <option value="I (Ganjil)">I (Ganjil)</option>
                               <option value="II (Genap)">II (Genap)</option>
                            </select>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center"><h3 className="text-lg font-black uppercase tracking-tight">Edit Petugas</h3><button onClick={() => setEditingUser(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all"><X/></button></div>
              <div className="space-y-5">
                 <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Petugas</label><input type="text" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" /></div>
                 <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tugas Utama</label><select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-black text-xs uppercase">{Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <button onClick={() => handleUpdateUser(editingUser)} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3"><Save size={18}/> Simpan</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
