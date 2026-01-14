
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../../types.ts';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2, AlertCircle, Bookmark, UserPlus, GraduationCap, LayoutGrid, Award, FileDown
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { downloadCSV } from './csvExport.ts';

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
  onResetData?: (type: string) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  
  // States for ORSAM/ORKLAS Filters
  const [orgGenderFilter, setOrgGenderFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [orgLevelFilter, setOrgLevelFilter] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [orgClassFilter, setOrgClassFilter] = useState('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  
  // Proteksi Gender untuk Petugas Santri
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const dynamicSessions = useMemo(() => {
    const sessSet = new Set<string>(['Madrasah']);
    data.students.forEach(s => {
      if (s.sessionClasses) {
        Object.keys(s.sessionClasses).forEach(key => sessSet.add(key));
      }
    });
    return Array.from(sessSet).sort();
  }, [data.students]);

  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    data.students.forEach(s => {
      if (s.formalClass) cls.add(s.formalClass);
    });
    return Array.from(cls).sort();
  }, [data.students]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result as string;
      text = text.replace(/^\uFEFF/, '');
      
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
      if (lines.length < 2) return;

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      const rawHeaders = firstLine.split(delimiter).map(h => h.replace(/["\r\n]/g, '').trim());
      const headersMap: Record<string, number> = {};
      rawHeaders.forEach((h, i) => headersMap[h.toUpperCase().replace(/\s+/g, '')] = i);

      const getVal = (rowArr: string[], possibleNames: string[]) => {
        for (const name of possibleNames) {
          const idx = headersMap[name.toUpperCase().replace(/\s+/g, '')];
          if (idx !== undefined) return rowArr[idx]?.replace(/["\r\n]/g, '').trim() || '';
        }
        return '';
      };

      const newData = lines.slice(1).map((line, idx) => {
        const values = line.split(delimiter).map(v => v.replace(/^"|$/g, '').trim());
        
        if (type === 'ORSAM' || type === 'ORKLAS') {
          return {
            id: `org-${Date.now()}-${idx}`,
            name: getVal(values, ['NAMA', 'NAMALENGKAP']),
            nis: getVal(values, ['NIS', 'NISN']),
            position: getVal(values, ['JABATAN', 'POSISI']),
            division: getVal(values, ['DIVISI', 'BIDANG', 'BAGIAN']),
            class: getVal(values, ['KELAS', 'UNIT']),
            gender: getVal(values, ['GENDER', 'JK', 'JENISKELAMIN']) || 'Putra',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            orgType: type
          };
        }
        
        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          rawHeaders.forEach((h, i) => {
            const hUpper = h.toUpperCase();
            if (hUpper.startsWith('KELAS ') && hUpper !== 'KELAS MADRASAH (FORMAL)' && hUpper !== 'KELAS MADRASAH') {
              const sessionName = h.replace(/Kelas /i, '').trim();
              const val = values[i]?.trim();
              if (val) sessionClasses[sessionName] = val;
            }
          });
          return {
            id: `std-${Date.now()}-${idx}`,
            nis: getVal(values, ['NIS', 'NISN', 'NOMORINDUK']),
            name: getVal(values, ['NAMA', 'NAMALENGKAP', 'NAMASANTRI']),
            gender: getVal(values, ['GENDER', 'JENISKELAMIN', 'JK']) || 'Putra',
            level: getVal(values, ['TINGKAT', 'JENJANG', 'UNIT']) || 'MTs',
            formalClass: getVal(values, ['KELASMADRASAH(FORMAL)', 'KELASFORMAL', 'KELASMADRASAH', 'KELAS']),
            sessionClasses
          };
        }
        
        if (type === 'Guru') {
           return {
             id: `t-${Date.now()}-${idx}`,
             name: getVal(values, ['NAMA', 'NAMAGURU']),
             subject: getVal(values, ['MAPEL', 'MATAPELAJARAN']),
             phone: getVal(values, ['NOHP', 'WHATSAPP']),
             email: getVal(values, ['EMAIL']),
             teachingClasses: (getVal(values, ['MENGAJARDIKELAS', 'KELAS']) || '').split(';').map(s => s.trim())
           };
        }

        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: getVal(values, ['HARI']) || 'Senin',
            time: getVal(values, ['WAKTU', 'JAM']),
            subject: getVal(values, ['MAPEL', 'MATAPELAJARAN']),
            teacherName: getVal(values, ['GURU', 'USTADZ', 'USTADZAH', 'GURUUTAMA']),
            assistantTeacherName: getVal(values, ['ASISTEN', 'GURUASISTEN', 'ASISTENGURU', 'GURU2']),
            homeroomTeacherName: getVal(values, ['WALAS', 'WALIKELAS', 'HOMEROOM', 'WALI']),
            class: getVal(values, ['UNIT', 'KELAS']),
            sessionType: getVal(values, ['SESI', 'JENISKEGIATAN']) || 'Madrasah',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            gender: getVal(values, ['GENDER', 'JK']) || 'Putra'
          };
        }

        return values;
      }).filter(item => {
        if (typeof item === 'object' && 'name' in item) return !!item.name;
        return true;
      });

      if (confirm(`Impor ${newData.length} baris data ${type}?`)) {
        onUpdateData(type, newData);
        alert("Sinkronisasi Berhasil!");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (type: string) => {
    let content = "";
    if (type === 'Siswa') content = "NIS,Nama,Gender,Tingkat,Kelas Madrasah (Formal),Kelas Al-Quran,Kelas Kitab Kuning\n2024001,Ahmad Santri,Putra,MTs,7A,Yanbu'a 3,Safinatun Najah";
    else if (type === 'Guru') content = "Nama,Mapel,No HP,Email,Mengajar Di Kelas\nUstadz Zulkifli,Nahwu,081234,zulkifli@gmail.com,7A;7B;8A";
    else if (type === 'Jadwal') content = "Hari,Waktu,Mapel,Guru Utama,Guru Asisten,Wali Kelas,Unit,Sesi,Tingkat,Gender\nSenin,07:30 - 09:00,Nahwu,Ustadz Zulkifli,Ustadz Ahmad,Ustadzah Sarah,7A,Madrasah,MTs,Putra";
    else if (type === 'ORSAM' || type === 'ORKLAS') content = "Nama,NIS,Jabatan,Divisi,Kelas,Gender,Tingkat\nZaid Al-Khair,2024002,Ketua,Pusat,10-IPA,Putra,MA";
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_${type}_Mahasina.csv`;
    a.click();
  };

  const filteredOrgs = useMemo(() => {
    const list = selectedCategory === 'ORSAM' ? data.orsam : data.orklas;
    return list.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGender = (isGenderRestricted ? item.gender === targetGender : (orgGenderFilter === 'Semua' || item.gender === orgGenderFilter));
      const matchLvl = orgLevelFilter === 'Semua' || item.level === orgLevelFilter;
      const matchCls = orgClassFilter === 'Semua' || item.class === orgClassFilter;
      
      if (selectedCategory === 'ORSAM') return matchSearch && matchGender;
      return matchSearch && matchGender && matchLvl && matchCls;
    });
  }, [selectedCategory, data, searchTerm, orgGenderFilter, orgLevelFilter, orgClassFilter, isGenderRestricted, targetGender]);

  const handleExportCurrentView = () => {
    if (!selectedCategory) return;
    
    let exportData: any[] = [];
    let filename = `Data_${selectedCategory}_Export`;

    if (selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') {
      exportData = filteredOrgs;
    } else if (selectedCategory === 'Siswa') {
      exportData = data.students.filter(s => 
        (isGenderRestricted ? s.gender === targetGender : true) && 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(s => ({
        NIS: s.nis,
        Nama: s.name,
        Gender: s.gender,
        Tingkat: s.level,
        "Unit Formal": s.formalClass,
        [`Sesi ${studentSessionFilter}`]: studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter] || '-'
      }));
    } else if (selectedCategory === 'Guru') {
      exportData = data.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    } else if (selectedCategory === 'Jadwal') {
      exportData = data.schedules;
    } else if (selectedCategory === 'Peraturan') {
      exportData = [...data.violationTemplates, ...data.achievementTemplates];
    }

    if (exportData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    downloadCSV(exportData, filename);
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto animate-in fade-in duration-700">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { id: 'Guru', label: 'Data Guru', desc: 'Identitas & Email Login', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Multi-Sesi & Kelas Formal', icon: <Users size={28}/>, color: 'blue' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Guru Utama & Wali Kelas', icon: <Calendar size={28}/>, color: 'indigo' },
             { id: 'ORSAM', label: 'Data ORSAM', desc: 'Organisasi Santri Mahasina', icon: <Shield size={28}/>, color: 'orange' },
             { id: 'ORKLAS', label: 'Data ORKLAS', desc: 'Pengurus Kelas Santri', icon: <LayoutGrid size={28}/>, color: 'cyan' },
             { id: 'Peraturan', label: 'Katalog Poin', desc: 'Pelanggaran & Prestasi', icon: <Award size={28}/>, color: 'red' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl transition-all group flex flex-col gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-8 rounded-[3rem] border shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                 <button onClick={() => {setSelectedCategory(null); setSearchTerm('');}} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><ArrowLeft size={24}/></button>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{selectedCategory}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Master Data Terpusat</p>
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 <button onClick={handleExportCurrentView} className="px-6 py-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm">
                    <FileDown size={16}/> Ekspor Data
                 </button>
                 
                 {isSuperAdmin && (
                   <>
                     <button onClick={() => downloadTemplate(selectedCategory)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                        <Download size={16}/> Template
                     </button>
                     <label className="px-6 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg">
                        <Upload size={16}/> Impor CSV
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
                     </label>
                   </>
                 )}
              </div>
           </div>

           {(selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Gender</label>
                      <select disabled={isGenderRestricted} value={isGenderRestricted ? targetGender : orgGenderFilter} onChange={e => setOrgGenderFilter(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner disabled:opacity-50">
                         <option value="Semua">Semua</option>
                         <option value="Putra">Putra</option>
                         <option value="Putri">Putri</option>
                      </select>
                   </div>
                   {selectedCategory === 'ORKLAS' && (
                     <>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
                          <select value={orgLevelFilter} onChange={e => setOrgLevelFilter(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                             <option value="Semua">Semua</option>
                             <option value="MTs">MTs</option>
                             <option value="MA">MA</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit Kelas</label>
                          <select value={orgClassFilter} onChange={e => setOrgClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                             <option value="Semua">Semua Kelas</option>
                             {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                     </>
                   )}
                   <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cari Pengurus</label>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                         <input type="text" placeholder="Ketik nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none shadow-inner" />
                      </div>
                   </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Pengurus</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Jabatan</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Bidang / Kelas</th>
                            <th className="pb-6 text-center text-[10px] font-black uppercase text-slate-400">Gender</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredOrgs.map((item, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             <td className="py-6">
                                 <p className="text-sm font-black uppercase text-slate-800">{item.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.nis}</p>
                             </td>
                             <td className="py-6">
                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{item.position}</span>
                             </td>
                             <td className="py-6">
                                 <p className="text-[11px] font-black text-slate-700 uppercase">{item.division || item.class}</p>
                                 {selectedCategory === 'ORKLAS' && <p className="text-[8px] font-bold text-slate-400 uppercase">{item.level}</p>}
                             </td>
                             <td className="py-6 text-center">
                                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.gender === 'Putra' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{item.gender}</span>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   {filteredOrgs.length === 0 && (
                     <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Data tidak ditemukan</div>
                   )}
                </div>
             </div>
           )}

           {selectedCategory === 'Siswa' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Sesi</label>
                      <select value={studentSessionFilter} onChange={e => setStudentSessionFilter(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase shadow-inner">
                         {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari Santri</label>
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-[11px]" placeholder="Ketik nama..." />
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Identitas Santri</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Unit Formal</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Sesi: {studentSessionFilter}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {data.students.filter(s => (isGenderRestricted ? s.gender === targetGender : true) && s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                           <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                             <td className="py-6">
                                 <p className="text-sm font-black uppercase text-slate-800">{s.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.nis} • {s.gender}</p>
                             </td>
                             <td className="py-6">
                                 <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{s.formalClass}</span>
                             </td>
                             <td className="py-6">
                                 { (studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter]) ? (
                                   <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-black uppercase">
                                     {studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter]}
                                   </span>
                                 ) : '-'}
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {selectedCategory === 'Jadwal' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Waktu</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Musyrif/Guru</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Mapel</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Unit</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.schedules.map(sch => (
                        <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                           <td className="py-6 font-black uppercase text-[10px]">{sch.day} {sch.time}</td>
                           <td className="py-6 font-black text-emerald-800 text-[10px] uppercase">{sch.teacherName}</td>
                           <td className="py-6 font-black text-slate-800 text-[10px] uppercase">{sch.subject}</td>
                           <td className="py-6 font-black text-slate-400 text-[10px] uppercase">{sch.class}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}

           { (selectedCategory === 'Guru' || selectedCategory === 'Peraturan') && (
              <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <tbody className="divide-y divide-slate-50">
                      {(selectedCategory === 'Guru' ? data.teachers : [...data.violationTemplates, ...data.achievementTemplates]).map((item: any, idx) => (
                        <tr key={idx}>
                           <td className="py-6 font-black uppercase text-xs">{item.name || item.label}</td>
                           <td className="py-6 text-[10px] text-slate-400 uppercase font-bold">{item.subject || item.category}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Information;
