
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../../types.ts';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2, AlertCircle, Bookmark, UserPlus, GraduationCap, LayoutGrid, Award, FileDown, BookOpen, Phone, Mail,
  User
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { downloadCSV } from './csvExport.ts';
import { isTeacherMatch } from './nameMatchers.ts';
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
  onResetData?: (type: string) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  const [rulesTab, setRulesTab] = useState<'pelanggaran' | 'prestasi'>('pelanggaran');
  
  const [orgGenderFilter, setOrgGenderFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [orgLevelFilter, setOrgLevelFilter] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [orgClassFilter, setOrgClassFilter] = useState('Semua');

  const [schDayFilter, setSchDayFilter] = useState('Semua');
  const [schSessionFilter, setSchSessionFilter] = useState('Semua');
  const [schClassFilter, setSchClassFilter] = useState('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const dynamicSessions = useMemo(() => {
    const sessSet = new Set<string>(['Madrasah', 'Hadis-Aswaja', 'Kitab Kuning', 'Al-Quran']);
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
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert("File kosong atau tidak memiliki baris data.");
        return;
      }

      const rawHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim());
      const headersMap: Record<string, number> = {};
      
      rawHeaders.forEach((h, i) => {
        const cleanHeader = h.toUpperCase().replace(/[^A-Z0-9]/g, '');
        headersMap[cleanHeader] = i;
      });

      const getVal = (rowArr: any[], possibleNames: string[]) => {
        for (const name of possibleNames) {
          const cleanSearchName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const idx = headersMap[cleanSearchName];
          if (idx !== undefined && rowArr[idx] !== undefined) {
            return String(rowArr[idx]).trim();
          }
        }
        return '';
      };

      const newData = jsonData.slice(1).map((row: any, idx) => {
        if (!row || row.length === 0) return null;

        if (type === 'ORSAM' || type === 'ORKLAS') {
          return {
            id: `org-${Date.now()}-${idx}`,
            name: getVal(row, ['NAMA', 'NAMALENGKAP', 'NAMASANTRI', 'SANTRI']),
            nis: getVal(row, ['NIS', 'NISN']),
            position: getVal(row, ['JABATAN', 'POSISI', 'TUGAS']),
            division: getVal(row, ['DIVISI', 'BIDANG', 'BAGIAN']),
            class: getVal(row, ['KELAS', 'UNIT']),
            gender: getVal(row, ['GENDER', 'JK', 'JENISKELAMIN']) || 'Putra',
            level: getVal(row, ['TINGKAT', 'JENJANG', 'UNIT']) || 'MTs',
            orgType: type
          };
        }
        
        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          rawHeaders.forEach((h, i) => {
            const hUpper = h.toUpperCase();
            if (hUpper.includes('KELAS') && !hUpper.includes('FORMAL') && !hUpper.includes('MADRASAH')) {
              const sessionName = h.replace(/Kelas/i, '').trim();
              const val = String(row[i] || '').trim();
              if (val) sessionClasses[sessionName] = val;
            }
          });
          return {
            id: `std-${Date.now()}-${idx}`,
            nis: getVal(row, ['NIS', 'NISN', 'NOMORINDUK']),
            name: getVal(row, ['NAMA', 'NAMALENGKAP', 'NAMASANTRI']),
            gender: getVal(row, ['GENDER', 'JENISKELAMIN', 'JK']) || 'Putra',
            level: getVal(row, ['TINGKAT', 'JENJANG', 'UNIT']) || 'MTs',
            formalClass: getVal(row, ['KELASMADRASAHFORMAL', 'KELASFORMAL', 'KELASMADRASAH', 'KELAS', 'UNIT']),
            sessionClasses
          };
        }
        
        if (type === 'Guru') {
           return {
             id: `t-${Date.now()}-${idx}`,
             name: getVal(row, ['NAMA', 'NAMAGURU', 'USTADZ', 'USTADZAH', 'GURU']),
             subject: getVal(row, ['MAPEL', 'MATAPELAJARAN', 'MAPELUTAMA', 'PELAJARAN']),
             phone: getVal(row, ['NOHP', 'WHATSAPP', 'TELEPON', 'WA']),
             email: getVal(row, ['EMAIL', 'SUREL']),
             teachingClasses: []
           };
        }

        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: getVal(row, ['HARI', 'DAY']) || 'Senin',
            time: getVal(row, ['WAKTU', 'JAM', 'JAMPELAJARAN', 'WAKTUKBM', 'TIME']),
            subject: getVal(row, ['MAPEL', 'MATAPELAJARAN', 'PELAJARAN', 'SUBJECT']),
            teacherName: getVal(row, ['GURUUTAMA', 'GURU', 'USTADZ', 'USTADZAH', 'PENGAJAR']),
            assistantTeacherName: getVal(row, ['GURUASISTEN', 'ASISTEN', 'ASISTENGURU', 'GURU2', 'ASSISTANT']),
            homeroomTeacherName: getVal(row, ['WALIKELAS', 'WALAS', 'HOMEROOM', 'WALI']),
            class: getVal(row, ['UNIT', 'KELAS', 'CLASS', 'ROOM']),
            sessionType: getVal(row, ['SESI', 'JENISKEGIATAN', 'KEGIATAN', 'SESSION']) || 'Madrasah',
            level: getVal(row, ['TINGKAT', 'JENJANG', 'UNITLEVEL', 'LEVEL']) || 'MTs',
            gender: getVal(row, ['GENDER', 'JK', 'PUTRAPUTRI', 'SEX']) || 'Putra'
          };
        }

        if (type === 'Peraturan') {
          return {
            label: getVal(row, ['DESKRIPSI', 'LABEL', 'PERATURAN', 'NAMA', 'RULE']),
            points: Number(getVal(row, ['POIN', 'POINT', 'SKOR', 'NILAI'])) || 0,
            category: getVal(row, ['KATEGORI', 'BIDANG', 'JENIS', 'CATEGORY']) as ViolationCategory,
            type: getVal(row, ['TIPE', 'JENISLAPORAN', 'TYPE']) || 'Pelanggaran'
          };
        }
        return null;
      }).filter(item => {
        if (!item) return false;
        const obj = item as any;
        if (type === 'Siswa') return !!obj.name;
        if (type === 'Guru') return !!obj.name;
        if (type === 'Jadwal') return !!obj.subject && !!obj.teacherName;
        return true;
      });

      if (confirm(`Berhasil membaca ${newData.length} baris data ${type}. Sinkronisasi ke sistem?`)) {
        onUpdateData(type, newData);
        alert("Sinkronisasi Berhasil!");
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = (type: string) => {
    let headers = [];
    let example = [];

    if (type === 'Siswa') {
      headers = ["NIS", "Nama", "Gender", "Tingkat", "Unit Formal", "Kelas Al-Quran", "Kelas Kitab Kuning"];
      example = ["2024001", "Ahmad Santri", "Putra", "MTs", "7A", "Yanbu'a 1", "Safinah"];
    } else if (type === 'Guru') {
      headers = ["Nama", "No HP", "Email", "Mapel Utama"];
      example = ["Ustadz Ahmad", "081234567", "ahmad@gmail.com", "Nahwu"];
    } else if (type === 'Jadwal') {
      headers = ["Hari", "Waktu", "Mapel", "Guru Utama", "Guru Asisten", "Wali Kelas", "Unit", "Sesi", "Tingkat", "Gender"];
      example = ["Senin", "07:30 - 09:00", "Fiqih", "Guru A", "Guru B", "Guru C", "7A", "Madrasah", "MTs", "Putra"];
    } else if (type === 'ORSAM' || type === 'ORKLAS') {
      headers = ["Nama", "NIS", "Jabatan", "Divisi", "Kelas", "Gender", "Tingkat"];
      example = ["Zaid", "2024002", "Ketua", "Kebersihan", "10A", "Putra", "MA"];
    } else {
      headers = ["Deskripsi", "Poin", "Kategori", "Tipe"];
      example = ["Terlambat", "10", "Kedisiplinan", "Pelanggaran"];
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `Template_Impor_${type}_Mahasina.xlsx`);
  };

  const handleExportCurrentView = () => {
    if (!selectedCategory) return;
    let exportData: any[] = [];
    if (selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') {
      exportData = selectedCategory === 'ORSAM' ? data.orsam : data.orklas;
    } else if (selectedCategory === 'Siswa') {
      exportData = data.students.map(s => ({
        NIS: s.nis, Nama: s.name, Gender: s.gender, Tingkat: s.level, "Unit Formal": s.formalClass,
        [`Sesi ${studentSessionFilter}`]: studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter] || '-'
      }));
    } else if (selectedCategory === 'Guru') {
      exportData = data.teachers.map(t => {
        const assignments = data.schedules.filter(s => isTeacherMatch(t.name, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName));
        return {
          "Nama Guru": t.name, "No HP": t.phone, "Email": t.email, "Mapel Utama": t.subject,
          "Wali Kelas": Array.from(new Set(assignments.filter(s => s.homeroomTeacherName === t.name).map(s => s.class))).join(', ') || '-',
          "Musyrif/ah": Array.from(new Set(assignments.filter(s => s.assistantTeacherName === t.name).map(s => s.class))).join(', ') || '-'
        };
      });
    } else if (selectedCategory === 'Jadwal') {
      exportData = filteredSchedules;
    }

    if (exportData.length === 0) { alert("Tidak ada data."); return; }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `Export_${selectedCategory}_Mahasina.xlsx`);
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
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Impor Excel Akurat</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 <button onClick={handleExportCurrentView} className="px-6 py-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100 transition-all shadow-sm">
                    <FileDown size={16}/> Ekspor Excel
                 </button>
                 {isSuperAdmin && (
                   <>
                     <button onClick={() => downloadTemplate(selectedCategory)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                        <Download size={16}/> Template Excel
                     </button>
                     <label className="px-6 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg">
                        <Upload size={16}/> Impor Excel/CSV
                        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
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
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Guru Asisten / Walas</th>
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
                                <div className="space-y-1">
                                   {sch.assistantTeacherName && <p className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1"><User size={10} className="text-slate-300"/> AS: {sch.assistantTeacherName}</p>}
                                   {sch.homeroomTeacherName && <p className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1"><GraduationCap size={10} className="text-blue-300"/> WL: {sch.homeroomTeacherName}</p>}
                                   {!sch.assistantTeacherName && !sch.homeroomTeacherName && <p className="text-[10px] text-slate-300">-</p>}
                                </div>
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
                     <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Data tidak tersedia atau filter belum sesuai</div>
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
                                   {walasClasses.length > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[8px] font-black uppercase block w-fit">Walas: {walasClasses.join(', ')}</span>}
                                   {musyrifClasses.length > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[8px] font-black uppercase block w-fit">Musyrif/ah: {musyrifClasses.join(', ')}</span>}
                                   {walasClasses.length === 0 && musyrifClasses.length === 0 && <span className="text-[8px] font-black text-slate-300 uppercase italic">Tidak Ada Tugas Khusus</span>}
                                </div>
                             </td>
                             <td className="py-6">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-slate-400">
                                      <Phone size={12}/><p className="text-[9px] font-black uppercase">{item.phone || '-'}</p>
                                   </div>
                                   <div className="flex items-center gap-2 text-slate-400">
                                      <Mail size={12}/><p className="text-[9px] font-bold lowercase truncate max-w-[120px]">{item.email || '-'}</p>
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

           {selectedCategory === 'Peraturan' && (
              <div className="space-y-6">
                 <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit shadow-inner">
                    <button onClick={() => setRulesTab('pelanggaran')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${rulesTab === 'pelanggaran' ? 'bg-white text-emerald-950 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Pelanggaran</button>
                    <button onClick={() => setRulesTab('prestasi')} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${rulesTab === 'prestasi' ? 'bg-white text-emerald-950 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Prestasi</button>
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
                               <td className="py-6"><p className="text-sm font-black uppercase text-slate-800 leading-tight">{item.label}</p></td>
                               <td className="py-6"><span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.category}</span></td>
                               <td className="py-6 text-right"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${rulesTab === 'pelanggaran' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.points} PT</span></td>
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
