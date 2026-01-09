
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, SessionType, Announcement, ViolationCategory } from '../types';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, ChevronDown, Users, BookOpen, 
  Shield, Calendar, UserCheck, FileJson, Table, Bell, Plus, X, Edit, Trash2, Award, AlertTriangle 
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';

interface InformationProps {
  role: UserRole;
  userEmail: string;
  data: {
    students: Student[];
    teachers: Teacher[];
    schedules: Schedule[];
    orsam: OrganizationMember[];
    orklas: OrganizationMember[];
    violationTemplates: TemplateItem[];
    achievementTemplates: TemplateItem[];
    announcements: Announcement[];
  };
  onUpdateData: (type: string, newData: any[]) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string>('Senin');
  
  // Announcement States
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  
  // Regulation Catalog States
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingReg, setEditingReg] = useState<TemplateItem | null>(null);
  const [regType, setRegType] = useState<'Violation' | 'Achievement'>('Violation');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const handleDownloadData = () => {
    let exportData: any[] = [];
    if (selectedCategory === 'Guru') exportData = data.teachers;
    else if (selectedCategory === 'Siswa') exportData = data.students;
    else if (selectedCategory === 'Jadwal') exportData = data.schedules;
    else if (selectedCategory === 'ORSAM') exportData = data.orsam;
    else if (selectedCategory === 'ORKLAS') exportData = data.orklas;
    if (exportData.length === 0) { alert("Tidak ada data untuk diunduh."); return; }
    downloadCSV(exportData, `MasterData_${selectedCategory}`);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    const updatedList = editingAnn.id 
      ? data.announcements.map(a => a.id === editingAnn.id ? editingAnn : a)
      : [{ ...editingAnn, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString('id-ID'), author: 'Idaroh Mahasina' }, ...data.announcements];
    
    onUpdateData('Announcements', updatedList);
    setShowAnnModal(false);
    setEditingAnn(null);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if(confirm("Hapus pengumuman ini?")) {
      const updatedList = data.announcements.filter(a => a.id !== id);
      onUpdateData('Announcements', updatedList);
    }
  };

  const handleSaveRegulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    const targetType = regType === 'Violation' ? 'Violations' : 'Achievements';
    const currentList = regType === 'Violation' ? data.violationTemplates : data.achievementTemplates;
    
    // Simple mock "id" matching for local session if id is not present
    const updatedList = (editingReg as any)._exists
      ? currentList.map(t => t.label === editingReg.label ? editingReg : t)
      : [...currentList, editingReg];

    onUpdateData(targetType, updatedList);
    setShowRegModal(false);
    setEditingReg(null);
  };

  const menuItems = [
    { id: 'Guru', label: 'Data Guru', desc: 'Detail pengajar & mapel', icon: <UserCheck size={28}/>, color: 'emerald' },
    { id: 'Siswa', label: 'Data Santri', desc: 'Database identitas santri', icon: <Users size={28}/>, color: 'blue' },
    { id: 'Jadwal', label: 'Jadwal Pelajaran', desc: 'Sistem KBM harian', icon: <Calendar size={28}/>, color: 'indigo' },
    { id: 'Peraturan', label: 'Katalog Peraturan', desc: 'Master poin VP santri', icon: <Shield size={28}/>, color: 'red' },
    { id: 'Pengumuman', label: 'Pengumuman', desc: 'Informasi pusat Mahasina', icon: <Bell size={28}/>, color: 'amber' },
    { id: 'ORSAM', label: 'ORSAM (Pusat)', desc: 'Pengurus Organisasi Santri', icon: <BookOpen size={28}/>, color: 'slate' },
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {menuItems.map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col gap-8">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-[0.2em]">{cat.desc}</p>
                </div>
                <div className="mt-auto pt-4 flex justify-end">
                   <ChevronDown className="-rotate-90 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <button onClick={() => setSelectedCategory(null)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-emerald-700 hover:bg-emerald-50 transition-all">← Kembali</button>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">{selectedCategory}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Pusat Informasi Pondok Mahasina</p>
                 </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                 {selectedCategory === 'Pengumuman' && isSuperAdmin && (
                    <button onClick={() => { setEditingAnn({ id: '', title: '', content: '', date: '', author: '', priority: 'Normal' }); setShowAnnModal(true); }} className="flex items-center gap-3 px-6 py-4 bg-amber-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-amber-700 transition-all">
                       <Plus size={16}/> Tulis Pengumuman
                    </button>
                 )}
                 {selectedCategory === 'Peraturan' && isSuperAdmin && (
                    <button onClick={() => { setEditingReg({ label: '', points: 0, category: ViolationCategory.KEDISIPLINAN }); setShowRegModal(true); }} className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all">
                       <Plus size={16}/> Tambah Aturan
                    </button>
                 )}
                 {['Guru', 'Siswa', 'Jadwal', 'ORSAM'].includes(selectedCategory) && (
                   <button onClick={handleDownloadData} className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-800 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-emerald-100 transition-all border border-indigo-100">
                      <Download size={16}/> Ekspor CSV
                   </button>
                 )}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm min-h-[500px]">
              {/* RENDER ANNOUNCEMENTS */}
              {selectedCategory === 'Pengumuman' && (
                 <div className="space-y-6">
                    {data.announcements.map(ann => (
                       <div key={ann.id} className={`p-8 rounded-[2.5rem] border-2 transition-all relative group ${ann.priority === 'Penting' ? 'bg-amber-50 border-amber-200 shadow-lg' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${ann.priority === 'Penting' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}><Bell size={24}/></div>
                                <div>
                                   <h4 className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">{ann.title}</h4>
                                   <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{ann.date} • Oleh {ann.author}</p>
                                </div>
                             </div>
                             {isSuperAdmin && (
                                <div className="flex gap-2">
                                   <button onClick={() => { setEditingAnn(ann); setShowAnnModal(true); }} className="p-3 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                                   <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-3 bg-white text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                                </div>
                             )}
                          </div>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                       </div>
                    ))}
                    {data.announcements.length === 0 && (
                       <div className="py-32 text-center text-slate-200 font-black uppercase italic tracking-widest">Tidak ada pengumuman aktif.</div>
                    )}
                 </div>
              )}

              {/* RENDER CATALOG */}
              {selectedCategory === 'Peraturan' && (
                 <div className="space-y-10">
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl w-fit">
                       <button onClick={() => setRegType('Violation')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regType === 'Violation' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Pelanggaran</button>
                       <button onClick={() => setRegType('Achievement')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regType === 'Achievement' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Prestasi</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {(regType === 'Violation' ? data.violationTemplates : data.achievementTemplates).map((item, idx) => (
                          <div key={idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 group hover:shadow-xl hover:bg-white transition-all">
                             <div className="flex justify-between items-start">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${regType === 'Violation' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.category}</span>
                                <div className="text-right">
                                   <p className="text-[14px] font-black text-slate-800">{item.points} PT</p>
                                </div>
                             </div>
                             <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">{item.label}</h4>
                             {isSuperAdmin && (
                                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => { setEditingReg({...item, _exists: true} as any); setShowRegModal(true); }} className="p-2.5 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Edit size={14}/></button>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* ... Rest of existing modules (Guru, Siswa, Jadwal) remain same ... */}
              {selectedCategory === 'Guru' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.teachers.map(t => (
                      <div key={t.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all flex flex-col gap-6 shadow-sm group">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-700 font-black shadow-inner group-hover:bg-emerald-700 group-hover:text-white transition-all">{t.name[0]}</div>
                            <div>
                               <p className="text-xs font-black text-slate-800 leading-none uppercase">{t.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{t.subject}</p>
                            </div>
                         </div>
                         <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email: {t.email}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WA: {t.phone}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              )}

              {selectedCategory === 'Siswa' && (
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b-2 border-slate-50">
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NISN / NIS</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Santri</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kelas / Unit</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gender</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {data.students.map(s => (
                            <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                               <td className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.nis}</td>
                               <td className="py-6 text-xs font-black text-slate-800 uppercase">{s.name}</td>
                               <td className="py-6">
                                  <span className="text-xs font-black text-emerald-800">{s.formalClass}</span>
                                  <span className="text-[9px] font-bold text-slate-400 ml-2 uppercase">({s.level})</span>
                               </td>
                               <td className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.gender}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}

              {selectedCategory === 'Jadwal' && (
                 <div className="space-y-8">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                       {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                         <button key={day} onClick={() => setDayFilter(day)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dayFilter === day ? 'bg-emerald-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>{day}</button>
                       ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {data.schedules.filter(s => s.day === dayFilter).map(s => (
                         <div key={s.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                            <div>
                               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-2">{s.sessionType} • {s.time}</p>
                               <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{s.subject}</h4>
                               <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Kelas {s.class} • {s.teacherName}</p>
                            </div>
                            <div className="text-right">
                               <span className="text-[8px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-400 uppercase">{s.level}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnModal && editingAnn && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kirim Pengumuman</h3>
                  <button onClick={() => setShowAnnModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
               </div>
               <form onSubmit={handleSaveAnnouncement} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Judul Informasi</label>
                     <input required type="text" value={editingAnn.title} onChange={e => setEditingAnn({...editingAnn, title: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="Pesan penting hari ini..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level Prioritas</label>
                     <select value={editingAnn.priority} onChange={e => setEditingAnn({...editingAnn, priority: e.target.value as any})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-none appearance-none">
                        <option value="Normal">NORMAL</option>
                        <option value="Penting">PENTING / DARURAT</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Isi Pengumuman</label>
                     <textarea required value={editingAnn.content} onChange={e => setEditingAnn({...editingAnn, content: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-medium text-xs h-40 shadow-inner resize-none" placeholder="Tuliskan detail informasi..." />
                  </div>
                  <button type="submit" className="w-full py-5 bg-emerald-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                     <Bell size={18}/> Publish Sekarang
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* REGULATION MODAL */}
      {showRegModal && editingReg && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Katalog Peraturan</h3>
                  <button onClick={() => setShowRegModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
               </div>
               <form onSubmit={handleSaveRegulation} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Aturan / Capaian</label>
                     <input required type="text" value={editingReg.label} onChange={e => setEditingReg({...editingReg, label: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="Contoh: Terlambat Sholat" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Poin VP</label>
                       <input required type="number" value={editingReg.points} onChange={e => setEditingReg({...editingReg, points: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                       <select value={editingReg.category} onChange={e => setEditingReg({...editingReg, category: e.target.value as any})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-none appearance-none">
                          {Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-5 bg-red-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                     <Shield size={18}/> Update Katalog Master
                  </button>
               </form>
            </div>
         </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
    </div>
  );
};

export default Information;
