// Reports view allows inputting violations or achievements for students
import React, { useState, useMemo } from 'react';
import { ReportItem, UserRole, ViolationCategory, Student, TemplateItem } from '../types';
import { ICONS } from '../constants';
import { Zap, Info, Search, Hammer, GraduationCap, Clock, ListChecks, ArrowRight, User as UserIcon, CheckCircle, ShieldCheck, Heart } from 'lucide-react';

interface ReportsProps {
  type: 'Violation' | 'Achievement';
  onSave: (report: ReportItem) => void;
  role: UserRole;
  currentUser: string;
  students: Student[];
  allReports: ReportItem[];
  templates: TemplateItem[];
}

const Reports: React.FC<ReportsProps> = ({ type, onSave, role, currentUser, students, allReports, templates }) => {
  const [view, setView] = useState<'input' | 'history'>('input');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [category, setCategory] = useState<ViolationCategory>(ViolationCategory.KEDISIPLINAN);
  const [points, setPoints] = useState(0);
  const [description, setDescription] = useState('');

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.nis.includes(searchTerm)
    )
  , [students, searchTerm]);

  const personalHistory = useMemo(() => 
    allReports.filter(r => r.type === type && r.reporter === currentUser)
  , [allReports, type, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedTemplate) return;

    const newReport: ReportItem = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudent.id,
      type,
      category,
      description: selectedTemplate,
      points,
      date: new Date().toLocaleDateString('id-ID'),
      reporter: currentUser,
      status: 'Pending',
      actionNote: description
    };

    onSave(newReport);
    alert(`Laporan ${type === 'Violation' ? 'Pelanggaran' : 'Prestasi'} Berhasil Terkirim!`);
    setSelectedStudent(null);
    setSearchTerm('');
    setDescription('');
    setPoints(0);
    setSelectedTemplate('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit shadow-inner">
        <button onClick={() => setView('input')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'input' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}>Form Input</button>
        <button onClick={() => setView('history')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}>Inputan Saya</button>
      </div>

      {view === 'input' ? (
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-inner ${type === 'Violation' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {type === 'Violation' ? ICONS.Violations : ICONS.Achievements}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Input Laporan {type === 'Violation' ? 'Pelanggaran' : 'Prestasi'}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic italic">Amanah adalah tanggung jawab di hadapan Allah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <UserIcon size={20} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identitas Pelapor</p>
                  <p className="text-xs font-black text-emerald-800">{currentUser}</p>
               </div>
            </div>
          </div>

          <div className="mb-12 p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-start gap-4 italic shadow-sm">
             <Heart className="text-emerald-600 shrink-0 mt-1" size={20} />
             <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                "Barakallahu Fiikum, Ustadz/ah. Mohon catat laporan ini dengan sejujur-jujurnya demi kebaikan dan perkembangan karakter santri Mahasina."
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-2">Cari Santri Sasaran</label>
              <div className="relative">
                <Search className="absolute left-6 top-5 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }}
                  placeholder="Ketik Nama Lengkap atau NIS Santri..."
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] outline-none font-bold shadow-inner transition-all"
                />
              </div>
              {searchTerm && !selectedStudent && (
                <div className="absolute z-50 w-full mt-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl max-h-72 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95">
                  {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setSearchTerm(s.name); }} className="w-full text-left px-8 py-5 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                      <div>
                        <p className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{s.name}</p>
                        {/* Fix: Change s.class to s.formalClass since Student interface uses formalClass */}
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.nis} • KELAS {s.formalClass}</p>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )) : (
                    <div className="p-10 text-center text-slate-300 text-xs italic font-medium">Santri tidak ditemukan...</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Katalog {type === 'Violation' ? 'Pelanggaran' : 'Prestasi'}</label>
                <select value={selectedTemplate} onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTemplate(val);
                  const t = templates.find(item => item.label === val);
                  if (t) { setPoints(t.points); setCategory(t.category as ViolationCategory); }
                }} className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] outline-none font-black text-sm appearance-none cursor-pointer">
                  <option value="">-- Pilih dari Peraturan --</option>
                  {templates.map(t => <option key={t.label} value={t.label}>{t.label} ({t.points} P)</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Poin Kalkulasi</label>
                <div className={`w-full px-8 py-5 bg-slate-100 rounded-[2rem] font-black text-3xl text-center border-2 border-transparent flex items-center justify-center gap-3 ${type === 'Violation' ? 'text-red-600' : 'text-emerald-600'}`}>
                   {type === 'Violation' ? '-' : '+'} {points} <span className="text-[10px] uppercase tracking-widest text-slate-400">Poin</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Catatan Tambahan / Kronologi Singkat</label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tambahkan detail jika diperlukan (Waktu, tempat, atau keterangan tambahan)..." className="w-full p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2.5rem] outline-none font-medium shadow-inner transition-all" />
            </div>

            <button type="submit" disabled={!selectedStudent || !selectedTemplate} className={`w-full py-7 rounded-[3rem] font-black text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${!selectedStudent || !selectedTemplate ? 'bg-slate-300 opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/20'}`}>
              <CheckCircle size={24} />
              <span className="uppercase tracking-[0.2em]">KIRIM LAPORAN SEBAGAI {role.split(' ')[0].toUpperCase()}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50">
           <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center text-center">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Riwayat Inputan Saya ({type === 'Violation' ? 'Pelanggaran' : 'Prestasi'})</h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{personalHistory.length} Laporan</div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b text-center">
                  <tr>
                    <th className="px-10 py-7 text-left">Santri</th>
                    <th className="px-10 py-7 text-left">Deskripsi</th>
                    <th className="px-10 py-7">Poin</th>
                    <th className="px-10 py-7 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center">
                  {personalHistory.map(r => {
                    const s = students.find(std => std.id === r.studentId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-10 py-7 text-left">
                           <p className="font-black text-slate-800">{s?.name || 'Santri Terhapus'}</p>
                           {/* Fix: Change s?.class to s?.formalClass since Student interface uses formalClass */}
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">KELAS {s?.formalClass}</p>
                        </td>
                        <td className="px-10 py-7 text-left text-slate-600 text-xs font-medium max-w-xs truncate">{r.description}</td>
                        <td className={`px-10 py-7 text-center font-black text-base ${type === 'Violation' ? 'text-red-600' : 'text-emerald-600'}`}>{type === 'Violation' ? '-' : '+'}{r.points}</td>
                        <td className="px-10 py-7 text-right text-slate-400 text-[10px] font-black uppercase">{r.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
             {personalHistory.length === 0 && <div className="py-32 text-center text-slate-300 italic text-sm font-medium">Belum ada riwayat laporan yang Anda buat.</div>}
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;