
import React, { useState, useMemo } from 'react';
import { 
  AttendanceRecord, PrayerRecord, TeacherAttendance, ReportItem, Student, 
  AttendanceStatus, PrayerStatus, UserRole
} from '../types';
import { 
  ShieldCheck, Lock, Trash2, Edit3, Search, Filter, Database, 
  ChevronDown, X, Check, AlertTriangle, Download, FileText, UserCheck, Zap,
  AlertCircle
} from 'lucide-react';
import { downloadCSV } from '../utils/csvExport';

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
    updateAttendance: (record: AttendanceRecord) => void;
    deletePrayer: (id: string) => void;
    updatePrayer: (record: PrayerRecord) => void;
    deleteTeacherAttendance: (id: string) => void;
    deleteReport: (id: string) => void;
    updateReport: (record: ReportItem) => void;
  };
  userEmail: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, actions, userEmail }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeModul, setActiveModul] = useState<'absen-guru' | 'absen-santri' | 'absen-sholat' | 'laporan'>('absen-santri');
  const [searchTerm, setSearchTerm] = useState('');

  const isSuperAdmin = userEmail.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin === '7777') {
        setIsAuthenticated(true);
      } else if (newPin.length === 4) {
        alert("PIN Salah! Akses Ditolak.");
        setPin('');
      }
    }
  };

  const filteredData = useMemo(() => {
    let list: any[] = [];
    if (activeModul === 'absen-santri') list = data.attendance || [];
    else if (activeModul === 'absen-sholat') list = data.prayerAttendance || [];
    else if (activeModul === 'absen-guru') list = data.teacherAttendance || [];
    else list = data.reports || [];

    return list.filter(item => {
      const studentName = data.students?.find(s => s.id === (item.studentId || ''))?.name || item.teacherName || '';
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.class || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  }, [activeModul, data, searchTerm]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
        <div className="bg-white w-full max-sm rounded-[3rem] shadow-2xl border border-slate-50 p-10 text-center space-y-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Lock size={36} className="animate-pulse" /></div>
          <div><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">PIN Keamanan Admin</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Area ini hanya untuk Idaroh Mahasina</p></div>
          <div className="flex justify-center gap-4">{[1, 2, 3, 4].map(idx => (<div key={idx} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length >= idx ? 'bg-emerald-600 border-emerald-600 scale-125' : 'bg-slate-50 border-slate-200'}`} />))}</div>
          <div className="grid grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(key => (<button key={key.toString()} onClick={() => { if (key === 'C') setPin(''); else if (key === '←') setPin(pin.slice(0, -1)); else handlePinInput(key.toString()); }} className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-800 font-black text-lg transition-all active:scale-90 flex items-center justify-center shadow-sm">{key}</button>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto px-2">
      <div className="bg-emerald-950 p-6 md:p-14 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-6 md:gap-8 w-full md:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md shadow-2xl shrink-0"><Database size={32} /></div>
              <div>
                 <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-none">Panel Kontrol</h2>
                 <p className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3 md:mt-4 flex items-center gap-2"><ShieldCheck size={12}/> Otoritas Idaroh</p>
              </div>
           </div>
           
           <div className="w-full md:w-auto overflow-hidden">
             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner overflow-x-auto no-scrollbar gap-1 max-w-full">
                {[
                  { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={14}/> },
                  { id: 'absen-sholat', label: 'Absen Sholat', icon: <Zap size={14}/> },
                  { id: 'absen-guru', label: 'Absen Guru', icon: <FileText size={14}/> },
                  { id: 'laporan', label: 'Laporan VP', icon: <ShieldCheck size={14}/> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveModul(tab.id as any)} className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeModul === tab.id ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[4rem] border border-slate-50 shadow-xl space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
               <input type="text" placeholder={`Cari di ${activeModul}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm shadow-inner transition-all" />
            </div>
            <button onClick={() => downloadCSV(filteredData, `Master_Export_${activeModul}`)} className="w-full md:w-auto px-8 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-3 hover:bg-emerald-800 transition-all active:scale-95"><Download size={18}/> Ekspor CSV</button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Objek / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Sesi</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Nilai</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu Input</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => {
                    const student = data.students?.find(s => s.id === (item.studentId || ''));
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{student?.name || item.teacherName || 'Data Dihapus'}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Unit: {item.class || '-'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.subject || (item.type === 'Violation' ? 'Pelanggaran' : 'Prestasi')}</p>
                           <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase truncate max-w-[150px]">{item.description || item.subject || 'Catatan'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ (item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800' }`}>{item.status || '-'}</span>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[10px] font-bold text-slate-600">{item.date || '-'} {item.recordedTime || item.timestamp || item.checkInTime || ''}</p>
                        </td>
                        <td className="py-6"><div className="flex justify-center gap-2 md:gap-3"><button onClick={() => { if(confirm("Hapus data ini?")) { if(activeModul === 'absen-santri') actions.deleteAttendance(item.id); else if(activeModul === 'absen-sholat') actions.deletePrayer(item.id); else if(activeModul === 'absen-guru') actions.deleteTeacherAttendance(item.id); else actions.deleteReport(item.id); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button></div></td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ControlPanel;
