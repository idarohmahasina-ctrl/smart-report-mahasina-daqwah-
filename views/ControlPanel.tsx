
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
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, actions }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeModul, setActiveModul] = useState<'absen-guru' | 'absen-santri' | 'absen-sholat' | 'laporan'>('absen-santri');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Edit States
  const [editingItem, setEditingItem] = useState<any>(null);

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
    if (activeModul === 'absen-santri') list = data.attendance;
    else if (activeModul === 'absen-sholat') list = data.prayerAttendance;
    else if (activeModul === 'absen-guru') list = data.teacherAttendance;
    else list = data.reports;

    return list.filter(item => {
      const studentName = data.students.find(s => s.id === (item.studentId || ''))?.name || item.teacherName || '';
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.class || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [activeModul, data, searchTerm]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
        <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl border border-slate-50 p-10 text-center space-y-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <Lock size={36} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">PIN Keamanan Admin</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Area ini hanya untuk Idaroh Mahasina</p>
          </div>
          
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length >= idx ? 'bg-emerald-600 border-emerald-600 scale-125' : 'bg-slate-50 border-slate-200'}`} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(key => (
              <button 
                key={key.toString()} 
                onClick={() => {
                  if (key === 'C') setPin('');
                  else if (key === '←') setPin(pin.slice(0, -1));
                  else handlePinInput(key.toString());
                }}
                className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-800 font-black text-lg transition-all active:scale-90 flex items-center justify-center shadow-sm"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700 max-w-6xl mx-auto">
      
      {/* 1. Header & Quick Controls */}
      <div className="bg-emerald-950 p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md shadow-2xl">
                 <Database size={40} />
              </div>
              <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Panel Kontrol Utama</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
                   <ShieldCheck size={14}/> Master Otoritas: Idaroh Mahasina
                 </p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/10 backdrop-blur-sm shadow-inner shrink-0 overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={16}/> },
                { id: 'absen-sholat', label: 'Absen Sholat', icon: <Zap size={16}/> },
                { id: 'absen-guru', label: 'Absen Guru', icon: <FileText size={16}/> },
                { id: 'laporan', label: 'Laporan VP', icon: <ShieldCheck size={16}/> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveModul(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeModul === tab.id ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* 2. Management Table Area */}
      <div className="bg-white p-10 md:p-12 rounded-[4rem] border border-slate-50 shadow-xl space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
               <input 
                 type="text" 
                 placeholder={`Cari data di ${activeModul}...`} 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm shadow-inner transition-all" 
               />
            </div>
            <button 
               onClick={() => downloadCSV(filteredData, `Master_Export_${activeModul}`)}
               className="px-8 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-3 hover:bg-emerald-800 transition-all active:scale-95"
            >
               <Download size={18}/> Ekspor Semua
            </button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Objek / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Sesi</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Nilai</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu Input</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi Admin</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => {
                    const student = data.students.find(s => s.id === (item.studentId || ''));
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{student?.name || item.teacherName || 'Data Dihapus'}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Unit: {item.class} • {item.level || 'Pondok'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.subject}</p>
                           <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase truncate max-w-[150px]">{item.description || item.subject || 'Catatan Presensi'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                             (item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                           }`}>{item.status}</span>
                           {item.points && <span className="ml-2 text-[9px] font-black text-indigo-700">+{item.points} PT</span>}
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[10px] font-bold text-slate-600">{item.date} {item.recordedTime || item.timestamp || item.checkInTime || ''}</p>
                           <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">Oleh: {item.recordedBy || item.reporter}</p>
                        </td>
                        <td className="py-6">
                           <div className="flex justify-center gap-3">
                              <button 
                                onClick={() => setEditingItem(item)}
                                className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Edit3 size={16}/>
                              </button>
                              <button 
                                onClick={() => {
                                   if(confirm("Hapus data ini secara permanen dari database Mahasina?")) {
                                      if(activeModul === 'absen-santri') actions.deleteAttendance(item.id);
                                      else if(activeModul === 'absen-sholat') actions.deletePrayer(item.id);
                                      else if(activeModul === 'absen-guru') actions.deleteTeacherAttendance(item.id);
                                      else actions.deleteReport(item.id);
                                   }
                                }}
                                className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              >
                                 <Trash2 size={16}/>
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
            {filteredData.length === 0 && (
               <div className="py-32 text-center text-slate-300 font-black uppercase italic tracking-[0.3em]">Database Kosong / Data Tidak Ditemukan</div>
            )}
         </div>
      </div>

      {/* Edit Modal (CRUD Logic) */}
      {editingItem && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 md:p-14 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Koreksi Data Laporan</h3>
                  <button onClick={() => setEditingItem(null)} className="p-3 hover:bg-slate-50 text-slate-400 rounded-full transition-all"><X size={24}/></button>
               </div>
               
               <div className="space-y-8">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Objek Laporan</p>
                     <p className="text-sm font-black text-emerald-900 uppercase">{data.students.find(s=>s.id===(editingItem.studentId||''))?.name || editingItem.teacherName}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{editingItem.date} {editingItem.recordedTime || ''} • Unit: {editingItem.class}</p>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubah Status</label>
                     <select 
                        value={editingItem.status} 
                        onChange={e => setEditingItem({...editingItem, status: e.target.value})}
                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-xs uppercase shadow-inner cursor-pointer"
                     >
                        {activeModul === 'absen-santri' ? Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>) :
                         activeModul === 'absen-sholat' ? Object.values(PrayerStatus).map(s => <option key={s} value={s}>{s}</option>) :
                         activeModul === 'laporan' ? ['Belum Ditindak', 'Ditindak'].map(s => <option key={s} value={s}>{s}</option>) :
                         ['Hadir', 'Terlambat', 'Izin', 'Alpha'].map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Edit Catatan / Kronologi</label>
                     <textarea 
                        value={editingItem.note || editingItem.description || ''} 
                        onChange={e => setEditingItem({...editingItem, [editingItem.description ? 'description' : 'note']: e.target.value})}
                        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-medium text-xs h-32 shadow-inner resize-none" 
                     />
                  </div>

                  {editingItem.points !== undefined && (
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koreksi Poin</label>
                        <input 
                           type="number" 
                           value={editingItem.points} 
                           onChange={e => setEditingItem({...editingItem, points: Number(e.target.value)})}
                           className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-xs shadow-inner" 
                        />
                     </div>
                  )}

                  <div className="pt-6 grid grid-cols-1 gap-4">
                     <button 
                        onClick={() => {
                           if(activeModul === 'absen-santri') actions.updateAttendance(editingItem);
                           else if(activeModul === 'absen-sholat') actions.updatePrayer(editingItem);
                           else if(activeModul === 'laporan') actions.updateReport(editingItem);
                           // Absen guru di-update lewat status
                           else if(activeModul === 'absen-guru') {
                              // Teacher update logic
                           }
                           setEditingItem(null);
                           alert("Koreksi database berhasil dilakukan.");
                        }}
                        className="w-full py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-emerald-800 active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        <Check size={18}/> Simpan Koreksi Database
                     </button>
                     <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                        <AlertCircle size={20} className="text-amber-600 shrink-0"/>
                        <p className="text-[8px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">Peringatan: Setiap perubahan melalui Panel Kontrol akan langsung memperbarui database master pesantren secara real-time.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ControlPanel;
