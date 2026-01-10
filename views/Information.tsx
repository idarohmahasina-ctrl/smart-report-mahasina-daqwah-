
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, SessionType, Announcement, ViolationCategory } from '../types';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Table, Bell, Plus, X, Edit, Trash2, 
  Database, ArrowLeft, UserCheck2, Mail, Phone, Filter, ChevronRight, FileSpreadsheet, Save
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import * as XLSX from 'xlsx';

interface ExtraDataList {
  id: string;
  title: string;
  data: any[];
  uploadedAt: string;
}

interface InformationProps {
  role: UserRole;
  userEmail: string;
  data: {
    students: Student[];
    teachers: Teacher[];
    schedules: Schedule[];
    orsam: OrganizationMember[];
    orklas: OrganizationMember[];
    extraDataLists: ExtraDataList[];
    violationTemplates: TemplateItem[];
    achievementTemplates: TemplateItem[];
    announcements: Announcement[];
  };
  onUpdateData: (type: string, newData: any[]) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeExtraId, setActiveExtraId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string>('Senin');
  
  // Safe mapping of dynamic sessions
  const dynamicSessions = useMemo(() => {
    if (!data.schedules) return ['Madrasah'];
    const sess = new Set<string>();
    data.schedules.forEach(s => { if(s.sessionType) sess.add(s.sessionType); });
    const sorted = Array.from(sess).sort();
    return sorted.includes('Madrasah') ? sorted : ['Madrasah', ...sorted];
  }, [data.schedules]);

  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const availableClassesForSession = useMemo(() => {
    if (!data.students) return [];
    const classSet = new Set<string>();
    data.students.forEach(s => {
      const isFormal = studentSessionFilter.toLowerCase().includes('madrasah');
      const cls = isFormal ? s.formalClass : (s.sessionClasses?.[studentSessionFilter as any]);
      if (cls) classSet.add(cls);
    });
    return Array.from(classSet).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [data.students, studentSessionFilter]);

  const filteredStudents = useMemo(() => {
    if (!data.students) return [];
    return data.students.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
      const isFormal = studentSessionFilter.toLowerCase().includes('madrasah');
      const studentClassInSession = isFormal ? s.formalClass : (s.sessionClasses?.[studentSessionFilter as any]);
      const matchClass = !studentClassFilter || studentClassInSession === studentClassFilter;
      return matchSearch && matchClass;
    });
  }, [data.students, studentSessionFilter, studentClassFilter, searchTerm]);

  const filteredSchedules = useMemo(() => {
    if (!data.schedules) return [];
    return data.schedules.filter(s => {
      const matchDay = !dayFilter || s.day === dayFilter;
      const matchSearch = (s.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchDay && matchSearch;
    });
  }, [data.schedules, dayFilter, searchTerm]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { id: 'Guru', label: 'Data Guru', desc: 'Profil pengajar Mahasina', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Identitas & Kelas Multi-Sesi', icon: <Users size={28}/>, color: 'blue' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Sistem harian pesantren', icon: <Calendar size={28}/>, color: 'indigo' },
             { id: 'Peraturan', label: 'Katalog Peraturan & Poin', desc: 'Master poin VP pesantren', icon: <Shield size={28}/>, color: 'red' },
             { id: 'ORSAM', label: 'ORSAM', desc: 'Organisasi Santri Mahasina', icon: <Database size={28}/>, color: 'slate' },
             { id: 'ORKLAS', label: 'ORKLAS', desc: 'Pengurus Per Unit Kelas', icon: <UserCheck size={28}/>, color: 'amber' },
             { id: 'Pengumuman', label: 'Pengumuman', desc: 'Informasi Idaroh Pusat', icon: <Bell size={28}/>, color: 'emerald' },
             { id: 'Lainnya', label: 'Lainnya', desc: 'Data kustom Excel Idaroh', icon: <FileText size={28}/>, color: 'indigo' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col gap-8 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${cat.color}-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform`} />
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-${cat.color}-50 text-${cat.color}-600 relative z-10`}>{cat.icon}</div>
                <div className="relative z-10">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-[0.2em]">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <button onClick={() => {setSelectedCategory(null); setActiveExtraId(null); setSearchTerm('');}} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-90">
                    <ArrowLeft size={24}/>
                 </button>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
                       {selectedCategory}
                    </h2>
                 </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-sm min-h-[600px]">
              {selectedCategory === 'Siswa' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesi Kegiatan</label>
                         <select value={studentSessionFilter} onChange={e => {setStudentSessionFilter(e.target.value); setStudentClassFilter('');}} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase appearance-none cursor-pointer">
                            {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Sesi</label>
                         <select value={studentClassFilter} onChange={e => setStudentClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase appearance-none cursor-pointer">
                            <option value="">-- SEMUA KELAS --</option>
                            {availableClassesForSession.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Nama/NISN</label>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik nama santri..." className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs" />
                      </div>
                   </div>
                   <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b-2 border-slate-50">
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Santri</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map(s => (
                               <tr key={s.id} className="group hover:bg-slate-50">
                                  <td className="py-5 text-[11px] font-bold text-slate-400">{s.nis || '-'}</td>
                                  <td className="py-5 text-sm font-black text-slate-800 uppercase">{s.name || 'N/A'}</td>
                                  <td className="py-5"><span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{ studentSessionFilter.toLowerCase().includes('madrasah') ? (s.formalClass || '-') : (s.sessionClasses?.[studentSessionFilter as any] || '-')}</span></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {selectedCategory === 'Jadwal' && (
                <div className="space-y-10">
                   <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Hari</label>
                        <div className="flex flex-wrap gap-2">
                           {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(d => (
                             <button key={d} onClick={() => setDayFilter(d)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dayFilter === d ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}>{d}</button>
                           ))}
                        </div>
                      </div>
                      <div className="w-full md:w-64 space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Mapel / Guru</label>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik mapel..." className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs" />
                      </div>
                   </div>
                   <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b-2 border-slate-50">
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapel / Unit</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru Pengajar</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sesi</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {filteredSchedules.map(s => (
                               <tr key={s.id} className="group hover:bg-slate-50">
                                  <td className="py-5 text-[11px] font-bold text-slate-400">{s.time || '-'}</td>
                                  <td className="py-5">
                                     <p className="text-sm font-black text-slate-800 uppercase leading-none">{s.subject || '-'}</p>
                                     <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase">Unit: {s.class || '-'} ({s.level || '-'})</p>
                                  </td>
                                  <td className="py-5">
                                     <p className="text-[11px] font-black text-slate-700 uppercase">{s.teacherName || '-'}</p>
                                  </td>
                                  <td className="py-5"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">{s.sessionType || '-'}</span></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                      {filteredSchedules.length === 0 && (
                        <div className="py-32 text-center text-slate-200 font-black uppercase italic tracking-[0.3em]">Jadwal Kosong</div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Information;
