
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, SessionType } from '../types';
import { Search, Download, Upload, FileText, Info as InfoIcon, ChevronDown, Users, BookOpen, Shield, Calendar, UserCheck, FileJson, Table } from 'lucide-react';
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
  };
  onUpdateData: (type: string, newData: any[]) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState<SessionType | 'Semua'>('Semua');
  const [dayFilter, setDayFilter] = useState<string>('Senin');
  const [classFilter, setClassFilter] = useState('');
  
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

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    if (selectedCategory === 'Guru') headers = ['id', 'name', 'subject', 'phone', 'email', 'gender', 'isWaliKelas', 'waliKelasFor', 'teachingClasses'];
    else if (selectedCategory === 'Siswa') headers = ['id', 'nis', 'name', 'formalClass', 'level', 'gender'];
    else if (selectedCategory === 'Jadwal') headers = ['id', 'class', 'level', 'gender', 'day', 'time', 'subject', 'teacherName', 'sessionType'];
    else if (selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') headers = ['id', 'position', 'name', 'nis', 'class', 'department'];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `Template_Upload_${selectedCategory}.csv`);
    link.click();
    alert(`Template ${selectedCategory} berhasil diunduh. Gunakan format ini untuk upload CSV.`);
  };

  const menuItems = [
    { id: 'Guru', label: 'Data Guru', desc: 'Detail pengajar & mapel', icon: <UserCheck size={28}/>, color: 'emerald' },
    { id: 'Siswa', label: 'Data Santri', desc: 'Database identitas santri', icon: <Users size={28}/>, color: 'blue' },
    { id: 'Jadwal', label: 'Jadwal Pelajaran', desc: 'Sistem KBM harian', icon: <Calendar size={28}/>, color: 'indigo' },
    { id: 'ORSAM', label: 'ORSAM (Pusat)', desc: 'Pengurus Organisasi Santri', icon: <Shield size={28}/>, color: 'red' },
    { id: 'ORKLAS', label: 'ORKLAS (Kelas)', desc: 'Pengurus organisasi kelas', icon: <BookOpen size={28}/>, color: 'amber' },
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Daftar Data Resmi Pondok Mahasina</p>
                 </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                 {isSuperAdmin && (
                   <button onClick={handleDownloadTemplate} className="flex items-center gap-3 px-6 py-4 bg-indigo-50 text-indigo-800 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all border border-indigo-100">
                      <Table size={16}/> Unduh Template CSV
                   </button>
                 )}
                 <button onClick={handleDownloadData} className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-800 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-emerald-100 transition-all border border-emerald-100">
                    <Download size={16}/> Ekspor CSV
                 </button>
                 {isSuperAdmin && (
                   <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-900 transition-all active:scale-95">
                      <Upload size={16}/> Upload Master
                   </button>
                 )}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm min-h-[500px]">
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
                    {data.teachers.length === 0 && (
                      <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Database Guru Masih Kosong</div>
                    )}
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
                       {data.schedules.filter(s => s.day === dayFilter).length === 0 && (
                          <div className="col-span-full py-20 text-center text-slate-200 font-black uppercase italic tracking-widest">Belum Ada Jadwal Di Hari Ini</div>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" />
    </div>
  );
};

export default Information;
