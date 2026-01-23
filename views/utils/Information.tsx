
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../../types.ts';
import { 
  Search, Upload, Users, Calendar, ArrowLeft, UserCheck2, GraduationCap, Award, Heart, ShieldCheck, User as UserIcon, Download, FileText, Zap, BookOpen, ShieldAlert, ChevronDown
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { isTeacherMatch, normalizeSessionName } from './nameMatchers.ts';
import { downloadCSV } from './csvExport.ts';
import * as XLSX from 'xlsx';

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

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [schSessionFilter, setSchSessionFilter] = useState('Semua');
  const [schClassFilter, setSchClassFilter] = useState('Semua');
  const [schDayFilter, setSchDayFilter] = useState('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com' || role === UserRole.IDAROH;

  const dynamicSessions = useMemo(() => {
    const sessSet = new Set<string>();
    data.schedules.forEach(s => { if(s.sessionType) sessSet.add(normalizeSessionName(s.sessionType)); });
    return Array.from(sessSet).sort();
  }, [data.schedules]);

  const availableClasses = useMemo(() => {
    const clsSet = new Set<string>();
    const schedulesToScan = schSessionFilter === 'Semua' 
      ? data.schedules 
      : data.schedules.filter(s => normalizeSessionName(s.sessionType) === schSessionFilter);
    
    schedulesToScan.forEach(s => clsSet.add(s.class));
    if (schSessionFilter === 'Semua' || schSessionFilter.toLowerCase().includes('madrasah')) {
      data.students.forEach(s => { if (s.formalClass) clsSet.add(s.formalClass); });
    }
    return Array.from(clsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data.students, data.schedules, schSessionFilter]);

  const pembinaData = useMemo(() => {
    const allUnitClasses = Array.from(new Set([
      ...data.students.map(s => s.formalClass),
      ...data.schedules.map(s => s.class)
    ])).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return allUnitClasses.map(cls => {
      const walas = data.extraDataLists.find(e => (e as any).type === 'Walas' && (e as any).class === cls);
      const musyrif = data.extraDataLists.find(e => (e as any).type === 'Musyrif' && (e as any).class === cls);
      return { class: cls, walas: walas ? (walas as any).name : '-', musyrif: musyrif ? (musyrif as any).name : '-' };
    });
  }, [data.students, data.schedules, data.extraDataLists]);

  const handleDownloadTemplate = (type: string) => {
    let headers: string[] = [];
    if (type === 'Siswa') headers = ['NIS', 'NAMA', 'GENDER', 'KELAS FORMAL', 'KELAS Al-Quran', 'KELAS Kitab Kuning'];
    else if (type === 'Guru') headers = ['NAMA', 'MAPEL', 'NOHP'];
    else if (type === 'Jadwal') headers = ['HARI', 'WAKTU', 'MAPEL', 'GURU', 'UNIT', 'SESI'];
    else if (type === 'ORSAM' || type === 'ORKLAS') headers = ['NAMA', 'NIS', 'KELAS', 'JABATAN', 'DIVISI', 'GENDER'];
    else if (type === 'Pembina') headers = ['NAMA', 'UNIT', 'GENDER', 'TIPE'];
    else if (type === 'Peraturan') headers = ['JUDUL', 'POIN', 'KATEGORI', 'TIPE'];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Template_Impor_${type}.csv`);
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length < 2) return;
      
      const rawHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));
      const getIdx = (names: string[]) => {
        for(let name of names) {
          const i = rawHeaders.indexOf(name.toUpperCase().replace(/[^A-Z0-9]/g, ''));
          if(i !== -1) return i;
        }
        return -1;
      };

      const newData = jsonData.slice(1).map((row: any, idx) => {
        const val = (idxArr: string[]) => {
          const realIdx = getIdx(idxArr);
          return realIdx !== -1 ? String(row[realIdx] || '').trim() : '';
        };

        if (type === 'Pembina') {
           const tipe = val(['TIPE']) || 'Walas';
           return { id: `wm-${Date.now()}-${idx}`, name: val(['NAMA']), class: val(['UNIT', 'KELAS']), gender: val(['GENDER', 'JK']) || 'Putra', type: tipe };
        }
        if (type === 'Peraturan') {
           const tipe = val(['TIPE']) || 'Pelanggaran';
           return { label: val(['JUDUL', 'NAMA']), points: Number(val(['POIN']) || 0), category: val(['KATEGORI']) as ViolationCategory, type: tipe };
        }
        if (type === 'ORSAM' || type === 'ORKLAS') {
          return { id: `org-${Date.now()}-${idx}`, name: val(['NAMA']), nis: val(['NIS']), class: val(['KELAS']), position: val(['JABATAN']), division: val(['DIVISI']), gender: val(['GENDER', 'JK']) || 'Putra', orgType: type };
        }
        if (type === 'Siswa') {
           const student: any = { id: `std-${Date.now()}-${idx}`, nis: val(['NIS']), name: val(['NAMA']), gender: val(['GENDER', 'JK']) || 'Putra', formalClass: val(['KELASFORMAL', 'UNIT']), sessionClasses: {} };
           (jsonData[0] as any[]).forEach((h, i) => {
             const head = String(h).toUpperCase();
             if (head.includes('KELAS') && !head.includes('FORMAL')) {
                const sName = String(h).replace(/Kelas/i, '').trim();
                const cVal = String(row[i] || '').trim();
                if (cVal) student.sessionClasses[normalizeSessionName(sName)] = cVal;
             }
           });
           return student;
        }
        if (type === 'Guru') return { id: `t-${Date.now()}-${idx}`, name: val(['NAMA']), subject: val(['MAPEL']), phone: val(['NOHP']) };
        if (type === 'Jadwal') return { id: `sch-${Date.now()}-${idx}`, day: val(['HARI']) || 'Senin', time: val(['WAKTU']), subject: val(['MAPEL']), teacherName: val(['GURU']), class: val(['UNIT']), sessionType: normalizeSessionName(val(['SESI']) || 'Umum') };
        return null;
      }).filter(i => i && (i.name || i.label));

      if (confirm(`Impor ${newData.length} data ${type}?`)) { onUpdateData(type, newData); alert("Berhasil!"); }
    };
    reader.readAsBinaryString(file);
  };

  const categories = [
    { id: 'Guru', label: 'Daftar Pengajar', desc: 'Profil Guru & Mapel', icon: <UserCheck2 size={24}/>, color: 'emerald' },
    { id: 'Pembina', label: 'Pembina Unit', desc: 'Walas & Musyrif/ah', icon: <GraduationCap size={24}/>, color: 'blue' },
    { id: 'Siswa', label: 'Database Santri', desc: 'Data Induk & Plotting', icon: <Users size={24}/>, color: 'indigo' },
    { id: 'Jadwal', label: 'Plotting Jadwal', desc: 'KBM & Kegiatan Rutin', icon: <Calendar size={24}/>, color: 'orange' },
    { id: 'ORSAM', label: 'ORSAM', desc: 'Pengurus Santri Pusat', icon: <Heart size={24}/>, color: 'pink' },
    { id: 'ORKLAS', label: 'ORKLAS', desc: 'Pengurus Internal Kelas', icon: <UserIcon size={24}/>, color: 'violet' },
    { id: 'Peraturan', label: 'Sistem Poin', desc: 'Katalog Pelanggaran', icon: <ShieldAlert size={24}/>, color: 'red' },
  ];

  return (
    <div className="space-y-10 pb-24 max-w-6xl mx-auto px-4">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
           {categories.map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-left hover:border-emerald-600 hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-8 rounded-[3.5rem] border shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 border-slate-50">
              <div className="flex items-center gap-6">
                 <button onClick={() => setSelectedCategory(null)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-inner"><ArrowLeft size={22}/></button>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">{selectedCategory}</h2>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Sistem Informasi Mahasina</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3">
                 {isSuperAdmin && (
                   <button onClick={() => handleDownloadTemplate(selectedCategory)} className="px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
                      <FileText size={16}/> Unduh Template
                   </button>
                 )}
                 {isSuperAdmin && (
                   <label className="px-6 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-xl hover:bg-black transition-all">
                      <Upload size={16}/> Impor Excel
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
                   </label>
                 )}
                 <button onClick={() => downloadCSV(selectedCategory === 'Siswa' ? data.students : selectedCategory === 'Guru' ? data.teachers : selectedCategory === 'Jadwal' ? data.schedules : selectedCategory === 'ORSAM' ? data.orsam : selectedCategory === 'ORKLAS' ? data.orklas : selectedCategory === 'Peraturan' ? [...data.violationTemplates, ...data.achievementTemplates] : data.extraDataLists, `Data_${selectedCategory}`)} className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:shadow-md transition-all border">
                    <Download size={16}/> Ekspor CSV
                 </button>
              </div>
           </div>

           <div className="bg-white p-8 md:p-10 rounded-[4rem] border shadow-sm space-y-8 overflow-hidden border-slate-50">
              <div className="flex flex-col md:flex-row gap-4">
                 {selectedCategory === 'Jadwal' && (
                   <div className="flex flex-wrap gap-2">
                      <select value={schDayFilter} onChange={e => setSchDayFilter(e.target.value)} className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-r-8 border-transparent">
                         <option value="Semua">Semua Hari</option>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={schSessionFilter} onChange={e => { setSchSessionFilter(e.target.value); setSchClassFilter('Semua'); }} className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-r-8 border-transparent">
                         <option value="Semua">Semua Sesi</option>{dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={schClassFilter} onChange={e => setSchClassFilter(e.target.value)} className="p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-r-8 border-transparent">
                         <option value="Semua">Semua Kelas</option>{availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                 )}
                 <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input type="text" placeholder={`Cari data ${selectedCategory.toLowerCase()}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-3xl outline-none font-bold text-sm shadow-inner transition-all" />
                 </div>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[800px]">
                   <thead className="border-b-2 border-slate-50">
                      <tr>
                        {selectedCategory === 'Pembina' ? (
                          <><th className="pb-6 text-[10px] font-black uppercase text-slate-400">Kelas/Unit</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400">Wali Kelas</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400">Musyrif/ah</th></>
                        ) : selectedCategory === 'Peraturan' ? (
                          <><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Laporan</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kategori</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Poin</th></>
                        ) : (
                          <><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identitas Utama</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Penempatan/Kelas</th><th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detail Lainnya</th></>
                        )}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {selectedCategory === 'Guru' && data.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                           <td className="py-7 pr-4"><p className="font-black uppercase text-[13px] text-slate-800">{item.name}</p><p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{item.subject}</p></td>
                           <td className="py-7 pr-4"><div className="flex flex-wrap gap-1.5">{data.schedules.filter(s => isTeacherMatch(item.name, s.teacherName)).map((s, si) => <span key={si} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase shadow-sm">{s.class}</span>)}</div></td>
                           <td className="py-7 text-slate-400 font-bold text-[11px]">{item.phone || 'N/A'}</td>
                        </tr>
                      ))}

                      {selectedCategory === 'Peraturan' && [...data.violationTemplates, ...data.achievementTemplates].filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                           <td className="py-7 pr-4"><p className="font-black uppercase text-[12px] text-slate-800">{item.label}</p></td>
                           <td className="py-7 pr-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase">{item.category}</span></td>
                           <td className="py-7 font-black text-[11px] text-emerald-600">{item.points} Poin</td>
                        </tr>
                      ))}

                      {(selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') && (data[selectedCategory === 'ORSAM' ? 'orsam' : 'orklas'] || []).filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                           <td className="py-7 pr-4"><p className="font-black uppercase text-[13px] text-slate-800">{item.name}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">NIS: {item.nis}</p></td>
                           <td className="py-7 pr-4"><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm ${selectedCategory === 'ORSAM' ? 'bg-pink-50 text-pink-700' : 'bg-violet-50 text-violet-700'}`}>{item.class}</span></td>
                           <td className="py-7">
                              <p className="font-black uppercase text-[11px] text-slate-700">{item.position}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.division}</p>
                           </td>
                        </tr>
                      ))}

                      {selectedCategory === 'Pembina' && pembinaData.filter(p => p.class.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-all">
                           <td className="py-7 pr-4"><span className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-[1.2rem] text-[11px] font-black uppercase shadow-sm border border-blue-100">{item.class}</span></td>
                           <td className="py-7 pr-4 font-black uppercase text-[12px] text-slate-800">{item.walas}</td>
                           <td className="py-7 font-black uppercase text-[12px] text-slate-600">{item.musyrif}</td>
                        </tr>
                      ))}

                      {selectedCategory === 'Siswa' && data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-7 pr-4"><p className="font-black uppercase text-[13px] text-slate-800">{item.name}</p><p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{item.nis || '-'} • {item.gender}</p></td>
                           <td className="py-7 pr-4"><span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase shadow-sm">Kls {item.formalClass}</span></td>
                           <td className="py-7 text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-xs">{Object.entries(item.sessionClasses || {}).map(([k,v]) => `${k}: ${v}`).join(' | ') || 'Reguler Only'}</td>
                        </tr>
                      ))}

                      {selectedCategory === 'Jadwal' && data.schedules.filter(s => {
                        const matchDay = schDayFilter === 'Semua' || s.day === schDayFilter;
                        const matchSess = schSessionFilter === 'Semua' || normalizeSessionName(s.sessionType) === schSessionFilter;
                        const matchCls = schClassFilter === 'Semua' || s.class === schClassFilter;
                        const matchSearch = s.subject.toLowerCase().includes(searchTerm.toLowerCase()) || s.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
                        return matchDay && matchSess && matchCls && matchSearch;
                      }).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-7 pr-4"><p className="font-black uppercase text-[13px] text-slate-800">{item.subject}</p><p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest truncate">{item.teacherName}</p></td>
                           <td className="py-7 pr-4"><div className="flex flex-col gap-1.5"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase w-fit">{item.class}</span><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{item.sessionType}</span></div></td>
                           <td className="py-7 text-[11px] font-black uppercase text-slate-500 tracking-tighter">{item.day} • {item.time} WIB</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Information;
