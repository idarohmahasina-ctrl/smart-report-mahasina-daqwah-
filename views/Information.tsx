
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
      let text = event.target?.result as string;
      text = text.replace(/^\uFEFF/, '');
      
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
      if (lines.length < 2) {
        alert("File kosong atau hanya berisi judul kolom.");
        return;
      }

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
        const values = line.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());
        
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
             gender: getVal(values, ['GENDER', 'JK']) || 'Putra',
             isWaliKelas: getVal(values, ['WALIKELAS', 'WALI']).toLowerCase() === 'ya',
             waliKelasFor: getVal(values, ['WALIKELASDI', 'WALIUNIT']),
             teachingClasses: (getVal(values, ['MENGAJARDIKELAS', 'KELAS']) || '').split(';').map(s => s.trim())
           };
        }

        if (type === 'Jadwal') {
          return {
            id: `sch-${Date.now()}-${idx}`,
            day: getVal(values, ['HARI']) || 'Senin',
            time: getVal(values, ['WAKTU', 'JAM']),
            subject: getVal(values, ['MAPEL', 'MATAPELAJARAN']),
            teacherName: getVal(values, ['GURU', 'USTADZ', 'USTADZAH']),
            class: getVal(values, ['UNIT', 'KELAS']),
            sessionType: getVal(values, ['SESI', 'JENISKEGIATAN']) || 'Madrasah',
            level: getVal(values, ['TINGKAT', 'JENJANG']) || 'MTs',
            gender: getVal(values, ['GENDER', 'JK']) || 'Putra'
          };
        }

        return values;
      }).filter(item => {
        if (typeof item === 'object' && 'name' in item) return !!item.name;
        if (typeof item === 'object' && 'subject' in item && 'teacherName' in item) return !!item.subject;
        return true;
      });

      if (newData.length === 0) {
        alert("Gagal membaca data. Pastikan judul kolom (Header) sudah benar.");
        return;
      }

      if (confirm(`Terdeteksi ${newData.length} baris data ${type}. Timpa data lama?`)) {
        localStorage.setItem('mahasina_mock_disabled', 'true');
        onUpdateData(type, newData);
        alert("Sinkronisasi Berhasil!");
        setTimeout(() => window.location.reload(), 300);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (type: string) => {
    let content = "";
    let filename = `Template_${type}_Mahasina.csv`;
    if (type === 'Siswa') content = "NIS,Nama,Gender,Tingkat,Kelas Madrasah (Formal),Kelas Al-Quran,Kelas Kitab Kuning\n2024001,Ahmad Santri,Putra,MTs,7A,Yanbu'a 3,Safinatun Najah";
    else if (type === 'Guru') content = "Nama,Mapel,No HP,Email,Gender,Wali Kelas,Wali Kelas Di,Mengajar Di Kelas\nUstadz Zulkifli,Nahwu,081234,zulkifli@gmail.com,Putra,Ya,7A,7A;7B;8A";
    else if (type === 'Jadwal') content = "Hari,Waktu,Mapel,Guru,Unit,Sesi,Tingkat,Gender\nSenin,07:30 - 09:00,Nahwu,Ustadz Zulkifli,7A,Madrasah,MTs,Putra";
    
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
      const studentClassInSession = studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter];
      const matchClass = !studentClassFilter || studentClassInSession === studentClassFilter;
      return matchSearch && matchClass;
    });
  }, [data.students, studentSessionFilter, studentClassFilter, searchTerm]);

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
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gunakan format CSV Excel yang sesuai</p>
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
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari Nama/NIS</label>
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
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {selectedCategory === 'Guru' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nama Guru</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email (Login)</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mapel</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.teachers.map(t => (
                        <tr key={t.id}>
                           <td className="py-6 font-black uppercase text-xs">{t.name}</td>
                           <td className="py-6 font-bold text-slate-500 text-[10px]">{t.email || '-'}</td>
                           <td className="py-6 font-black text-indigo-600 text-[10px] uppercase">{t.subject}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}

           {selectedCategory === 'Jadwal' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Guru</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mapel</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.schedules.map(sch => (
                        <tr key={sch.id}>
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

           {selectedCategory === 'Peraturan' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-slate-50">
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kategori</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Peraturan</th>
                         <th className="pb-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Poin</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[...data.violationTemplates, ...data.achievementTemplates].map((p, idx) => (
                        <tr key={idx}>
                           <td className="py-6"><span className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase rounded-lg">{p.category}</span></td>
                           <td className="py-6 font-black uppercase text-[10px]">{p.label}</td>
                           <td className="py-6 font-black text-red-600">{p.points}</td>
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
