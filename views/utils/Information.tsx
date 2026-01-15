
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../../types.ts';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2, AlertCircle, Bookmark, UserPlus, GraduationCap, LayoutGrid, Award, FileDown, BookOpen, Phone, Mail
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { downloadCSV } from './csvExport.ts';
import { isTeacherMatch } from './nameMatchers.ts';

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
  const [rulesTab, setRulesTab] = useState<'pelanggaran' | 'prestasi'>('pelanggaran');
  
  // States for ORSAM/ORKLAS Filters
  const [orgGenderFilter, setOrgGenderFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [orgLevelFilter, setOrgLevelFilter] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [orgClassFilter, setOrgClassFilter] = useState('Semua');

  // States for Schedule Filters
  const [schDayFilter, setSchDayFilter] = useState('Semua');
  const [schSessionFilter, setSchSessionFilter] = useState('Semua');
  const [schClassFilter, setSchClassFilter] = useState('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  
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

  const filteredSchedules = useMemo(() => {
    return data.schedules.filter(s => {
      const matchDay = schDayFilter === 'Semua' || s.day === schDayFilter;
      const matchSess = schSessionFilter === 'Semua' || s.sessionType === schSessionFilter;
      const matchCls = schClassFilter === 'Semua' || s.class === schClassFilter;
      const matchSearch = s.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.assistantTeacherName || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchDay && matchSess && matchCls && matchSearch;
    });
  }, [data.schedules, schDayFilter, schSessionFilter, schClassFilter, searchTerm]);

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
             teachingClasses: []
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
            homeroomTeacherName: getVal(values, ['WALAS', 'WALIKELAS', 'HOMEROOM', 'WALI', 'MUSYRIF', 'MUSYRIFAH']),
            class: getVal(values, ['UNIT', 'KELAS']),
            sessionType: getVal(values, ['SESI', 'JENISKEGIATAN']) || 'Madrasah',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            gender: getVal(values, ['GENDER', 'JK']) || 'Putra'
          };
        }

        if (type === 'Peraturan') {
          return {
            label: getVal(values, ['DESKRIPSI', 'LABEL', 'PERATURAN', 'DESKRIPSIPERATURAN']),
            points: Number(getVal(values, ['POIN', 'POINT', 'SKOR'])) || 0,
            category: getVal(values, ['KATEGORI', 'BIDANG']) as ViolationCategory,
            type: getVal(values, ['TIPE', 'JENIS']) || 'Pelanggaran'
          };
        }

        return values;
      }).filter(item => {
        if (typeof item === 'object' && 'name' in item) return !!item.name;
        if (type === 'Peraturan' && typeof item === 'object') return !!(item as any).label;
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
    else if (type === 'Guru') content = "Nama,No HP,Email,Mapel Utama\nUstadz Zulkifli,081234,zulkifli@gmail.com,Nahwu Shorof";
    else if (type === 'Jadwal') {
      content = "Hari,Waktu,Mapel,Guru Utama,Guru Asisten,Wali Kelas,Unit,Sesi,Tingkat,Gender\n";
      content += "Senin,07:30 - 09:00,Nahwu,Guru A,Guru B,Guru E,7A,Madrasah,MTs,Putra\n";
      content += "Senin,07:30 - 09:00,Shorof,Guru B,,Guru C,7B,Madrasah,MTs,Putra\n";
      content += "Senin,13:00 - 14:30,Alfiyah J2,Guru X,Guru D,Guru E,10A,Hadis,MA,Putra";
    }
    else if (type === 'ORSAM' || type === 'ORKLAS') content = "Nama,NIS,Jabatan,Divisi,Kelas,Gender,Tingkat\nZaid Al-Khair,2024002,Ketua,Pusat,10-IPA,Putra,MA";
    else if (type === 'Peraturan') content = "Deskripsi Peraturan,Poin,Kategori,Tipe\nTerlambat Masuk Kelas,10,Kedisiplinan,Pelanggaran\nMenjuarai Lomba Pidato,50,Akademik,Prestasi";
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_${type}_Mahasina.csv`;
    a.click();
  };

  const handleExportCurrentView = () => {
    if (!selectedCategory) return;
    let exportData: any[] = [];
    let filename = `Data_${selectedCategory}_Export`;

    if (selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') {
      exportData = selectedCategory === 'ORSAM' ? data.orsam : data.orklas;
    } else if (selectedCategory === 'Siswa') {
      exportData = data.students.map(s => ({
        NIS: s.nis,
        Nama: s.name,
        Gender: s.gender,
        Tingkat: s.level,
        "Unit Formal": s.formalClass,
        [`Sesi ${studentSessionFilter}`]: studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter] || '-'
      }));
    } else if (selectedCategory === 'Guru') {
      exportData = data.teachers.map(t => {
        const assignments = data.schedules.filter(s => isTeacherMatch(t.name, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName));
        const walas = assignments.filter(s => s.homeroomTeacherName === t.name).map(s => s.class);
        const musyrif = assignments.filter(s => s.assistantTeacherName === t.name).map(s => s.class);
        return {
          "Nama Guru": t.name,
          "No HP": t.phone,
          "Email": t.email,
          "Mapel Utama": t.subject,
          "Wali Kelas": walas.join(', ') || '-',
          "Musyrif/ah": musyrif.join(', ') || '-'
        };
      });
    } else if (selectedCategory === 'Jadwal') {
      exportData = filteredSchedules;
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
             { id: 'Guru', label: 'Data Guru', desc: 'Kontak & Tugas Walas/Musyrif', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Multi-Sesi & Kelas Formal', icon: <Users size={28}/>, color: 'blue' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Guru Utama & Asisten', icon: <Calendar size={28}/>, color: 'indigo' },
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

           {selectedCategory === 'Jadwal' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Hari</label>
                      <select value={schDayFilter} onChange={e => setSchDayFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                         <option value="Semua">Semua Hari</option>
                         {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                      <select value={schSessionFilter} onChange={e => setSchSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                         <option value="Semua">Semua Sesi</option>
                         {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit Kelas</label>
                      <select value={schClassFilter} onChange={e => setSchClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                         <option value="Semua">Semua Kelas</option>
                         {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cari Guru/Mapel</label>
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
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Waktu & Sesi</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Mata Pelajaran</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Guru Utama</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Guru Asisten</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 text-center">Unit / Target</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredSchedules.map(sch => (
                           <tr key={sch.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-6">
                                <p className="font-black uppercase text-[10px] text-slate-800">{sch.day} {sch.time}</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sch.sessionType}</p>
                              </td>
                              <td className="py-6">
                                <p className="font-black text-slate-800 text-[10px] uppercase">{sch.subject}</p>
                              </td>
                              <td className="py-6">
                                <p className="font-black text-emerald-800 text-[10px] uppercase">{sch.teacherName}</p>
                              </td>
                              <td className="py-6">
                                <p className="text-[10px] font-black uppercase text-slate-400">{sch.assistantTeacherName || '-'}</p>
                              </td>
                              <td className="py-6 text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase">{sch.class}</span>
                                  <div className="flex gap-1">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase">{sch.level}</span>
                                    <span className={`text-[7px] font-bold uppercase ${sch.gender === 'Putra' ? 'text-blue-400' : 'text-pink-400'}`}>{sch.gender}</span>
                                  </div>
                                </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   {filteredSchedules.length === 0 && (
                     <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Tidak ada jadwal yang sesuai filter</div>
                   )}
                </div>
             </div>
           )}

           {selectedCategory === 'Guru' && (
              <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Ustadz/ah</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mengajar Di</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tugas Khusus</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kontak & Email</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => {
                        const assignments = data.schedules.filter(s => isTeacherMatch(item.name, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName));
                        
                        const teachingDetails = Array.from(new Set(assignments.filter(s => s.teacherName === item.name).map(a => `${a.subject} (${a.class})`))).join(' • ');
                        const walasClasses = Array.from(new Set(assignments.filter(s => s.homeroomTeacherName === item.name).map(a => a.class)));
                        const musyrifClasses = Array.from(new Set(assignments.filter(s => s.assistantTeacherName === item.name).map(a => a.class)));
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-all">
                             <td className="py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-[10px] shadow-inner">{item.name[0]}</div>
                                   <div>
                                      <p className="font-black uppercase text-xs text-slate-800">{item.name}</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.subject || 'Mapel Umum'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6 max-w-[200px]">
                                <div className="flex items-center gap-2 text-slate-600">
                                   <BookOpen size={14} className="shrink-0 text-emerald-600"/>
                                   <p className="text-[9px] font-bold uppercase leading-relaxed line-clamp-2">{teachingDetails || 'Belum Ada Jadwal KBM'}</p>
                                </div>
                             </td>
                             <td className="py-6">
                                <div className="space-y-1">
                                   {walasClasses.length > 0 && (
                                     <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[8px] font-black uppercase">Walas: {walasClasses.join(', ')}</span>
                                     </div>
                                   )}
                                   {musyrifClasses.length > 0 && (
                                     <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[8px] font-black uppercase">Musyrif/ah: {musyrifClasses.join(', ')}</span>
                                     </div>
                                   )}
                                   {walasClasses.length === 0 && musyrifClasses.length === 0 && <span className="text-[8px] font-black text-slate-300 uppercase italic">Tidak Ada Tugas Khusus</span>}
                                </div>
                             </td>
                             <td className="py-6">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 cursor-pointer">
                                      <Phone size={12}/>
                                      <p className="text-[9px] font-black uppercase">{item.phone || '-'}</p>
                                   </div>
                                   <div className="flex items-center gap-2 text-slate-400">
                                      <Mail size={12}/>
                                      <p className="text-[9px] font-bold lowercase truncate max-w-[120px]">{item.email || '-'}</p>
                                   </div>
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
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
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
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

           {selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS' && (
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
                         { (selectedCategory === 'ORSAM' ? data.orsam : data.orklas).filter(item => {
                             const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                             const matchGender = (isGenderRestricted ? item.gender === targetGender : (orgGenderFilter === 'Semua' || item.gender === orgGenderFilter));
                             const matchLvl = orgLevelFilter === 'Semua' || item.level === orgLevelFilter;
                             const matchCls = orgClassFilter === 'Semua' || item.class === orgClassFilter;
                             return matchSearch && matchGender && (selectedCategory === 'ORSAM' ? true : matchLvl && matchCls);
                         }).map((item, idx) => (
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
                </div>
             </div>
           )}

           {selectedCategory === 'Peraturan' && (
              <div className="space-y-6">
                 <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit shadow-inner">
                    <button 
                      onClick={() => setRulesTab('pelanggaran')} 
                      className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${rulesTab === 'pelanggaran' ? 'bg-white text-emerald-950 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Pelanggaran
                    </button>
                    <button 
                      onClick={() => setRulesTab('prestasi')} 
                      className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${rulesTab === 'prestasi' ? 'bg-white text-emerald-950 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Prestasi
                    </button>
                 </div>

                 <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b-2 border-slate-50">
                             <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Deskripsi Peraturan</th>
                             <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Kategori</th>
                             <th className="pb-6 text-right text-[10px] font-black uppercase text-slate-400">Poin</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {(rulesTab === 'pelanggaran' ? data.violationTemplates : data.achievementTemplates).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                               <td className="py-6">
                                  <p className="text-sm font-black uppercase text-slate-800 leading-tight">{item.label}</p>
                               </td>
                               <td className="py-6">
                                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.category}</span>
                               </td>
                               <td className="py-6 text-right">
                                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${rulesTab === 'pelanggaran' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {item.points} PT
                                  </span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Information;
