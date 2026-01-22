
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../../types.ts';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2, AlertCircle, Bookmark, UserPlus, GraduationCap, LayoutGrid, Award, FileDown, BookOpen, Phone, Mail,
  User, Heart, Star
} from 'lucide-react';
import { ExtraDataList } from '../../services/dataService.ts';
import { downloadCSV } from './csvExport.ts';
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
        Object.keys(s.sessionClasses).forEach(key => sessSet.add(normalizeSessionName(key)));
      }
    });
    return Array.from(sessSet).sort();
  }, [data.students]);

  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    data.students.forEach(s => { if (s.formalClass) cls.add(s.formalClass); });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data.students]);

  const filteredSchedules = useMemo(() => {
    return data.schedules.filter(s => {
      const matchDay = schDayFilter === 'Semua' || s.day === schDayFilter;
      const matchSess = schSessionFilter === 'Semua' || normalizeSessionName(s.sessionType) === normalizeSessionName(schSessionFilter);
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

      if (jsonData.length < 2) { alert("File kosong!"); return; }

      const rawHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim());
      const headersMap: Record<string, number> = {};
      rawHeaders.forEach((h, i) => { headersMap[h.toUpperCase().replace(/[^A-Z0-9]/g, '')] = i; });

      const getVal = (rowArr: any[], possibleNames: string[]) => {
        for (const name of possibleNames) {
          const idx = headersMap[name.toUpperCase().replace(/[^A-Z0-9]/g, '')];
          if (idx !== undefined && rowArr[idx] !== undefined) return String(rowArr[idx]).trim();
        }
        return '';
      };

      const newData = jsonData.slice(1).map((row: any, idx) => {
        if (!row || row.length === 0) return null;

        if (type === 'Walas' || type === 'Musyrif') {
           return {
             id: `wm-${Date.now()}-${idx}`,
             name: getVal(row, ['NAMA', 'USTADZ', 'PENGASUH']),
             class: getVal(row, ['KELAS', 'UNIT', 'BINAAN']),
             gender: getVal(row, ['GENDER', 'JK', 'PUTRAPUTRI']) || 'Putra',
             phone: getVal(row, ['NOHP', 'WA', 'KONTAK']),
             type: type
           };
        }

        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          rawHeaders.forEach((h, i) => {
            const hUpper = h.toUpperCase();
            if (hUpper.includes('KELAS') && !hUpper.includes('FORMAL') && !hUpper.includes('MADRASAH')) {
              const sessionName = h.replace(/Kelas/i, '').trim();
              const val = String(row[i] || '').trim();
              if (val) sessionClasses[normalizeSessionName(sessionName)] = val;
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
             name: getVal(row, ['NAMA', 'NAMAGURU', 'USTADZ', 'USTADZAH', 'GURU', 'PENGAJAR']),
             subject: getVal(row, ['MAPEL', 'MATAPELAJARAN', 'MAPELUTAMA', 'PELAJARAN', 'SUBJECT']),
             phone: getVal(row, ['NOHP', 'WHATSAPP', 'TELEPON', 'WA', 'KONTAK']),
             email: getVal(row, ['EMAIL', 'SUREL']),
             teachingClasses: []
           };
        }

        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: getVal(row, ['HARI', 'DAY']) || 'Senin',
            time: getVal(row, ['WAKTU', 'JAM', 'JAMPELAJARAN', 'WAKTUKBM', 'TIME']),
            subject: getVal(row, ['MAPEL', 'MATAPELAJARAN', 'PELAJARAN', 'SUBJECT', 'NAMAPELAJARAN']),
            teacherName: getVal(row, ['GURUUTAMA', 'GURU', 'USTADZ', 'USTADZAH', 'PENGAJAR']),
            assistantTeacherName: getVal(row, ['GURUASISTEN', 'ASISTEN', 'ASISTENGURU', 'GURU2', 'ASSISTANT', 'MUSYRIF', 'MUSYRIFAH']),
            homeroomTeacherName: getVal(row, ['WALIKELAS', 'WALAS', 'HOMEROOM', 'WALI']),
            class: getVal(row, ['UNIT', 'KELAS', 'CLASS', 'ROOM', 'UNITKELAS']),
            sessionType: normalizeSessionName(getVal(row, ['SESI', 'JENISKEGIATAN', 'KEGIATAN', 'SESSION', 'JENISSESI']) || 'Madrasah'),
            level: getVal(row, ['TINGKAT', 'JENJANG', 'UNITLEVEL', 'LEVEL']) || 'MTs',
            gender: getVal(row, ['GENDER', 'JK', 'PUTRAPUTRI', 'SEX']) || 'Putra'
          };
        }
        return null;
      }).filter(item => item && (item as any).name);

      if (confirm(`Sinkronisasi ${newData.length} baris data ${type}?`)) {
        onUpdateData(type, newData);
        alert("Berhasil!");
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = (type: string) => {
    let headers = ["Nama", "Kelas", "Gender", "No HP"];
    let example = ["Ustadz Ahmad", "7A", "Putra", "0812345"];
    if (type === 'Siswa') { headers = ["NIS", "Nama", "Gender", "Tingkat", "Unit Formal", "Kelas Al-Quran"]; example = ["2024001", "Ahmad", "Putra", "MTs", "7A", "Tajwid 1"]; }
    const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `Template_${type}_Mahasina.xlsx`);
  };

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto animate-in fade-in duration-700 px-4">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { id: 'Guru', label: 'Data Pengajar', desc: 'Daftar Guru & Mapel', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Walas', label: 'Data Walas', desc: 'Wali Kelas Mahasina', icon: <GraduationCap size={28}/>, color: 'blue' },
             { id: 'Musyrif', label: 'Musyrif/ah', desc: 'Pengasuh Kamar/Kamar', icon: <Heart size={28}/>, color: 'rose' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Biodata & Kelas Sesi', icon: <Users size={28}/>, color: 'indigo' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Plotting Guru & Kelas', icon: <Calendar size={28}/>, color: 'orange' },
             { id: 'Peraturan', label: 'Katalog Poin', desc: 'Daftar Pelanggaran/Prestasi', icon: <Award size={28}/>, color: 'red' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl transition-all group flex flex-col gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8">
           <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <button onClick={() => {setSelectedCategory(null); setSearchTerm('');}} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><ArrowLeft size={20}/></button>
                 <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{selectedCategory}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Data Mahasina</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                 {isSuperAdmin && (
                   <>
                     <button onClick={() => downloadTemplate(selectedCategory)} className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2"><Download size={14}/> Template</button>
                     <label className="flex-1 sm:flex-none px-5 py-3 bg-emerald-950 text-white rounded-xl font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                        <Upload size={14}/> Impor Data
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
                     </label>
                   </>
                 )}
              </div>
           </div>

           {/* Rendering Tables based on Selected Category */}
           <div className="bg-white p-6 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border shadow-sm space-y-6 overflow-hidden">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                 <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-bold outline-none" />
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Nama / Identitas</th>
                         <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Kelas / Binaan</th>
                         <th className="pb-5 text-[9px] font-black uppercase text-slate-400">Kontak / Keterangan</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {/* Filter logic depends on category */}
                      {selectedCategory === 'Guru' && data.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-5 pr-4 min-w-[200px]">
                              <p className="font-black uppercase text-[12px] text-slate-800 truncate">{item.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{item.subject}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <div className="flex flex-wrap gap-1">
                                 {data.schedules.filter(s => isTeacherMatch(item.name, s.teacherName)).map(s => s.class).slice(0, 3).map(c => <span key={c} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[8px] font-black">{c}</span>)}
                              </div>
                           </td>
                           <td className="py-5">
                              <p className="text-[10px] font-bold text-slate-500">{item.phone || '-'}</p>
                           </td>
                        </tr>
                      ))}
                      
                      {(selectedCategory === 'Walas' || selectedCategory === 'Musyrif') && (data as any).extraDataLists?.filter((e:any) => e.type === selectedCategory && e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item:any, idx:number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-5 pr-4">
                              <p className="font-black uppercase text-[12px] text-slate-800">{item.name}</p>
                              <p className="text-[8px] font-bold text-pink-500 uppercase">{item.gender}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase">{item.class}</span>
                           </td>
                           <td className="py-5">
                              <p className="text-[10px] font-bold text-slate-500">{item.phone || '-'}</p>
                           </td>
                        </tr>
                      ))}

                      {selectedCategory === 'Siswa' && data.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-5 pr-4">
                              <p className="font-black uppercase text-[12px] text-slate-800 truncate">{item.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{item.nis} • {item.gender}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[10px] font-black text-indigo-600 uppercase">{item.formalClass}</p>
                           </td>
                           <td className="py-5">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Sesi: {Object.values(item.sessionClasses || {}).join(', ') || '-'}</p>
                           </td>
                        </tr>
                      ))}

                      {selectedCategory === 'Jadwal' && filteredSchedules.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                           <td className="py-5 pr-4">
                              <p className="font-black uppercase text-[10px] text-slate-800">{item.subject}</p>
                              <p className="text-[8px] font-bold text-emerald-600 uppercase">{item.teacherName}</p>
                           </td>
                           <td className="py-5 pr-4 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black">{item.class}</span>
                           </td>
                           <td className="py-5">
                              <p className="text-[9px] font-black uppercase text-slate-400">{item.day} • {item.time}</p>
                           </td>
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
