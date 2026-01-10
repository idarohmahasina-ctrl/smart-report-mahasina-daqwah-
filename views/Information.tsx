
import React, { useState, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, Announcement, ViolationCategory } from '../types';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Database, ArrowLeft, UserCheck2, Filter, ChevronRight, FileSpreadsheet, Trash2
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';

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
  const [dayFilter, setDayFilter] = useState<string>('Senin');
  const [studentSessionFilter, setStudentSessionFilter] = useState<string>('Madrasah');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  
  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  // Mendeteksi Sesi yang ada di data santri secara dinamis
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
      const rows = text.split('\n').filter(r => r.trim() !== '');
      if (rows.length < 2) return;

      const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const newData = rows.slice(1).map((row, idx) => {
        // Regex untuk handle koma di dalam tanda kutip
        const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i]);

        if (type === 'Siswa') {
          const sessionClasses: Record<string, string> = {};
          // LOGIKA DINAMIS: Cari semua kolom yang diawali "Kelas "
          headers.forEach((h, i) => {
            if (h.startsWith('Kelas ') && h !== 'Kelas Madrasah (Formal)') {
              const sessionName = h.replace('Kelas ', '').trim();
              sessionClasses[sessionName] = values[i] || '';
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
            day: obj['Hari'],
            time: obj['Waktu'],
            subject: obj['Mata Pelajaran'],
            teacherName: obj['Guru'],
            class: obj['Kelas/Unit'],
            sessionType: obj['Sesi'],
            level: obj['Tingkat'],
            gender: obj['Gender']
          };
        }
        return obj;
      });

      if (confirm(`Berhasil memproses ${newData.length} data. Simpan ke sistem?`)) {
        onUpdateData(type, newData);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = (type: string) => {
    let content = "";
    if (type === 'Siswa') {
      content = "NIS,Nama,Gender,Tingkat,Kelas Madrasah (Formal),Kelas Al-Quran,Kelas Kitab Kuning,Kelas Sore\n2024001,Ahmad Santri,Putra,MTs,7A,Yanbu'a 3,Safinatun Najah,B. Arab Dasar";
    } else {
      content = "Hari,Waktu,Mata Pelajaran,Guru,Kelas/Unit,Sesi,Tingkat,Gender\nSenin,07:30 - 09:00,Fiqih,Ustadz Zulkifli,7A,Madrasah,MTs,Putra";
    }
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_${type}_Mahasina.csv`;
    a.click();
  };

  const availableClassesForSession = useMemo(() => {
    const classSet = new Set<string>();
    data.students.forEach(s => {
      const cls = studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter];
      if (cls) classSet.add(cls);
    });
    return Array.from(classSet).sort();
  }, [data.students, studentSessionFilter]);

  const filteredStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
      const studentClassInSession = studentSessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[studentSessionFilter];
      const matchClass = !studentClassFilter || studentClassInSession === studentClassFilter;
      return matchSearch && matchClass;
    });
  }, [data.students, studentSessionFilter, studentClassFilter, searchTerm]);

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[
             { id: 'Guru', label: 'Data Guru', icon: <UserCheck2 size={28}/>, color: 'emerald' },
             { id: 'Siswa', label: 'Data Santri', icon: <Users size={28}/>, color: 'blue' },
             { id: 'Jadwal', label: 'Jadwal KBM', icon: <Calendar size={28}/>, color: 'indigo' },
             { id: 'Peraturan', label: 'Katalog Poin', icon: <Shield size={28}/>, color: 'red' },
           ].map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 transition-all group flex flex-col gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${cat.color}-50 text-${cat.color}-600`}>{cat.icon}</div>
                <h3 className="text-xl font-black text-slate-800 uppercase">{cat.label}</h3>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[3rem] border shadow-xl flex justify-between items-center">
              <div className="flex items-center gap-6">
                 <button onClick={() => setSelectedCategory(null)} className="p-4 bg-slate-50 rounded-2xl"><ArrowLeft size={24}/></button>
                 <h2 className="text-2xl font-black uppercase">{selectedCategory}</h2>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => downloadTemplate(selectedCategory)} className="px-6 py-4 bg-slate-100 rounded-2xl font-black text-[9px] uppercase flex items-center gap-2"><Download size={16}/> Template</button>
                 <label className="px-6 py-4 bg-emerald-900 text-white rounded-2xl font-black text-[9px] uppercase flex items-center gap-2 cursor-pointer shadow-lg">
                    <Upload size={16}/> Upload CSV
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, selectedCategory)} />
                 </label>
              </div>
           </div>

           {selectedCategory === 'Siswa' && (
             <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400">Pilih Sesi</label>
                      <select value={studentSessionFilter} onChange={e => {setStudentSessionFilter(e.target.value); setStudentClassFilter('');}} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase border-2 border-transparent focus:border-blue-500">
                         {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400">Filter Kelas</label>
                      <select value={studentClassFilter} onChange={e => setStudentClassFilter(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase border-2 border-transparent focus:border-blue-500">
                         <option value="">SEMUA KELAS</option>
                         {availableClassesForSession.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400">Cari Nama</label>
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-xs" placeholder="Ketik..." />
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2">
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Nama Santri</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Kelas Madrasah</th>
                            <th className="pb-6 text-[10px] font-black uppercase text-slate-400">Kelas di Sesi: {studentSessionFilter}</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {filteredStudents.map(s => (
                            <tr key={s.id}>
                               <td className="py-6">
                                  <p className="text-sm font-black uppercase text-slate-800">{s.name}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.nis}</p>
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
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Information;
