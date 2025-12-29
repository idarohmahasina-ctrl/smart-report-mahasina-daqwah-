
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, ViolationCategory, SessionType } from '../types';
import { 
  Search, Filter, User, BookOpen, GraduationCap, Users, Mail, Phone, 
  ShieldCheck, Briefcase, FileText, Download, Upload, PlusCircle, Trash2, 
  Edit2, Layers, FileSpreadsheet, Info as InfoIcon, ChevronDown, CheckCircle, ArrowRight
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';

interface InformationProps {
  role: UserRole;
  userEmail: string;
  data: {
    students: Student[];
    teachers: Teacher[];
    schedules: Schedule[];
    orsam: OrganizationMember[];
    orklas: OrganizationMember[];
    violationTemplates: TemplateItem[];
    achievementTemplates: TemplateItem[];
  };
  onUpdateData: (type: string, newData: any[]) => void;
}

type InfoCategory = 'Guru' | 'Siswa' | 'Jadwal' | 'ORSAM' | 'ORKLAS' | 'Peraturan' | null;

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<InfoCategory>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSession, setStudentSession] = useState<SessionType | ''>('');
  const [studentClass, setStudentClass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = userEmail.toLowerCase() === 'idarohmahasina@gmail.com';

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    if (selectedCategory === 'Guru') headers = ['name', 'subject', 'phone', 'email', 'gender', 'isWaliKelas', 'waliKelasFor'];
    else if (selectedCategory === 'Siswa') headers = ['nis', 'name', 'formalClass', 'level', 'gender', 'class_Quran', 'class_Sekolah', 'class_Hadis', 'class_Kitab', 'class_Penjurusan'];
    else if (selectedCategory === 'Jadwal') headers = ['day', 'time', 'subject', 'teacherName', 'class', 'level', 'gender', 'sessionType'];
    else if (selectedCategory === 'ORSAM') headers = ['name', 'position', 'class', 'department'];
    else if (selectedCategory === 'Peraturan') headers = ['label', 'points', 'category', 'type'];
    
    downloadCSV([Object.fromEntries(headers.map(h => [h, '']))], `Template_${selectedCategory}`);
  };

  const handleDownloadData = () => {
    let exportData: any[] = [];
    if (selectedCategory === 'Guru') exportData = data.teachers;
    else if (selectedCategory === 'Siswa') exportData = data.students;
    else if (selectedCategory === 'Jadwal') exportData = data.schedules;
    else if (selectedCategory === 'ORSAM') exportData = data.orsam;
    else if (selectedCategory === 'ORKLAS') exportData = data.orklas;
    else if (selectedCategory === 'Peraturan') exportData = data.violationTemplates;

    if (exportData.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }
    downloadCSV(exportData, `Data_${selectedCategory}_Mahasina`);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
        if (rows.length < 2) return;
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const newData = rows.slice(1).map(row => {
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = { id: Math.random().toString(36).substr(2, 9), sessionClasses: {} };
          headers.forEach((h, i) => {
            if (h.startsWith('class_')) {
              const sessionStr = h.replace('class_', '');
              let sessionType: SessionType;
              if (sessionStr === 'Quran') sessionType = SessionType.QURAN;
              else if (sessionStr === 'Sekolah') sessionType = SessionType.SEKOLAH;
              else if (sessionStr === 'Hadis') sessionType = SessionType.HADIS;
              else if (sessionStr === 'Kitab') sessionType = SessionType.KITAB;
              else sessionType = SessionType.PENJURUSAN;
              obj.sessionClasses[sessionType] = values[i];
            } else obj[h] = values[i];
          });
          return obj;
        });
        onUpdateData(selectedCategory === 'Peraturan' ? 'Violations' : selectedCategory!, newData);
        alert("Data Berhasil Diupload!");
      } catch (err) { alert("Format file salah."); }
    };
    reader.readAsText(file);
  };

  const availableClassesForSession = useMemo(() => {
    if (!studentSession) return [];
    const set = new Set<string>();
    data.students.forEach(s => {
      const cls = s.sessionClasses[studentSession as SessionType];
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [data.students, studentSession]);

  const filteredStudents = useMemo(() => {
    if (!studentSession || !studentClass) return [];
    return data.students.filter(s => 
      s.sessionClasses[studentSession as SessionType] === studentClass &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm))
    );
  }, [data.students, studentSession, studentClass, searchTerm]);

  const renderStudentView = () => (
    <div className="space-y-10 p-8 md:p-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-emerald-50/50 p-10 rounded-[3rem] border-2 border-emerald-100/50">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">1. Pilih Sesi Kegiatan</label>
          <div className="relative">
            <select value={studentSession} onChange={e => { setStudentSession(e.target.value as any); setStudentClass(''); }} className="w-full pl-6 pr-12 py-5 bg-white border-2 border-emerald-200 rounded-2xl font-black text-xs uppercase outline-none appearance-none focus:border-emerald-600 shadow-sm transition-all">
              <option value="">-- PILIH SESI --</option>
              {Object.values(SessionType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
          </div>
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">2. Pilih Kelas / Kelompok</label>
          <div className="relative">
            <select disabled={!studentSession} value={studentClass} onChange={e => setStudentClass(e.target.value)} className="w-full pl-6 pr-12 py-5 bg-white border-2 border-emerald-200 rounded-2xl font-black text-xs uppercase outline-none appearance-none focus:border-emerald-600 shadow-sm disabled:opacity-30 transition-all">
              <option value="">-- PILIH KELAS --</option>
              {availableClassesForSession.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
          </div>
        </div>
      </div>
      {studentSession && studentClass ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-lg"><Users size={28}/></div>
               <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{studentClass}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Sesi Aktif: {studentSession}</p>
               </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input type="text" placeholder="Cari santri..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] outline-none focus:border-emerald-600 font-bold shadow-sm" />
          </div>
          <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-sm overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <tr>
                     <th className="px-10 py-7 text-left">Nama Lengkap</th>
                     <th className="px-10 py-7">NIS</th>
                     <th className="px-10 py-7">Jenjang</th>
                     <th className="px-10 py-7">Gender</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredStudents.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-10 py-7 font-black text-slate-800 text-base">{s.name}</td>
                       <td className="px-10 py-7 text-center font-bold text-slate-500">{s.nis}</td>
                       <td className="px-10 py-7 text-center"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black">{s.level}</span></td>
                       <td className="px-10 py-7 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-black ${s.gender === 'Putra' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>{s.gender.toUpperCase()}</span></td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 opacity-40">
           <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-[2.5rem] flex items-center justify-center"><Filter size={48} /></div>
           <p className="text-xs font-bold text-slate-400 max-w-xs mt-2">Pilih Sesi dan Kelas untuk melihat daftar santri.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      {selectedCategory ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <button onClick={() => setSelectedCategory(null)} className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">← Kembali</button>
             <div className="flex gap-4">
                <button onClick={handleDownloadData} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-100 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"><Download size={16}/> Download CSV</button>
                {isAdmin && (
                  <>
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-amber-100 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all"><FileText size={16}/> Template CSV</button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-800 transition-all">
                      <Upload size={16}/> Upload CSV
                      <input type="file" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" accept=".csv" />
                    </button>
                  </>
                )}
             </div>
          </div>
          <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-2xl overflow-hidden min-h-[600px]">
             <div className="p-12 bg-emerald-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{selectedCategory}</h2>
                  <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em] mt-2 italic">Informasi Master Data Mahasina</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 backdrop-blur-md"><InfoIcon size={32}/></div>
             </div>
             {selectedCategory === 'Siswa' ? renderStudentView() : <div className="p-20 text-center text-slate-300 font-bold uppercase italic tracking-widest">Detail data {selectedCategory} dapat diunduh melalui tombol di atas.</div>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
           {[
             { id: 'Guru', label: 'Data Pengajar', desc: 'Kelola SK & Mapel Sesi', icon: <User size={28}/> },
             { id: 'Siswa', label: 'Data Santri', desc: 'Mapping Sesi & Kelas', icon: <GraduationCap size={28}/> },
             { id: 'Jadwal', label: 'Jadwal Pelajaran', desc: 'Atur KBM per Sesi & Waktu', icon: <BookOpen size={28}/> },
             { id: 'ORSAM', label: 'Data ORSAM', desc: 'Organisasi Santri Mahasina', icon: <Users size={28}/> },
             { id: 'ORKLAS', label: 'Data ORKLAS', desc: 'Kepengurusan Tiap Kelas', icon: <Layers size={28}/> },
             { id: 'Peraturan', label: 'Katalog Peraturan', desc: 'Daftar Poin & Sanksi Pondok', icon: <ShieldCheck size={28}/> },
           ].map(item => (
             <button key={item.id} onClick={() => setSelectedCategory(item.id as any)} className="group bg-white p-12 rounded-[3.5rem] border-2 border-transparent hover:border-emerald-600 hover:shadow-3xl transition-all text-left relative overflow-hidden shadow-sm">
                <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-700 group-hover:text-white rounded-2xl flex items-center justify-center mb-10 transition-all text-emerald-700 shadow-inner">{item.icon}</div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{item.label}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">{item.desc}</p>
             </button>
           ))}
        </div>
      )}
    </div>
  );
};

export default Information;
