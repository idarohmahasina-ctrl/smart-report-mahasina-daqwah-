
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement } from '../../types.ts';
import { 
  Search, Upload, Users, Calendar, ArrowLeft, UserCheck2, GraduationCap, Award, Heart, ShieldCheck
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { isTeacherMatch, normalizeSessionName } from './nameMatchers.ts';
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

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [schDayFilter, setSchDayFilter] = useState('Semua');
  const [schSessionFilter, setSchSessionFilter] = useState('Semua');
  const [schClassFilter, setSchClassFilter] = useState('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const dynamicSessions = useMemo(() => {
    const sessSet = new Set<string>();
    data.schedules.forEach(s => { if(s.sessionType) sessSet.add(normalizeSessionName(s.sessionType)); });
    data.students.forEach(s => {
      if (s.sessionClasses) {
        Object.keys(s.sessionClasses).forEach(key => sessSet.add(normalizeSessionName(key)));
      }
    });
    return Array.from(sessSet).sort();
  }, [data.schedules, data.students]);

  // FILTER DEPENDEN: Kelas hanya muncul jika ada di sesi yang dipilih
  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    const schedulesToScan = schSessionFilter === 'Semua' 
      ? data.schedules 
      : data.schedules.filter(s => normalizeSessionName(s.sessionType) === schSessionFilter);
    
    schedulesToScan.forEach(s => cls.add(s.class));
    
    // Jika Madrash dipilih, tambahkan formalClass santri
    if (schSessionFilter === 'Semua' || schSessionFilter.toLowerCase().includes('madrasah')) {
      data.students.forEach(s => { if (s.formalClass) cls.add(s.formalClass); });
    }
    
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data.students, data.schedules, schSessionFilter]);

  const pembinaData = useMemo(() => {
    // Basis data adalah Kelas/Unit unik dari Santri dan Jadwal
    const classes = Array.from(new Set([
      ...data.students.map(s => s.formalClass),
      ...data.schedules.map(s => s.class)
    ])).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return classes.map(cls => {
      const walas = data.extraDataLists.find(e => (e as any).type === 'Walas' && (e as any).class === cls);
      const musyrif = data.extraDataLists.find(e => (e as any).type === 'Musyrif' && (e as any).class === cls);
      return {
        class: cls,
        walas: walas ? (walas as any).name : '-',
        musyrif: musyrif ? (musyrif as any).name : '-',
        gender: walas ? (walas as any).gender : (musyrif ? (musyrif as any).gender : '-')
      };
    });
  }, [data.students, data.schedules, data.extraDataLists]);

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
        // Fix: Changed parameter type from number[] to string[] to resolve type mismatch errors
        const val = (idxArr: string[]) => {
          const realIdx = getIdx(idxArr);
          return realIdx !== -1 ? String(row[realIdx] || '').trim() : '';
        };

        if (type === 'Walas' || type === 'Musyrif') {
          return {
            id: `wm-${Date.now()}-${idx}`,
            name: val(['NAMA', 'USTADZ', 'PENGASUH']),
            class: val(['KELAS', 'UNIT', 'BINAAN']),
            gender: val(['GENDER', 'JK']) || 'Putra',
            type: type
          };
        }
        if (type === 'Siswa') {
           const student: any = {
             id: `std-${Date.now()}-${idx}`,
             nis: val(['NIS', 'NISN']),
             name: val(['NAMA', 'NAMASANTRI']),
             gender: val(['GENDER', 'JK']) || 'Putra',
             formalClass: val(['KELASFORMAL', 'UNIT']),
             sessionClasses: {}
           };
           // Dynamic Session Classes from Headers
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
        if (type === 'Guru') {
           return { id: `t-${Date.now()}-${idx}`, name: val(['NAMA', 'USTADZ']), subject: val(['MAPEL']), phone: val(['NOHP', 'WA']) };
        }
        if (type === 'Jadwal') {
           return {
             id: `sch-${Date.now()}-${idx}`,
             day: val(['HARI']) || 'Senin',
             time: val(['WAKTU', 'JAM']),
             subject: val(['MAPEL', 'PELAJARAN']),
             teacherName: val(['GURU', 'USTADZ']),
             class: val(['UNIT', 'KELAS']),
             sessionType: normalizeSessionName(val(['SESI', 'KEGIATAN']) || 'Umum')
           };
        }
        return null;
      }).filter(i => i && i.name);

      if (confirm(`Impor ${newData.length} data ${type}?`)) {
        onUpdateData(type, newData);
        alert("Berhasil!");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto px-4">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { id: 'Guru', label: 'Data Pengajar', desc: 'Daftar Guru & Mapel', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Pembina', label: 'Pembina Kelas', desc: 'Wali Kelas & Musyrif/ah', icon: <GraduationCap size={28}/>, color: 'blue' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Biodata & Plotting Sesi', icon: <Users size={28}/>, color: 'indigo' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Plotting Guru & Kelas', icon: <Calendar size={28}/>, color: 'orange' },
             { id: 'Peraturan', label: 'Katalog Poin', desc: 'Daftar Skor Pelanggaran', icon: <Award size={28}/>, color: 'red' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl transition-all group flex flex-col gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <button onClick={() => setSelectedCategory(null)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><ArrowLeft size={20}/></button>
                 <h2 className="text-xl font-black uppercase tracking-tight">{selectedCategory}</h2>
              </div>
              <div className="flex gap-2">
                 {isSuperAdmin && (selectedCategory !== 'Pembina' && selectedCategory !== 'Peraturan') && (
                   <label className="px-6 py-4 bg-emerald-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg">
                      <Upload size={16}/> Impor Excel
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory === 'Pembina' ? 'Walas' : selectedCategory)} />
                   </label>
                 )}
                 {isSuperAdmin && selectedCategory === 'Pembina' && (
                   <div className="flex gap-2">
                      <label className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                         <Upload size={14}/> Impor Walas
                         <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, 'Walas')} />
                      </label>
                      <label className="px-4 py-3 bg-pink-600 text-white rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                         <Upload size={14}/> Impor Musyrif
                         <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, 'Musyrif')} />
                      </label>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-white p-6 sm:p-10 rounded-[3rem] border shadow-sm space-y-6 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4">
                 {selectedCategory === 'Jadwal' && (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      <select value={schSessionFilter} onChange={e => { setSchSessionFilter(e.target.value); setSchClassFilter('Semua'); }} className="p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none border border-slate-100">
                         <option value="Semua">Semua Sesi</option>
                         {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={schClassFilter} onChange={e => setSchClassFilter(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none border border-slate-100">
                         <option value="Semua">Semua Unit</option>
                         {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                 )}
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input type="text" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl text-[11px] font-bold outline-none shadow-inner" />
                 </div>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                   <thead className="border-b-2 border-slate-50">
                      <tr>
                        {selectedCategory === 'Pembina' ? (
                          <>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Unit / Kelas</th>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Wali Kelas</th>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Musyrif/ah</th>
                          </>
                        ) : (
                          <>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Identitas</th>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Unit / Kelas</th>
                            <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Detail</th>
                          </>
                        )}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {selectedCategory === 'Guru' && data.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                           <td className="py-6 pr-4">
                              <p className="font-black uppercase text-[12px] text-slate-800">{item.name}</p>
                              <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">{item.subject}</p>
                           </td>
                           <td className="py-6 pr-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                 {data.schedules.filter(s => isTeacherMatch(item.name, s.teacherName))
                                   .map((s, si) => <span key={si} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[8px] font-black">{s.class}</span>)}
                              </div>
                           </td>
                           <td className="py-6"><p className="text-[10px] font-bold text-slate-400">{item.phone || '-'}</p></td>
                        </tr>
                      ))}

                      {selectedCategory === 'Pembina' && pembinaData.filter(p => p.class.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                           <td className="py-6 pr-4"><span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase">{item.class}</span></td>
                           <td className="py-6 pr-4"><p className="font-black uppercase text-[11px] text-slate-800">{item.walas}</p></td>
                           <td className="py-6 pr-4"><p className="font-black uppercase text-[11px] text-slate-600">{item.musyrif}</p></td>
                        </tr>
                      ))}

                      {selectedCategory === 'Siswa' && data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                           <td className="py-6 pr-4">
                              <p className="font-black uppercase text-[12px] text-slate-800 truncate">{item.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{item.nis || '-'} • {item.gender}</p>
                           </td>
                           <td className="py-6 pr-4"><span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase">{item.formalClass}</span></td>
                           <td className="py-6"><p className="text-[8px] font-bold text-slate-400 uppercase truncate">Sesi: {Object.keys(item.sessionClasses || {}).join(', ') || 'Formal Only'}</p></td>
                        </tr>
                      ))}

                      {selectedCategory === 'Jadwal' && data.schedules.filter(s => {
                        const matchSess = schSessionFilter === 'Semua' || normalizeSessionName(s.sessionType) === schSessionFilter;
                        const matchCls = schClassFilter === 'Semua' || s.class === schClassFilter;
                        const matchSearch = s.subject.toLowerCase().includes(searchTerm.toLowerCase()) || s.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
                        return matchSess && matchCls && matchSearch;
                      }).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                           <td className="py-6 pr-4">
                              <p className="font-black uppercase text-[12px] text-slate-800">{item.subject}</p>
                              <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1 truncate">{item.teacherName}</p>
                           </td>
                           <td className="py-6 pr-4">
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black w-fit uppercase">{item.class}</span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase">{item.sessionType}</span>
                              </div>
                           </td>
                           <td className="py-6"><p className="text-[9px] font-black uppercase text-slate-500">{item.day} • {item.time}</p></td>
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
