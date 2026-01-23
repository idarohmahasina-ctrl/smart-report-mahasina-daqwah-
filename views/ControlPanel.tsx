
import React, { useState, useMemo } from 'react';
import { 
  AttendanceRecord, PrayerRecord, TeacherAttendance, ReportItem, Student, 
  UserRole, AppData, AttendanceStatus, ViolationCategory, PrayerStatus, PrayerTime
} from '../types.ts';
import { 
  ShieldCheck, Lock, Trash2, Search, Database, 
  X, Check, AlertTriangle, Download, FileText, UserCheck, Zap,
  AlertCircle, RefreshCcw, ShieldAlert, Sparkles, User, Key, GraduationCap, CheckCircle, Edit, Save, Calendar, Clock
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { resetFirestoreData, getActiveSession, seedDemoData, saveAppData } from '../services/dataService.ts';

interface ControlPanelProps {
  data: AppData;
  actions: {
    deleteAttendance: (id: string) => void;
    deletePrayer: (id: string) => void;
    deleteReport: (id: string) => void;
    deleteTeacherAttendance: (id: string) => void;
    updateAttendance: (updated: AttendanceRecord) => void;
    updatePrayer: (updated: PrayerRecord) => void;
    updateReport: (updated: ReportItem) => void;
    updateTeacherAttendance: (updated: TeacherAttendance) => void;
  };
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, actions }) => {
  const [activeModul, setActiveModul] = useState<'absen-kbm' | 'absen-pondok' | 'absen-guru' | 'pelanggaran' | 'prestasi'>('absen-kbm');
  const [searchTerm, setSearchTerm] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [filterDate, setFilterDate] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('Semua');

  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '7777') setIsAuthorized(true);
    else { alert("PIN Salah!"); setPin(''); }
  };

  const filteredData = useMemo(() => {
    let list: any[] = [];
    if (activeModul === 'absen-kbm') list = data.attendance || [];
    else if (activeModul === 'absen-pondok') list = data.prayerAttendance || [];
    else if (activeModul === 'absen-guru') list = data.teacherAttendance || [];
    else if (activeModul === 'pelanggaran') list = (data.reports || []).filter(r => r.type === 'Violation');
    else if (activeModul === 'prestasi') list = (data.reports || []).filter(r => r.type === 'Achievement');

    return list.filter(item => {
      const student = data.students?.find(s => s.id === item.studentId);
      const searchStr = `${student?.name || ''} ${item.teacherName || ''} ${item.recordedBy || item.reporter || ''}`.toLowerCase();
      const matchSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchClass = filterClass === 'Semua' || item.class === filterClass || student?.formalClass === filterClass;
      
      let matchDate = true;
      if (filterDate) {
        const [d, m, y] = item.date.split('/').map(Number);
        const itemIsoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        matchDate = itemIsoDate === filterDate;
      }

      return matchSearch && matchClass && matchDate;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [activeModul, data, searchTerm, filterDate, filterClass]);

  const handleUpdate = () => {
    if (!editingItem) return;
    if (activeModul === 'absen-kbm') actions.updateAttendance(editingItem);
    else if (activeModul === 'absen-pondok') actions.updatePrayer(editingItem);
    else if (activeModul === 'absen-guru') actions.updateTeacherAttendance(editingItem);
    else actions.updateReport(editingItem);
    setEditingItem(null);
    alert("Audit Data Berhasil Diperbarui!");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in zoom-in-95">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border w-full max-w-md text-center space-y-8">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto"><Lock size={40} /></div>
           <h2 className="text-xl font-black uppercase text-slate-800">Audit Authority</h2>
           <form onSubmit={handleVerifyPin} className="space-y-6">
              <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="****" className="w-full text-center py-6 text-4xl font-black tracking-[0.5em] bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-emerald-600 outline-none" autoFocus />
              <button type="submit" className="w-full py-5 bg-[#064e3b] text-white rounded-[2rem] font-black uppercase text-[11px] shadow-xl">Buka Audit Panel</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-in fade-in max-w-6xl mx-auto">
      <div className="bg-emerald-950 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 backdrop-blur-md"><Database size={32} /></div>
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Pusat Kendali & Audit</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3">Validasi Data • Jam Input • Identitas Petugas</p>
              </div>
           </div>
           <div className="flex flex-wrap bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm gap-1">
              {['absen-kbm', 'absen-pondok', 'absen-guru', 'pelanggaran', 'prestasi'].map(tab => (
                <button key={tab} onClick={() => setActiveModul(tab as any)} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase transition-all ${activeModul === tab ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>{tab.replace('-', ' ')}</button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border shadow-xl space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative flex-1">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={20}/></span>
               <input type="text" placeholder="Cari nama santri/guru/petugas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-bold text-sm shadow-inner" />
            </div>
            <div className="space-y-1">
               <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black outline-none border border-transparent focus:border-emerald-600" />
            </div>
            <button onClick={() => downloadCSV(filteredData, `Log_Audit_${activeModul}`)} className="px-8 py-4 bg-emerald-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-3"><Download size={18}/> Ekspor Audit Detail</button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[900px]">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Objek Data</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Sesi/Laporan</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Detail</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Audit Petugas & Jam</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-6 pr-4">
                         <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{item.teacherName || data.students?.find(s => s.id === item.studentId)?.name || 'Data Dihapus'}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">KELAS: {item.class}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.category || item.subject || item.type}</p>
                         <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase">{item.date}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak' || activeModul === 'prestasi' || activeModul === 'absen-guru' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{item.status || (activeModul === 'pelanggaran' || activeModul === 'prestasi' ? `${item.points} PT` : 'HADIR')}</span>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-800">
                               <User size={12} className="text-emerald-500" />
                               <p className="text-[10px] font-black uppercase">{item.recordedBy || item.reporter || item.teacherName || 'Sistem'}</p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                               <Clock size={12} />
                               <p className="text-[9px] font-bold uppercase">{item.startTime || item.time || item.recordedTime || '-'} WIB</p>
                            </div>
                         </div>
                      </td>
                      <td className="py-6">
                         <div className="flex justify-center gap-2">
                            <button onClick={() => setEditingItem({ ...item })} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit size={16}/></button>
                            <button onClick={() => { if(confirm("Hapus permanen log ini?")) { if(activeModul === 'absen-kbm') actions.deleteAttendance(item.id); else if(activeModul === 'absen-pondok') actions.deletePrayer(item.id); else if(activeModul === 'absen-guru') actions.deleteTeacherAttendance(item.id); else actions.deleteReport(item.id); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tight">Koreksi Log Audit</h3><button onClick={() => setEditingItem(null)} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-red-600"><X/></button></div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koreksi Status</label>
                    <select value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm uppercase shadow-inner">
                      {activeModul === 'absen-kbm' && Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      {activeModul === 'absen-pondok' && Object.values(PrayerStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      {(activeModul === 'pelanggaran' || activeModul === 'prestasi') && ['Belum Ditindak', 'Ditindak'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Koreksi</label>
                    <textarea value={editingItem.note || editingItem.description || editingItem.summary || ''} onChange={e => { const val = e.target.value; if (activeModul === 'absen-kbm' || activeModul === 'absen-pondok') setEditingItem({...editingItem, note: val}); else if (activeModul === 'absen-guru') setEditingItem({...editingItem, summary: val}); else setEditingItem({...editingItem, description: val}); }} className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm min-h-[100px] shadow-inner" />
                 </div>
              </div>
              <button onClick={handleUpdate} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3"><Save size={18}/> Update Data Audit</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
