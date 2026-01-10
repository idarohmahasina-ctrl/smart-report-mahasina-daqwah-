
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
  
  // Filter khusus Santri
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');

  // Filter khusus Jadwal
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
      const rows = text.split('\n').map(r => r.trim()).filter(r => r !== '');
      if (rows.length < 2) {
        alert("File kosong atau format salah.");
        return;
      }

      const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const newData = rows.slice(1).map((row, idx) => {
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i] || '');

        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          headers.forEach((h, i) => {
            if (h.startsWith('Kelas ') && h !== 'Kelas Madrasah (Formal)') {
              const sessionName = h.replace('Kelas ', '').trim();
              if (values[i]) sessionClasses[sessionName] = values[i];
            }
          });
          return {
            id: `std-${Date.now()}-${idx}`,
            nis: obj['NIS'] || '',
            name: obj['Nama'] || '',
            gender: obj['Gender'] || 'Putra',
            level: obj['Tingkat'] || 'MTs',
            formalClass: obj['Kelas Madrasah (Formal)'] || '',
            sessionClasses: sessionClasses
          };
        }
        
        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: obj['Hari'] || 'Senin',
            time: obj['Waktu'] || '',
            subject: obj['Mata Pelajaran'] || '',
            teacherName: obj['Guru'] || '',
            class: obj['Kelas/Unit'] || '',
            sessionType: obj['Sesi'] || 'Madrasah',
            level: obj['Tingkat'] || 'MTs',
            gender: obj['Gender'] || 'Putra'
          };
        }

        if (type === 'Guru') {
           return {
             id: `t-${Date.now()}-${idx}`,
             name: obj['Nama'] || '',
             subject: obj['Mata Pelajaran Utama'] || '',
             phone: obj['No HP'] || '',
             email: obj['Email'] || '',
             gender: obj['Gender'] || 'Putra',
             isWaliKelas: (obj['Wali Kelas?'] || '').toLowerCase() === 'ya',
             waliKelasFor: obj['Wali Kelas Di'] || '',
             teachingClasses: (obj['Mengajar Di Kelas'] || '').split(';').map((s: string) => s.trim())
           };
        }

        if (type === 'Peraturan') {
          return {
            id: `rule-${Date.now()}-${idx}`,
            category: obj['Kategori'] as ViolationCategory,
            label: obj['Nama Pelanggaran/Prestasi'] || '',
            points: parseInt(obj['Poin'] || '0')
          };
        }

        return obj;
      });

      if (confirm(`Berhasil memproses ${newData.length} data. Ganti data lama dengan data ini?`)) {
        if (type === 'Peraturan') {
          // Pisahkan mana yang poin positif (Prestasi) dan negatif (Pelanggaran)
          const violations = newData.filter(d => d.points > 0); 
          onUpdateData('Violations', violations);
          alert("Katalog Poin berhasil diperbarui.");
        } else {
          onUpdateData(type, newData);
          alert(`Data ${type} berhasil diperbarui.`);
        }
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
    } else if (type === 'Peraturan') {
      content = "Kategori,Nama Pelanggaran/Prestasi,Poin\nIbadah,Terlambat Shalat Berjamaah,5\nAkhlak,Berkelahi,100\nAkademik,Juara Lomba Nasional,100";
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Logic filter data yang ditampilkan
  const filteredStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
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
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gunakan template untuk upload massal</p>
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

           {/* VIEW DATA GURU */}
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
                      </tbody>
                   </table>
                   {filteredTeachers.length === 0 && <div className="py-20 text-center text-slate-200 font-black uppercase italic tracking-widest">Belum Ada Data Guru</div>}
                </div>
             </div>
           )}

           {/* VIEW DATA SANTRI (Sudah Ada, disesuaikan) */}
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
                         {filteredStudents.map(s => (
                            <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                               <td className="py-6">
                                  <p className="text-sm font-black uppercase text-slate-800 tracking-tight">{s.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{s.nis} • {s.gender}</p>
                               </td>
                               <td className="py-6">
                                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{s.formalClass}</span>
                               </td>
                               <td className="py-6">
                                  <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-black uppercase">
                                     {studentSessionFilter === 'Madrasah' ? s.formalClass : (s.sessionClasses?.[studentSessionFilter] || '-')}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {filteredStudents.length === 0 && <div className="py-20 text-center text-slate-200 font-black uppercase italic tracking-widest">Data Santri Kosong</div>}
                </div>
             </div>
           )}

           {/* VIEW DATA JADWAL */}
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
                      </tbody>
                   </table>
                   {filteredSchedules.length === 0 && <div className="py-20 text-center text-slate-200 font-black uppercase italic tracking-widest">Jadwal Masih Kosong</div>}
                </div>
             </div>
           )}

           {/* VIEW DATA PERATURAN / KATALOG POIN */}
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
