
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, Student, Teacher, Schedule, OrganizationMember, TemplateItem, SessionType, Announcement, ViolationCategory } from '../types';
import { 
  Search, Download, Upload, FileText, Info as InfoIcon, Users, 
  Shield, Calendar, UserCheck, Table, Bell, Plus, X, Edit, Trash2, 
  Database, ArrowLeft, UserCheck2, Mail, Phone, Filter, ChevronRight, FileSpreadsheet, Save
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';
import * as XLSX from 'xlsx';

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
}

const Information: React.FC<InformationProps> = ({ role, userEmail, data, onUpdateData }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeExtraId, setActiveExtraId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string>('Senin');
  
  // Student Multi-Session Filters
  const [studentSessionFilter, setStudentSessionFilter] = useState<SessionType>(SessionType.MADRASAH);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingReg, setEditingReg] = useState<TemplateItem | null>(null);
  const [regType, setRegType] = useState<'Violation' | 'Achievement'>('Violation');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTarget, setUploadTarget] = useState<string>('Lainnya');

  // New Edit Master Modal
  const [showEditMasterModal, setShowEditMasterModal] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const handleDownloadData = (isTemplate: boolean = false) => {
    let exportData: any[] = [];
    let filename = isTemplate ? `Template_${selectedCategory}` : `Data_${selectedCategory}`;
    
    if (selectedCategory === 'Guru') exportData = data.teachers;
    else if (selectedCategory === 'Siswa') exportData = data.students;
    else if (selectedCategory === 'Jadwal') exportData = data.schedules;
    else if (selectedCategory === 'ORSAM') exportData = data.orsam;
    else if (selectedCategory === 'ORKLAS') exportData = data.orklas;
    else if (selectedCategory === 'Peraturan') exportData = regType === 'Violation' ? data.violationTemplates : data.achievementTemplates;
    else if (selectedCategory === 'Lainnya' && activeExtraId) {
       const extra = data.extraDataLists.find(l => l.id === activeExtraId);
       exportData = extra?.data || [];
       filename = isTemplate ? `Template_${extra?.title}` : `Data_${extra?.title}`;
    }

    if (isTemplate && exportData.length > 0) {
      const headers = Object.keys(exportData[0]);
      const templateRow = headers.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {});
      exportData = [templateRow];
    }
    
    if (exportData.length === 0) { alert("Data tidak tersedia."); return; }
    downloadCSV(exportData, filename);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) { alert("File kosong."); return; }

        if (uploadTarget === 'Lainnya') {
          const newList: ExtraDataList = {
            id: Math.random().toString(36).substr(2, 9),
            title: uploadTitle || 'Data Baru',
            data: jsonData,
            uploadedAt: new Date().toLocaleDateString('id-ID')
          };
          onUpdateData('ExtraDataLists', [...data.extraDataLists, newList]);
        } else {
          if (confirm(`Anda akan mengganti seluruh data ${uploadTarget} dengan data dari file ini. Lanjutkan? (Data laporan tidak akan hilang)`)) {
            onUpdateData(uploadTarget, jsonData);
          }
        }

        setShowUploadModal(false);
        setUploadTitle('');
        alert(`Berhasil memproses ${jsonData.length} baris data.`);
      } catch (error) {
        alert("Gagal membaca file. Pastikan format Excel (.xlsx) atau CSV benar.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveMasterEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !editingMasterItem) return;

    let targetKey = selectedCategory;
    let currentList: any[] = [];

    if (selectedCategory === 'Siswa') currentList = data.students;
    else if (selectedCategory === 'Guru') currentList = data.teachers;
    else if (selectedCategory === 'Jadwal') currentList = data.schedules;
    else if (selectedCategory === 'ORSAM') currentList = data.orsam;
    else if (selectedCategory === 'ORKLAS') currentList = data.orklas;

    const newList = currentList.map(item => item.id === editingMasterItem.id ? editingMasterItem : item);
    onUpdateData(targetKey, newList);
    
    setShowEditMasterModal(false);
    setEditingMasterItem(null);
    alert(`Data ${selectedCategory} berhasil diperbarui.`);
  };

  const menuItems = [
    { id: 'Guru', label: 'Data Guru', desc: 'Profil pengajar Mahasina', icon: <UserCheck2 size={28}/>, color: 'emerald' },
    { id: 'Siswa', label: 'Data Santri', desc: 'Identitas & Kelas Multi-Sesi', icon: <Users size={28}/>, color: 'blue' },
    { id: 'Jadwal', label: 'Jadwal KBM', desc: 'Sistem harian pesantren', icon: <Calendar size={28}/>, color: 'indigo' },
    { id: 'Peraturan', label: 'Katalog Peraturan & Poin', desc: 'Master poin VP pesantren', icon: <Shield size={28}/>, color: 'red' },
    { id: 'ORSAM', label: 'ORSAM', desc: 'Organisasi Santri Mahasina', icon: <Database size={28}/>, color: 'slate' },
    { id: 'ORKLAS', label: 'ORKLAS', desc: 'Pengurus Per Unit Kelas', icon: <UserCheck size={28}/>, color: 'amber' },
    { id: 'Pengumuman', label: 'Pengumuman', desc: 'Informasi Idaroh Pusat', icon: <Bell size={28}/>, color: 'emerald' },
    { id: 'Lainnya', label: 'Lainnya', desc: 'Data kustom Excel Idaroh', icon: <FileText size={28}/>, color: 'indigo' },
  ];

  const availableClassesForSession = useMemo(() => {
    const classSet = new Set<string>();
    data.students.forEach(s => {
      const cls = studentSessionFilter === SessionType.MADRASAH ? s.formalClass : s.sessionClasses[studentSessionFilter];
      if (cls) classSet.add(cls);
    });
    return Array.from(classSet).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [data.students, studentSessionFilter]);

  const filteredStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
      const studentClassInSession = studentSessionFilter === SessionType.MADRASAH ? s.formalClass : s.sessionClasses[studentSessionFilter];
      const matchClass = !studentClassFilter || studentClassInSession === studentClassFilter;
      return matchSearch && matchClass;
    });
  }, [data.students, studentSessionFilter, studentClassFilter, searchTerm]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      {!selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {menuItems.map(cat => (
             <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 text-left hover:border-emerald-600 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col gap-8 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${cat.color}-50 rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform`} />
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform bg-${cat.color}-50 text-${cat.color}-600 relative z-10`}>{cat.icon}</div>
                <div className="relative z-10">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{cat.label}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-[0.2em]">{cat.desc}</p>
                </div>
             </button>
           ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <button onClick={() => {setSelectedCategory(null); setActiveExtraId(null); setSearchTerm('');}} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-90">
                    <ArrowLeft size={24}/>
                 </button>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
                       {selectedCategory} {selectedCategory === 'Lainnya' && activeExtraId && `• ${data.extraDataLists.find(l=>l.id===activeExtraId)?.title}`}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                       <InfoIcon size={12}/> {isSuperAdmin ? 'ADMIN MAHASINA: AKSES MODIFIKASI AKTIF' : 'AKSES PUBLIK: LIHAT & UNDUH'}
                    </p>
                 </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                 {isSuperAdmin && selectedCategory !== 'Pengumuman' && (
                    <>
                      <button onClick={() => { setUploadTarget(selectedCategory); setShowUploadModal(true); }} className="flex items-center gap-3 px-6 py-4 bg-indigo-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-indigo-800 transition-all">
                         <Upload size={14}/> Unggah Baru
                      </button>
                      <button onClick={() => handleDownloadData(true)} className="flex items-center gap-3 px-6 py-4 bg-amber-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-amber-700 transition-all">
                         <FileSpreadsheet size={14}/> Unduh Template
                      </button>
                    </>
                 )}
                 {(selectedCategory !== 'Lainnya' || activeExtraId) && (
                    <button onClick={() => handleDownloadData(false)} className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                       <Download size={14}/> Unduh Data (.CSV)
                    </button>
                 )}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-sm min-h-[600px]">
              
              {selectedCategory === 'Siswa' && (
                <div className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesi Kegiatan</label>
                         <select value={studentSessionFilter} onChange={e => {setStudentSessionFilter(e.target.value as SessionType); setStudentClassFilter('');}} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase appearance-none cursor-pointer">
                            {Object.values(SessionType).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Sesi</label>
                         <select value={studentClassFilter} onChange={e => setStudentClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase appearance-none cursor-pointer">
                            <option value="">-- SEMUA KELAS --</option>
                            {availableClassesForSession.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Nama/NISN</label>
                         <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik nama santri..." className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs" />
                      </div>
                   </div>
                   <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="border-b-2 border-slate-50">
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Santri</th>
                               <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                               {isSuperAdmin && <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi Admin</th>}
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map(s => (
                               <tr key={s.id} className="group hover:bg-slate-50">
                                  <td className="py-5 text-[11px] font-bold text-slate-400">{s.nis}</td>
                                  <td className="py-5 text-sm font-black text-slate-800 uppercase">{s.name}</td>
                                  <td className="py-5"><span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase">{studentSessionFilter === SessionType.MADRASAH ? s.formalClass : s.sessionClasses[studentSessionFilter] || 'N/A'}</span></td>
                                  {isSuperAdmin && (
                                     <td className="py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                           <button onClick={() => { setEditingMasterItem(s); setShowEditMasterModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                           <button onClick={() => { if(confirm("Hapus santri ini?")) onUpdateData('Siswa', data.students.filter(std=>std.id!==s.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                        </div>
                                     </td>
                                  )}
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {selectedCategory === 'Guru' && (
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b-2 border-slate-50">
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Ustadz/ah</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak</th>
                             {isSuperAdmin && <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi Admin</th>}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {data.teachers.map(t => (
                             <tr key={t.id} className="group hover:bg-slate-50">
                                <td className="py-5 text-sm font-black text-slate-800 uppercase">{t.name}</td>
                                <td className="py-5 text-xs font-bold text-emerald-800 uppercase">{t.subject}</td>
                                <td className="py-5 text-[10px] text-slate-400 font-bold">{t.phone}</td>
                                {isSuperAdmin && (
                                   <td className="py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => { setEditingMasterItem(t); setShowEditMasterModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                         <button onClick={() => { if(confirm("Hapus guru ini?")) onUpdateData('Guru', data.teachers.filter(tr=>tr.id!==t.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                      </div>
                                   </td>
                                )}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}

              {selectedCategory === 'Jadwal' && (
                 <div className="space-y-8">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                       {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                         <button key={day} onClick={() => setDayFilter(day)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${dayFilter === day ? 'bg-emerald-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{day}</button>
                       ))}
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b-2 border-slate-50">
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru / Kelas</th>
                                {isSuperAdmin && <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi Admin</th>}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {data.schedules.filter(s => s.day === dayFilter).map(s => (
                                <tr key={s.id} className="group hover:bg-slate-50">
                                   <td className="py-5 text-xs font-black text-emerald-800">{s.time}</td>
                                   <td className="py-5 text-sm font-black text-slate-800 uppercase">{s.subject}</td>
                                   <td className="py-5">
                                      <p className="text-[10px] font-bold text-slate-600 uppercase">{s.teacherName}</p>
                                      <p className="text-[8px] font-black text-indigo-700 uppercase">KELAS: {s.class}</p>
                                   </td>
                                   {isSuperAdmin && (
                                      <td className="py-5 text-right">
                                         <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingMasterItem(s); setShowEditMasterModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                            <button onClick={() => { if(confirm("Hapus jadwal ini?")) onUpdateData('Jadwal', data.schedules.filter(sc=>sc.id!==s.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                         </div>
                                      </td>
                                   )}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}

              {(selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') && (
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b-2 border-slate-50">
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jabatan</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Santri</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN</th>
                             <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedCategory === 'ORSAM' ? 'Departemen' : 'Unit Kelas'}</th>
                             {isSuperAdmin && <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi Admin</th>}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {(selectedCategory === 'ORSAM' ? data.orsam : data.orklas).map(o => (
                             <tr key={o.id} className="group hover:bg-slate-50">
                                <td className="py-5"><span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-[9px] font-black uppercase">{o.position}</span></td>
                                <td className="py-5 text-sm font-black text-slate-800 uppercase">{o.name}</td>
                                <td className="py-5 text-[10px] font-bold text-slate-400">{o.nis || '-'}</td>
                                <td className="py-5 text-[10px] font-black text-indigo-800 uppercase">{o.department || o.class}</td>
                                {isSuperAdmin && (
                                   <td className="py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => { setEditingMasterItem(o); setShowEditMasterModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                         <button onClick={() => { if(confirm("Hapus data pengurus?")) onUpdateData(selectedCategory === 'ORSAM' ? 'ORSAM' : 'ORKLAS', (selectedCategory === 'ORSAM' ? data.orsam : data.orklas).filter(it=>it.id!==o.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                      </div>
                                   </td>
                                )}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}

              {selectedCategory === 'Peraturan' && (
                 <div className="space-y-8">
                    <div className="flex bg-slate-50 p-1 rounded-2xl w-fit">
                       <button onClick={() => setRegType('Violation')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regType === 'Violation' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Pelanggaran</button>
                       <button onClick={() => setRegType('Achievement')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regType === 'Achievement' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Prestasi</button>
                    </div>
                    <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50">
                             <tr>
                                <th className="p-6 text-[9px] font-black text-slate-400 uppercase">Kategori</th>
                                <th className="p-6 text-[9px] font-black text-slate-400 uppercase">Nama Aturan</th>
                                <th className="p-6 text-[9px] font-black text-slate-400 uppercase text-center">Poin</th>
                                {isSuperAdmin && <th className="p-6 text-[9px] font-black text-slate-400 uppercase text-right">Aksi</th>}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {(regType === 'Violation' ? data.violationTemplates : data.achievementTemplates).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                   <td className="px-6 py-4"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${regType === 'Violation' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.category}</span></td>
                                   <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{item.label}</td>
                                   <td className="px-6 py-4 text-center font-black text-sm">{item.points}</td>
                                   {isSuperAdmin && (
                                      <td className="px-6 py-4 text-right">
                                         <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingReg({...item, _exists: true} as any); setShowRegModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                                         </div>
                                      </td>
                                   )}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}

              {selectedCategory === 'Lainnya' && (
                 <div className="space-y-10">
                    {!activeExtraId ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {data.extraDataLists.map(list => (
                             <button key={list.id} onClick={() => setActiveExtraId(list.id)} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-left hover:bg-white hover:shadow-2xl hover:border-emerald-600 transition-all flex flex-col gap-6 group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-700 shadow-inner group-hover:scale-110 transition-transform"><Table size={24}/></div>
                                <div><h4 className="text-base font-black uppercase">{list.title}</h4><p className="text-[9px] font-bold text-slate-400 mt-2">Update: {list.uploadedAt} • {list.data.length} Baris</p></div>
                                {isSuperAdmin && <div className="mt-auto pt-4 border-t border-slate-200 flex justify-end"><button onClick={(e) => { e.stopPropagation(); if(confirm("Hapus?")) onUpdateData('ExtraDataLists', data.extraDataLists.filter(l=>l.id!==list.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></div>}
                             </button>
                          ))}
                       </div>
                    ) : (
                       <div className="overflow-x-auto no-scrollbar border rounded-[2rem] border-slate-100">
                          <table className="w-full text-left">
                             <thead className="bg-slate-50"><tr>{Object.keys(data.extraDataLists.find(l=>l.id===activeExtraId)?.data[0] || {}).map(h => (<th key={h} className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>))}</tr></thead>
                             <tbody className="divide-y divide-slate-100">{data.extraDataLists.find(l=>l.id===activeExtraId)?.data.map((row, idx) => (<tr key={idx} className="hover:bg-slate-50">{Object.values(row).map((val: any, vIdx) => (<td key={vIdx} className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{String(val)}</td>))}</tr>))}</tbody>
                          </table>
                       </div>
                    )}
                 </div>
              )}

              {selectedCategory === 'Pengumuman' && (
                 <div className="space-y-6">
                    {data.announcements.map(ann => (
                       <div key={ann.id} className={`p-10 rounded-[3rem] border-2 transition-all relative group ${ann.priority === 'Penting' ? 'bg-amber-50 border-amber-200 shadow-xl' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-8"><div className="flex items-center gap-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${ann.priority === 'Penting' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}><Bell size={28}/></div><div><h4 className="text-xl font-black uppercase">{ann.title}</h4><p className="text-[9px] font-bold text-slate-400 mt-2">{ann.date} • Oleh {ann.author}</p></div></div>{isSuperAdmin && <div className="flex gap-2"><button onClick={() => { setEditingAnn(ann); setShowAnnModal(true); }} className="p-3 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Edit size={18}/></button><button onClick={() => { if(confirm("Hapus?")) onUpdateData('Announcements', data.announcements.filter(a=>a.id!==ann.id)); }} className="p-3 bg-white text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button></div>}</div><p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                       </div>
                    ))}
                    {data.announcements.length === 0 && <div className="py-40 text-center text-slate-200 font-black italic uppercase tracking-widest">Tidak ada pengumuman aktif.</div>}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* EDIT MASTER ITEM MODAL (FOR ALL CATEGORIES) */}
      {showEditMasterModal && editingMasterItem && isSuperAdmin && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[7000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Koreksi Data {selectedCategory}</h3>
                  <button onClick={() => { setShowEditMasterModal(false); setEditingMasterItem(null); }} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
               </div>
               
               <form onSubmit={handleSaveMasterEdit} className="space-y-6">
                  {selectedCategory === 'Siswa' && (
                    <>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Nama Santri</label><input required type="text" value={editingMasterItem.name} onChange={e => setEditingMasterItem({...editingMasterItem, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">NISN</label><input required type="text" value={editingMasterItem.nis} onChange={e => setEditingMasterItem({...editingMasterItem, nis: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Kelas Madrasah (Identitas Utama)</label><input required type="text" value={editingMasterItem.formalClass} onChange={e => setEditingMasterItem({...editingMasterItem, formalClass: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                    </>
                  )}
                  {selectedCategory === 'Guru' && (
                    <>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Nama Lengkap</label><input required type="text" value={editingMasterItem.name} onChange={e => setEditingMasterItem({...editingMasterItem, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Mata Pelajaran</label><input required type="text" value={editingMasterItem.subject} onChange={e => setEditingMasterItem({...editingMasterItem, subject: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Nomor HP/WA</label><input required type="text" value={editingMasterItem.phone} onChange={e => setEditingMasterItem({...editingMasterItem, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                    </>
                  )}
                  {selectedCategory === 'Jadwal' && (
                    <>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Waktu Sesi</label><input required type="text" value={editingMasterItem.time} onChange={e => setEditingMasterItem({...editingMasterItem, time: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Mata Pelajaran</label><input required type="text" value={editingMasterItem.subject} onChange={e => setEditingMasterItem({...editingMasterItem, subject: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Nama Guru</label><input required type="text" value={editingMasterItem.teacherName} onChange={e => setEditingMasterItem({...editingMasterItem, teacherName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Unit Kelas</label><input required type="text" value={editingMasterItem.class} onChange={e => setEditingMasterItem({...editingMasterItem, class: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                    </>
                  )}
                  {(selectedCategory === 'ORSAM' || selectedCategory === 'ORKLAS') && (
                    <>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Jabatan</label><input required type="text" value={editingMasterItem.position} onChange={e => setEditingMasterItem({...editingMasterItem, position: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Nama Pengurus</label><input required type="text" value={editingMasterItem.name} onChange={e => setEditingMasterItem({...editingMasterItem, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase">Departemen / Unit</label><input required type="text" value={editingMasterItem.department || editingMasterItem.class} onChange={e => setEditingMasterItem({...editingMasterItem, [editingMasterItem.department !== undefined ? 'department' : 'class']: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold" /></div>
                    </>
                  )}

                  <button type="submit" className="w-full py-5 bg-emerald-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                     <Save size={18}/> Simpan Perubahan
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Unggah Data {uploadTarget}</h3>
                  <button onClick={() => setShowUploadModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
               </div>
               <div className="space-y-8">
                  {uploadTarget === 'Lainnya' && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul Kumpulan Data</label>
                        <input required type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="Contoh: Alumni 2024" />
                     </div>
                  )}
                  <div className="p-10 border-4 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4 hover:border-emerald-600 transition-colors group cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                     <Upload size={48} className="mx-auto text-slate-200 group-hover:text-emerald-600 transition-all"/>
                     <p className="text-xs font-black text-slate-400 uppercase">Klik Untuk Pilih File Master</p>
                     <p className="text-[8px] font-bold text-red-500 uppercase">Format Harus .xlsx Sesuai Template</p>
                     <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* KATALOG VP EDIT MODAL */}
      {showRegModal && editingReg && isSuperAdmin && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10"><h3 className="text-xl font-black text-slate-800 uppercase">Edit Katalog</h3><button onClick={() => setShowRegModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button></div>
               <form onSubmit={(e) => { e.preventDefault(); const target = regType === 'Violation' ? 'Violations' : 'Achievements'; const list = regType === 'Violation' ? data.violationTemplates : data.achievementTemplates; const updated = (editingReg as any)._exists ? list.map(t=>t.label===editingReg.label?editingReg:t) : [...list, editingReg]; onUpdateData(target, updated); setShowRegModal(false); }} className="space-y-6">
                  <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Aturan</label><input required type="text" value={editingReg.label} onChange={e => setEditingReg({...editingReg, label: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" /></div>
                  <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Poin VP</label><input required type="number" value={editingReg.points} onChange={e => setEditingReg({...editingReg, points: Number(e.target.value)})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" /></div><div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategori</label><select value={editingReg.category} onChange={e => setEditingReg({...editingReg, category: e.target.value as any})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-none appearance-none cursor-pointer">{Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                  <button type="submit" className="w-full py-5 bg-red-900 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl">Simpan Katalog</button>
               </form>
            </div>
         </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnModal && editingAnn && isSuperAdmin && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[6000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-10"><h3 className="text-xl font-black text-slate-800 uppercase">Tulis Pesan</h3><button onClick={() => setShowAnnModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button></div>
               <form onSubmit={(e) => { e.preventDefault(); const updated = editingAnn.id ? data.announcements.map(a=>a.id===editingAnn.id?editingAnn:a) : [{...editingAnn, id: Math.random().toString(36).substr(2,9), date: new Date().toLocaleDateString('id-ID')}, ...data.announcements]; onUpdateData('Announcements', updated); setShowAnnModal(false); }} className="space-y-6">
                  <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Judul</label><input required type="text" value={editingAnn.title} onChange={e => setEditingAnn({...editingAnn, title: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Konten</label><textarea required value={editingAnn.content} onChange={e => setEditingAnn({...editingAnn, content: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-medium text-xs h-40 shadow-inner resize-none" /></div>
                  <button type="submit" className="w-full py-5 bg-emerald-900 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-3"><Bell size={18}/> Publish</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default Information;
