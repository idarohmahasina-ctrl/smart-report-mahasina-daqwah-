
import React, { useState, useMemo } from 'react';
import { 
  AttendanceRecord, PrayerRecord, TeacherAttendance, ReportItem, Student, 
  UserRole
} from '../types.ts';
import { 
  ShieldCheck, Lock, Trash2, Search, Database, 
  X, Check, AlertTriangle, Download, FileText, UserCheck, Zap,
  AlertCircle, RefreshCcw, ShieldAlert, Sparkles, User, Key
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { resetFirestoreData, getActiveSession, seedDemoData } from '../services/dataService.ts';
import { 
  DEMO_STUDENTS, DEMO_TEACHERS, DEMO_SCHEDULES, DEMO_ATTENDANCE, 
  DEMO_REPORTS, DEMO_TEACHER_ATTENDANCE, DEMO_PRAYER 
} from '../constants.tsx';

interface ControlPanelProps {
  data: {
    attendance: AttendanceRecord[];
    prayerAttendance: PrayerRecord[];
    teacherAttendance: TeacherAttendance[];
    reports: ReportItem[];
    students: Student[];
  };
  actions: {
    deleteAttendance: (id: string) => void;
    deletePrayer: (id: string) => void;
    deleteReport: (id: string) => void;
  };
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, actions }) => {
  const [activeModul, setActiveModul] = useState<'absen-santri' | 'absen-pondok' | 'pelanggaran' | 'prestasi'>('absen-santri');
  const [searchTerm, setSearchTerm] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const profile = getActiveSession();
  const isSuperAdmin = profile?.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '7777') {
      setIsAuthorized(true);
    } else {
      alert("PIN Salah! Akses ditolak.");
      setPin('');
    }
  };

  const filteredData = useMemo(() => {
    let list: any[] = [];
    if (activeModul === 'absen-santri') list = data.attendance || [];
    else if (activeModul === 'absen-pondok') list = data.prayerAttendance || [];
    else if (activeModul === 'pelanggaran') list = (data.reports || []).filter(r => r.type === 'Violation');
    else if (activeModul === 'prestasi') list = (data.reports || []).filter(r => r.type === 'Achievement');

    return list.filter(item => {
      const studentName = data.students?.find(s => s.id === item.studentId)?.name || '';
      const reporterName = (item.recordedBy || item.reporter || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             desc.includes(searchTerm.toLowerCase()) ||
             reporterName.includes(searchTerm.toLowerCase());
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [activeModul, data, searchTerm]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 w-full max-w-md text-center space-y-8">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={40} />
           </div>
           <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Area Terbatas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Masukkan PIN Admin Idaroh</p>
           </div>
           <form onSubmit={handleVerifyPin} className="space-y-6">
              <input 
                type="password" 
                maxLength={4} 
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full text-center py-6 text-4xl font-black tracking-[0.5em] bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-emerald-600 outline-none transition-all shadow-inner"
                autoFocus
              />
              <button type="submit" className="w-full py-5 bg-[#064e3b] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-emerald-900 active:scale-95 transition-all flex items-center justify-center gap-3">
                 <Key size={18}/> Buka Panel Kontrol
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-emerald-950 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md shadow-2xl shrink-0"><Database size={32} /></div>
              <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Panel Kontrol</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-4 flex items-center gap-2"><ShieldCheck size={12}/> Manajemen Log Mahasina Cloud</p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0 overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'absen-santri', label: 'Absen Santri' },
                { id: 'absen-pondok', label: 'Absen Pondok' },
                { id: 'pelanggaran', label: 'Pelanggaran' },
                { id: 'prestasi', label: 'Prestasi' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveModul(tab.id as any)} className={`px-5 py-3 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeModul === tab.id ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-xl space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
               <input type="text" placeholder={`Cari data di log ${activeModul}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm shadow-inner transition-all" />
            </div>
            <button onClick={() => downloadCSV(filteredData, `Master_Export_${activeModul}`)} className="px-8 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-3 hover:bg-emerald-800 transition-all active:scale-95"><Download size={18}/> Ekspor Log CSV</button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Santri / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktivitas / Waktu</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Petugas</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Detail</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-6 pr-4">
                         <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{data.students?.find(s => s.id === item.studentId)?.name || 'Data Dihapus'}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">KELAS: {item.class}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.category || item.type}</p>
                         <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase">{item.date} • {item.time || item.recordedTime || item.timestamp}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-2 text-emerald-700">
                            <User size={14} className="opacity-40" />
                            <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{item.recordedBy || item.reporter || 'Sistem'}</p>
                         </div>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak' || activeModul === 'prestasi' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{item.status || (activeModul === 'pelanggaran' || activeModul === 'prestasi' ? `${item.points} PT` : '-')}</span>
                            {(activeModul === 'pelanggaran' || activeModul === 'prestasi') && item.photoUrl && (
                               <div onClick={() => window.open(item.photoUrl)} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:scale-110 transition-transform shadow-sm shrink-0">
                                  <img src={item.photoUrl} className="w-full h-full object-cover" />
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="py-6">
                         <div className="flex justify-center gap-3">
                            <button onClick={() => { if(confirm("Hapus data ini?")) { if(activeModul === 'absen-santri') actions.deleteAttendance(item.id); else if(activeModul === 'absen-pondok') actions.deletePrayer(item.id); else actions.deleteReport(item.id); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                         </div>
                    </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {filteredData.length === 0 && (
               <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Belum Ada Data Log</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ControlPanel;
