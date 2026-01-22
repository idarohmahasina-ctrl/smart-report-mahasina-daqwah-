
import React, { useState, useMemo } from 'react';
import { 
  AttendanceRecord, PrayerRecord, TeacherAttendance, ReportItem, Student, 
  UserRole, AppData, AttendanceStatus, ViolationCategory, PrayerStatus, PrayerTime
} from '../types.ts';
import { 
  ShieldCheck, Lock, Trash2, Search, Database, 
  X, Check, AlertTriangle, Download, FileText, UserCheck, Zap,
  AlertCircle, RefreshCcw, ShieldAlert, Sparkles, User, Key, GraduationCap, CheckCircle, Edit, Save, Calendar
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { resetFirestoreData, getActiveSession, seedDemoData, saveAppData } from '../services/dataService.ts';
import { 
  DEMO_STUDENTS, DEMO_TEACHERS, DEMO_SCHEDULES, DEMO_ATTENDANCE, 
  DEMO_REPORTS, DEMO_TEACHER_ATTENDANCE, DEMO_PRAYER 
} from '../constants.tsx';

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

  // Filters State
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>('Semua');
  const [filterClass, setFilterClass] = useState<string>('Semua');
  const [filterLevel, setFilterLevel] = useState<string>('Semua');
  const [filterGender, setFilterGender] = useState<string>('Semua');

  // Editing State
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    data.students?.forEach(s => { if (s.formalClass) cls.add(s.formalClass); });
    return Array.from(cls).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [data.students]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '7777') {
      setIsAuthorized(true);
    } else {
      alert("PIN Salah! Akses ditolak.");
      setPin('');
    }
  };

  const handleSeedSamples = async () => {
    if (confirm("Gunakan data sampel untuk simulasi aplikasi? Ini akan menambahkan santri, jadwal, dan laporan demo.")) {
       const demo: Partial<AppData> = {
          students: DEMO_STUDENTS,
          teachers: DEMO_TEACHERS,
          schedules: DEMO_SCHEDULES,
          attendance: DEMO_ATTENDANCE,
          reports: DEMO_REPORTS,
          teacherAttendance: DEMO_TEACHER_ATTENDANCE,
          prayerAttendance: DEMO_PRAYER
       };
       await saveAppData(demo);
       alert("Data Sampel Berhasil Dimasukkan!");
       window.location.reload();
    }
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
      const studentName = student?.name || '';
      const teacherName = (item.teacherName || '').toLowerCase();
      const reporterName = (item.recordedBy || item.reporter || '').toLowerCase();
      const desc = (item.description || item.summary || '').toLowerCase();
      
      const matchSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          teacherName.includes(searchTerm.toLowerCase()) ||
                          desc.includes(searchTerm.toLowerCase()) ||
                          reporterName.includes(searchTerm.toLowerCase());
      
      // Date Filter
      let matchDate = true;
      if (filterDate) {
        const [d, m, y] = item.date.split('/').map(Number);
        const itemIsoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        matchDate = itemIsoDate === filterDate;
      }

      // Session Filter
      const itemSess = item.sessionType || item.prayerTime || 'Umum';
      const matchSess = filterSession === 'Semua' || itemSess === filterSession;

      // Other Filters
      const matchClass = filterClass === 'Semua' || item.class === filterClass || student?.formalClass === filterClass;
      const matchLvl = filterLevel === 'Semua' || student?.level === filterLevel;
      const matchGdr = filterGender === 'Semua' || student?.gender === filterGender;

      return matchSearch && matchDate && matchSess && matchClass && matchLvl && matchGdr;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [activeModul, data, searchTerm, filterDate, filterSession, filterClass, filterLevel, filterGender]);

  const handleUpdate = () => {
    if (!editingItem) return;
    if (activeModul === 'absen-kbm') actions.updateAttendance(editingItem);
    else if (activeModul === 'absen-pondok') actions.updatePrayer(editingItem);
    else if (activeModul === 'absen-guru') actions.updateTeacherAttendance(editingItem);
    else actions.updateReport(editingItem);
    
    setEditingItem(null);
    alert("Data berhasil diperbarui!");
  };

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
      <div className="bg-emerald-950 p-8 sm:p-12 rounded-[3rem] sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-8 w-full md:w-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md shadow-2xl shrink-0"><Database size={32} /></div>
              <div>
                 <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">Panel Kontrol</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3 sm:mt-4 flex items-center gap-2"><ShieldCheck size={12}/> Manajemen Log Mahasina Cloud</p>
              </div>
           </div>
           
           <div className="flex flex-wrap bg-white/5 p-1.5 rounded-[1.5rem] sm:rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner w-full md:w-auto justify-center md:justify-start gap-1">
              {[
                { id: 'absen-kbm', label: 'Absen KBM' },
                { id: 'absen-pondok', label: 'Absen Pondok' },
                { id: 'absen-guru', label: 'Absen Guru' },
                { id: 'pelanggaran', label: 'Pelanggaran' },
                { id: 'prestasi', label: 'Prestasi' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => {
                    setActiveModul(tab.id as any);
                    setFilterSession('Semua');
                  }} 
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeModul === tab.id ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-12 rounded-[3rem] sm:rounded-[4rem] border border-slate-50 shadow-xl space-y-10">
         
         {/* Filter Section */}
         <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1 col-span-2 lg:col-span-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Pilih Tanggal</label>
               <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-emerald-600" />
            </div>
            
            {activeModul.includes('absen') ? (
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                 <select value={filterSession} onChange={e => setFilterSession(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer appearance-none">
                    <option value="Semua">Semua</option>
                    {activeModul === 'absen-kbm' || activeModul === 'absen-guru' ? (
                      ['Madrasah', 'Hadis-Aswaja', 'Kitab Kuning', 'Al-Quran'].map(s => <option key={s} value={s}>{s}</option>)
                    ) : (
                      Object.values(PrayerTime).map(s => <option key={s} value={s}>{s}</option>)
                    )}
                 </select>
              </div>
            ) : (
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                 <select disabled className="w-full p-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase outline-none opacity-40">
                    <option>Tidak Berlaku</option>
                 </select>
              </div>
            )}

            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Kelas</label>
               <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer">
                  <option value="Semua">Semua</option>
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
               <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer">
                  <option value="Semua">Semua</option>
                  <option value="MTs">MTs</option>
                  <option value="MA">MA</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Gender</label>
               <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer">
                  <option value="Semua">Semua</option>
                  <option value="Putra">Putra</option>
                  <option value="Putri">Putri</option>
               </select>
            </div>
         </div>

         <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t">
            <div className="relative flex-1 w-full">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
               <input type="text" placeholder={`Cari nama santri/guru di log ${activeModul}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm shadow-inner transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSeedSamples} className="px-6 py-5 bg-blue-50 text-blue-700 border border-blue-100 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center gap-3 hover:bg-blue-100 transition-all">
                 <Sparkles size={18}/> Sampel
              </button>
              <button onClick={() => downloadCSV(filteredData, `Log_Export_${activeModul}`)} className="px-8 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-3 hover:bg-emerald-800 transition-all active:scale-95"><Download size={18}/> Ekspor</button>
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeModul === 'absen-guru' ? 'Pengajar' : 'Santri / Unit'}</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktivitas / Waktu</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeModul === 'absen-guru' ? 'Status' : 'Petugas'}</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Detail</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-6 pr-4">
                         <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{item.teacherName || data.students?.find(s => s.id === item.studentId)?.name || 'Data Dihapus'}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">UNIT: {item.class}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.category || item.subject || item.type}</p>
                         <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase">{item.date} • {item.startTime || item.time || item.recordedTime || item.timestamp}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-2 text-emerald-700">
                            {activeModul === 'absen-guru' ? <CheckCircle size={14} className="opacity-40" /> : <User size={14} className="opacity-40" />}
                            <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{activeModul === 'absen-guru' ? 'Hadir' : (item.recordedBy || item.reporter || 'Sistem')}</p>
                         </div>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak' || activeModul === 'prestasi' || activeModul === 'absen-guru' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{item.status || (activeModul === 'pelanggaran' || activeModul === 'prestasi' ? `${item.points} PT` : (activeModul === 'absen-guru' ? 'HADIR' : '-'))}</span>
                            {item.photoUrl && (
                               <div onClick={() => window.open(item.photoUrl)} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:scale-110 transition-transform shadow-sm shrink-0">
                                  <img src={item.photoUrl} className="w-full h-full object-cover" />
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="py-6">
                         <div className="flex justify-center gap-2">
                            <button onClick={() => setEditingItem({ ...item })} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit size={16}/></button>
                            <button onClick={() => { if(confirm("Hapus data ini?")) { if(activeModul === 'absen-kbm') actions.deleteAttendance(item.id); else if(activeModul === 'absen-pondok') actions.deletePrayer(item.id); else if(activeModul === 'absen-guru') actions.deleteTeacherAttendance(item.id); else actions.deleteReport(item.id); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                         </div>
                    </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {filteredData.length === 0 && (
               <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Belum Ada Data Log yang sesuai filter</div>
            )}
         </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">Edit Data Laporan</h3>
                 <button onClick={() => setEditingItem(null)} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all"><X/></button>
              </div>
              
              <div className="space-y-6">
                 {/* Status Edit */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Kehadiran / Penindakan</label>
                    <select 
                      value={editingItem.status} 
                      onChange={e => setEditingItem({...editingItem, status: e.target.value})}
                      className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm uppercase shadow-inner"
                    >
                      {activeModul === 'absen-kbm' && Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      {activeModul === 'absen-pondok' && Object.values(PrayerStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      {(activeModul === 'pelanggaran' || activeModul === 'prestasi') && ['Belum Ditindak', 'Ditindak'].map(s => <option key={s} value={s}>{s}</option>)}
                      {activeModul === 'absen-guru' && <option value="Hadir">Hadir</option>}
                    </select>
                 </div>

                 {/* Points Edit for reports */}
                 {(activeModul === 'pelanggaran' || activeModul === 'prestasi') && (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Poin Laporan</label>
                      <input 
                        type="number" 
                        value={editingItem.points} 
                        onChange={e => setEditingItem({...editingItem, points: Number(e.target.value)})}
                        className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm shadow-inner"
                      />
                   </div>
                 )}

                 {/* Notes / Description Edit */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Catatan</label>
                    <textarea 
                      value={editingItem.note || editingItem.description || editingItem.summary || editingItem.actionNote || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        if (activeModul === 'absen-kbm' || activeModul === 'absen-pondok') setEditingItem({...editingItem, note: val});
                        else if (activeModul === 'absen-guru') setEditingItem({...editingItem, summary: val});
                        else if (editingItem.status === 'Ditindak') setEditingItem({...editingItem, actionNote: val});
                        else setEditingItem({...editingItem, description: val});
                      }}
                      className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm min-h-[100px] shadow-inner"
                    />
                 </div>
              </div>

              <button onClick={handleUpdate} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-900 transition-all active:scale-95">
                 <Save size={18}/> Simpan Perubahan
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
