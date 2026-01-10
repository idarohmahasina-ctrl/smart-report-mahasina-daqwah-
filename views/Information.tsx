
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../types';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2, AlertCircle, Bookmark
} from 'lucide-react';

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
  onResetData?: (type: string) => void;
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData, onResetData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  const [scheduleDayFilter, setScheduleDayFilter] = useState<string>('Semua');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const dynamicSessions = useMemo(() => {
    const sessSet = new Set<string>(['Madrasah']);
    data.students.forEach(s => {
      if (s.sessionClasses) {
        Object.keys(s.sessionClasses).forEach(key => sessSet.add(key));
      }
    });
    return Array.from(sessSet).sort();
  }, [data.students]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
      if (lines.length < 2) {
        alert("File kosong atau hanya berisi header.");
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      const rawHeaders = firstLine.split(delimiter).map(h => h.replace(/"/g, '').trim());
      const headersMap: Record<string, number> = {};
      rawHeaders.forEach((h, i) => headersMap[h.toUpperCase()] = i);

      const getVal = (rowArr: string[], possibleNames: string[]) => {
        for (const name of possibleNames) {
          const idx = headersMap[name.toUpperCase()];
          if (idx !== undefined) return rowArr[idx]?.replace(/"/g, '').trim() || '';
        }
        return '';
      };

      const newData = lines.slice(1).map((line, idx) => {
        const regex = new RegExp(`("${delimiter}"|[^"${delimiter}]+)(?=${delimiter}|$)`, 'g');
        const values = line.match(regex)?.map(v => v.replace(/"/g, '').trim()) || line.split(delimiter);
        
        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          rawHeaders.forEach((h, i) => {
            const headerClean = h.toUpperCase().trim();
            // Cek jika kolom dimulai dengan 'KELAS ' tapi bukan kelas formal
            if (headerClean.startsWith('KELAS ') && headerClean !== 'KELAS MADRASAH (FORMAL)') {
              const sessionName = h.replace(/Kelas /i, '').trim();
              const cellValue = values[i]?.replace(/"/g, '').trim();
              // HANYA MASUKKAN JIKA ISI KOLOM TIDAK KOSONG
              if (cellValue && cellValue !== '') {
                sessionClasses[sessionName] = cellValue;
              }
            }
          });

          return {
            id: `std-${Date.now()}-${idx}`,
            nis: getVal(values, ['NIS', 'NISN', 'NOMOR INDUK']),
            name: getVal(values, ['NAMA', 'NAMA LENGKAP', 'NAMA SANTRI']),
            gender: getVal(values, ['GENDER', 'JENIS KELAMIN', 'JK']) || 'Putra',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            formalClass: getVal(values, ['KELAS MADRASAH (FORMAL)', 'KELAS FORMAL', 'KELAS']),
            sessionClasses: sessionClasses
          };
        }
        
        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: getVal(values, ['HARI']) || 'Senin',
            time: getVal(values, ['WAKTU', 'JAM']),
            subject: getVal(values, ['MATA PELAJARAN', 'MAPEL']),
            teacherName: getVal(values, ['GURU', 'USTADZ', 'USTADZAH', 'PENGAJAR']),
            class: getVal(values, ['KELAS/UNIT', 'UNIT', 'KELAS']),
            sessionType: getVal(values, ['SESI', 'JENIS SESI']) || 'Madrasah',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            gender: getVal(values, ['GENDER', 'JK']) || 'Putra'
          };
        }

        if (type === 'Guru') {
           return {
             id: `t-${Date.now()}-${idx}`,
             name: getVal(values, ['NAMA', 'NAMA GURU']),
             subject: getVal(values, ['MATA PELAJARAN UTAMA', 'MAPEL']),
             phone: getVal(values, ['NO HP', 'WHATSAPP', 'TELEPON']),
             email: getVal(values, ['EMAIL']),
             gender: getVal(values, ['GENDER', 'JK']) || 'Putra',
             isWaliKelas: getVal(values, ['WALI KELAS?']).toLowerCase() === 'ya',
             waliKelasFor: getVal(values, ['WALI KELAS DI']),
             teachingClasses: getVal(values, ['MENGAJAR DI KELAS']).split(';').map(s => s.trim())
           };
        }

        return values;
      }).filter(item => {
        if (typeof item === 'object' && 'name' in item) return !!item.name;
        return true;
      });

      if (newData.length === 0) {
        alert("Gagal memproses data. Pastikan judul kolom di file CSV sesuai.");
        return;
      }

      if (confirm(`Terdeteksi ${newData.length} baris data valid. Timpa data lama dengan data baru ini?`)) {
        onUpdateData(type, newData);
        alert(`Sinkronisasi ${newData.length} Data ${type} Berhasil.`);
        setTimeout(() => window.location.reload(), 500);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (type: string) => {
    let content = "";
    let filename = `Template_${type}_Mahasina.csv`;

    if (type === 'Siswa') {
      content = "NIS,Nama,Gender,Tingkat,Kelas Madrasah (Formal),Kelas Al-Quran,Kelas Kitab Kuning,Kelas Hadis,Kelas Peminatan,Kelas Sore\n2024001,Ahmad Santri,Putra,MTs,7A,Yanbu'a 3,Safinatun Najah,Arba'in 1,IT & Coding,Kamar A";
    } else if (type === 'Jadwal') {
      content = "Hari,Waktu,Mata Pelajaran,Guru,Kelas/Unit,Sesi,Tingkat,Gender\nSenin,07:30 - 09:00,Nahwu,Ustadz Zulkifli,7A,Madrasah,MTs,Putra\nSenin,14:00 - 15:30,Tahfidz,Ustadzah Nurul,7B,Al-Quran,MTs,Putri";
    } else if (type === 'Guru') {
      content = "Nama,Mata Pelajaran Utama,No HP,Email,Gender,Wali Kelas?,Wali Kelas Di,Mengajar Di Kelas\nUstadz Zulkifli,Nahwu,0812345,zulkifli@mahasina.id,Putra,Ya,8A,8A;8B;9A";
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const filteredStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
      // Logika tampilan di tabel: jika Madarasah cek formalClass, jika sesi lain cek sessionClasses
      const studentClassInSession = studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter];
      const matchClass = !studentClassFilter || studentClassInSession === studentClassFilter;
      return matchSearch && matchClass;
    });
  }, [data.students, studentSessionFilter, studentClassFilter, searchTerm]);

  const filteredTeachers = useMemo(() => {
    return data.teachers.filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data.teachers, searchTerm]);

  const filteredSchedules = useMemo(() => {
    return data.schedules.filter(s => {
      const matchDay = scheduleDayFilter === 'Semua' || s.day === scheduleDayFilter;
      const matchSearch = (s.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.class || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchDay && matchSearch;
    });
  }, [data.schedules, scheduleDayFilter, searchTerm]);

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto animate-in fade-in duration-700">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { id: 'Guru', label: 'Data Guru', desc: 'Identitas & Unit Mengajar', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Siswa', label: 'Data Santri', desc: 'Multi-Sesi & Kelas Formal', icon: <Users size={28}/>, color: 'blue' },
             { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Sesi, Jam & Pengajar', icon: <Calendar size={28}/>, color: 'indigo' },
             { id: 'Peraturan', label: 'Katalog Poin', desc: 'Daftar Pelanggaran/Prestasi', icon: <Shield size={28}/>, color: 'red' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl transition-all group flex flex-col gap-6 relative overflow-hidden">
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
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Otomatis Mendeteksi Pemisah CSV (Excel)</p>
                 </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                 <button onClick={() => downloadTemplate(selectedCategory)} className="flex-1 md:flex-none px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                    <Download size={16}/> Unduh Template
                 </button>
                 <label className="flex-1 md:flex-none px-6 py-4 bg-emerald-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-emerald-900 transition-all">
                    <Upload size={16}/> Upload CSV
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
                 </label>
              </div>
           </div>

           {selectedCategory === 'Guru' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
                <div className="relative">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                   <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-xs" placeholder="Cari nama atau mapel..." />
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Ustadz/ah</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mapel Utama</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Wali</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kontak</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredTeachers.map(t => (
                            <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                               <td className="py-6">
                                  <p className="text-sm font-black uppercase text-slate-800 tracking-tight">{t.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Gender: {t.gender}</p>
                               </td>
                               <td className="py-6">
                                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg text-[10px] font-black uppercase">{t.subject}</span>
                               </td>
                               <td className="py-6">
                                  {t.isWaliKelas ? <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">Wali Kelas {t.waliKelasFor}</span> : <span className="text-slate-300 text-[10px] font-bold uppercase">-</span>}
                               </td>
                               <td className="py-6 font-mono text-[10px] text-slate-500">{t.phone}</td>
                            </tr>
                         ))}
                         {filteredTeachers.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Belum Ada Data Guru</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {selectedCategory === 'Siswa' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Sesi</label>
                      <select value={studentSessionFilter} onChange={e => {setStudentSessionFilter(e.target.value); setStudentClassFilter('');}} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase border-2 border-transparent focus:border-blue-500 appearance-none shadow-inner">
                         {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari Nama/NISN</label>
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-xs" placeholder="Ketik..." />
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identitas Santri</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit Formal</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit di Sesi: {studentSessionFilter}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredStudents.map(s => {
                            const studentClassInSession = studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter];
                            return (
                              <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-6">
                                    <p className="text-sm font-black uppercase text-slate-800 tracking-tight">{s.name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{s.nis} • {s.gender}</p>
                                </td>
                                <td className="py-6">
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{s.formalClass}</span>
                                </td>
                                <td className="py-6">
                                    {studentClassInSession ? (
                                      <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-black uppercase">
                                        {studentClassInSession}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Tidak Terdaftar</span>
                                    )}
                                </td>
                              </tr>
                            );
                         })}
                         {filteredStudents.length === 0 && <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Belum Ada Data Santri</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {selectedCategory === 'Jadwal' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Filter Hari</label>
                      <select value={scheduleDayFilter} onChange={e => setScheduleDayFilter(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase border-2 border-transparent focus:border-indigo-500 appearance-none shadow-inner">
                         <option value="Semua">SEMUA HARI</option>
                         {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari Jadwal</label>
                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-xs" placeholder="Cari mapel atau ustadz..." />
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mapel / Guru</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit / Sesi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredSchedules.map(sch => (
                            <tr key={sch.id} className="group hover:bg-slate-50 transition-colors">
                               <td className="py-6">
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{sch.day}</p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sch.time}</p>
                               </td>
                               <td className="py-6">
                                  <p className="text-xs font-black text-slate-800 uppercase">{sch.subject}</p>
                                  <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase tracking-widest">{sch.teacherName}</p>
                               </td>
                               <td className="py-6">
                                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{sch.class}</p>
                                  <p className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-widest">{sch.sessionType} • {sch.level} {sch.gender}</p>
                               </td>
                            </tr>
                         ))}
                         {filteredSchedules.length === 0 && <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Belum Ada Jadwal KBM</td></tr>}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {selectedCategory === 'Peraturan' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
                <div className="relative">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                   <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-xs" placeholder="Cari nama laporan..." />
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-50">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kategori</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Item Pelaporan</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Besar Poin</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {[...data.violationTemplates, ...data.achievementTemplates]
                           .filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
                           .map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                               <td className="py-6">
                                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${item.points > 30 ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{item.category}</span>
                               </td>
                               <td className="py-6">
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.label}</p>
                               </td>
                               <td className="py-6">
                                  <span className="text-sm font-black text-slate-800">{item.points}</span>
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
