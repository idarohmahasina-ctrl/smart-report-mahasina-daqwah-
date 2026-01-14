
import React, { useState, useMemo } from 'react';
import { PrayerTime, PrayerStatus, Student, PrayerRecord, SessionType } from '../../types.ts';
import { 
  PlusCircle, History, Zap, Search, Users, ChevronRight, Save, Clock, Filter,
  Activity, CheckCircle, FileText, Download, Award, AlertTriangle, User
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { downloadCSV } from './csvExport.ts';

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#ef4444'];

// Helper for filtering by time range (Enhanced with custom date)
const isWithinRange = (dateStr: string, range: string, customDate?: string) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0,0,0,0);
  
  switch (range) {
    case 'Hari Ini':
      return date.getTime() === now.getTime();
    case 'Minggu Ini': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return date >= startOfWeek;
    }
    case 'Bulan Ini':
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case 'Semester': {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return date >= sixMonthsAgo;
    }
    case 'Pilih Tanggal':
      if (!customDate) return true;
      const [cy, cm, cd] = customDate.split('-').map(Number);
      const target = new Date(cy, cm - 1, cd);
      return date.getTime() === target.getTime();
    default:
      return true;
  }
};

const RankingCard = ({ title, data, type, color = "amber" }: { title: string, data: any[], type: string, color?: string }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-4">
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center`}><Award size={16}/></div>
       <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="space-y-2">
       {data.slice(0, 5).map((item, idx) => (
         <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
               <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border text-slate-400'}`}>
                  {idx + 1}
               </span>
               <span className="text-[10px] font-black text-slate-700 uppercase truncate">{item.name}</span>
            </div>
            <span className={`shrink-0 text-[10px] font-black ${idx === 0 ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-100'} px-2 py-0.5 rounded`}>{item.count} {type}</span>
         </div>
       ))}
       {data.length === 0 && <p className="text-[9px] text-slate-300 italic text-center py-6 font-bold uppercase tracking-widest">Belum Ada Data</p>}
    </div>
  </div>
);

interface PrayerAttendanceProps {
  students: Student[];
  onSave: (records: PrayerRecord[]) => void;
  allPrayerRecords: PrayerRecord[];
  currentUser: string;
}

const PrayerAttendance: React.FC<PrayerAttendanceProps> = ({ students, onSave, allPrayerRecords, currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'report'>('input');
  
  // State Input
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime>(PrayerTime.SUBUH);
  const [selectedClass, setSelectedClass] = useState('');
  const [tempRecords, setTempRecords] = useState<Record<string, { status: PrayerStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // State Report
  const [reportRange, setReportRange] = useState('Bulan Ini');
  const [reportCustomDate, setReportCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPrayer, setReportPrayer] = useState<PrayerTime | 'Semua'>('Semua');
  const [reportClass, setReportClass] = useState('Semua');
  const [reportLevel, setReportLevel] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [reportGender, setReportGender] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [reportRankStatus, setReportRankStatus] = useState<PrayerStatus>(PrayerStatus.ALPHA);

  const availableClassesForInput = useMemo(() => 
    // Fix: Explicitly cast unknown items to string for localeCompare in sort
    Array.from(new Set(students.map(s => s.formalClass))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, {numeric: true}))
  , [students]);

  // CASCADING CLASS OPTIONS: Filter kelas berdasarkan jenjang pada laporan
  const availableClassesForReport = useMemo(() => {
    let baseList = students;
    if (reportLevel !== 'Semua') {
      baseList = students.filter(s => s.level === reportLevel);
    }
    // Fix: Explicitly cast unknown items to string for localeCompare in sort
    return Array.from(new Set(baseList.map(s => s.formalClass))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  }, [students, reportLevel]);

  const filteredStudentsForInput = useMemo(() => {
    if (!selectedClass) return [];
    return students
      .filter(s => s.formalClass === selectedClass)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClass, searchTerm]);

  // Logic Reports
  const filteredRecords = useMemo(() => {
    let list = allPrayerRecords.filter(r => isWithinRange(r.date, reportRange, reportCustomDate));
    
    if (reportPrayer !== 'Semua') list = list.filter(r => r.prayerTime === reportPrayer);
    if (reportClass !== 'Semua') list = list.filter(r => r.class === reportClass);
    
    return list.filter(r => {
      const s = students.find(std => std.id === r.studentId);
      if (!s) return false;
      const matchLvl = reportLevel === 'Semua' || s.level === reportLevel;
      const matchGdr = reportGender === 'Semua' || s.gender === reportGender;
      return matchLvl && matchGdr;
    });
  }, [allPrayerRecords, reportRange, reportCustomDate, reportPrayer, reportClass, reportLevel, reportGender, students]);

  const stats = {
    JAMAAH: filteredRecords.filter(r => r.status === PrayerStatus.JAMAAH).length,
    UDZUR: filteredRecords.filter(r => r.status === PrayerStatus.UDZUR).length,
    SAKIT: filteredRecords.filter(r => r.status === PrayerStatus.SAKIT).length,
    IZIN: filteredRecords.filter(r => r.status === PrayerStatus.IZIN).length,
    TERLAMBAT: filteredRecords.filter(r => r.status === PrayerStatus.TERLAMBAT).length,
    ALPHA: filteredRecords.filter(r => r.status === PrayerStatus.ALPHA).length,
  };

  const getRanking = (status: PrayerStatus, target: 'name' | 'class') => {
    const map: Record<string, number> = {};
    filteredRecords.filter(r => r.status === status).forEach(r => {
      const s = students.find(std => std.id === r.studentId);
      if (s) {
        const key = target === 'name' ? s.name : s.formalClass;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  };

  const handleSave = () => {
    if (!selectedClass) { alert("Pilih kelas terlebih dahulu."); return; }
    if (filteredStudentsForInput.length === 0) { alert("Tidak ada santri di kelas ini."); return; }
    
    const now = new Date();
    const records: PrayerRecord[] = filteredStudentsForInput.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      date: now.toLocaleDateString('id-ID'),
      recordedTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      studentId: s.id,
      status: tempRecords[s.id]?.status || PrayerStatus.JAMAAH,
      note: tempRecords[s.id]?.note || '',
      recordedBy: currentUser,
      class: selectedClass,
      prayerTime: selectedPrayer
    }));

    onSave(records);
    alert(`Absen ${selectedPrayer} kelas ${selectedClass} berhasil disimpan.`);
    setTempRecords({});
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-emerald-950 p-8 md:p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
                 <Zap size={32} />
              </div>
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Absensi Sholat Santri</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3">Sistem Pengawasan Berjama'ah Mahasina</p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-[1.5rem] border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
              <button 
                onClick={() => setActiveSubTab('input')} 
                className={`flex items-center gap-3 px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'input' ? 'bg-white text-emerald-950 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}
              >
                <PlusCircle size={18}/> Input Baru
              </button>
              <button 
                onClick={() => setActiveSubTab('report')} 
                className={`flex items-center gap-3 px-8 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'report' ? 'bg-white text-emerald-950 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}
              >
                <History size={18}/> Laporan Detail
              </button>
           </div>
        </div>
      </div>

      {activeSubTab === 'input' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Sholat</label>
                 <div className="flex flex-wrap gap-2">
                    {/* Fixed: Cast Object.values(PrayerTime) to string[] to fix unknown type error */}
                    {(Object.values(PrayerTime) as string[]).map(pt => (
                      <button 
                        key={pt} 
                        onClick={() => setSelectedPrayer(pt as PrayerTime)} 
                        className={`flex-1 min-w-[100px] px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedPrayer === pt ? 'bg-emerald-800 border-emerald-800 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                      >
                         {pt}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Unit Kelas</label>
                 <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-[11px] uppercase tracking-widest shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">
                    <option value="">-- PILIH KELAS UNTUK ABSEN --</option>
                    {availableClassesForInput.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-50 shadow-xl overflow-hidden min-h-[500px]">
              {!selectedClass ? (
                 <div className="py-32 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                       <Users size={48} className="text-slate-200" />
                    </div>
                    <div>
                       <h4 className="text-[14px] font-black text-slate-300 uppercase tracking-[0.3em]">Silakan Pilih Kelas</h4>
                       <p className="text-[9px] font-bold text-slate-200 uppercase tracking-widest mt-2">Daftar Santri akan muncul secara otomatis</p>
                    </div>
                 </div>
              ) : (
                 <div className="divide-y divide-slate-100">
                    <div className="p-6 bg-slate-50 flex items-center gap-4">
                       <div className="relative flex-1">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
                          <input type="text" placeholder="Cari Nama Santri..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-[12px] font-bold outline-none shadow-sm focus:border-emerald-600 transition-all" />
                       </div>
                    </div>
                    <div className="max-h-[800px] overflow-y-auto no-scrollbar">
                       {filteredStudentsForInput.map(s => {
                          const curr = tempRecords[s.id] || { status: PrayerStatus.JAMAAH, note: '' };
                          return (
                            <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 transition-all gap-6 group">
                               <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-emerald-800 group-hover:text-white transition-all shadow-inner shrink-0">{s.name[0]}</div>
                                  <div className="min-w-0">
                                     <h4 className="text-[12px] sm:text-[14px] font-black text-slate-800 uppercase leading-none truncate">{s.name}</h4>
                                     <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{s.nis} • {s.gender}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4 w-full md:w-auto">
                                  <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner shrink-0">
                                     {[
                                       { s: PrayerStatus.JAMAAH, l: 'J' }, 
                                       { s: PrayerStatus.UDZUR, l: 'U' }, 
                                       { s: PrayerStatus.SAKIT, l: 'S' }, 
                                       { s: PrayerStatus.IZIN, l: 'I' }, 
                                       { s: PrayerStatus.TERLAMBAT, l: 'T' },
                                       { s: PrayerStatus.ALPHA, l: 'A' }
                                     ].map(opt => (
                                       <button 
                                         key={opt.s} 
                                         onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: opt.s }})} 
                                         className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-[9px] sm:text-[10px] font-black flex items-center justify-center transition-all ${curr.status === opt.s ? (opt.s === PrayerStatus.JAMAAH ? 'bg-emerald-800 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') : 'text-slate-400 hover:text-slate-600'}`}
                                       >
                                          {opt.l}
                                       </button>
                                     ))}
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Ket..." 
                                    value={curr.note} 
                                    onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})} 
                                    className="flex-1 md:w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none shadow-inner focus:bg-white focus:border-emerald-600 transition-all" 
                                  />
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              )}
           </div>

           {selectedClass && (
             <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konfirmasi Absen:</p>
                   <h5 className="text-xl font-black text-emerald-900 uppercase leading-none mt-2">{selectedPrayer} • KELAS {selectedClass}</h5>
                </div>
                <button onClick={handleSave} className="w-full md:w-80 py-5 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-emerald-900 active:scale-95 transition-all flex items-center justify-center gap-4">
                   <Save size={20}/> Simpan Data Sholat
                </button>
             </div>
           )}
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-6">
           {/* Enhanced Report Filters */}
           <div className="bg-white p-6 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentang Waktu</label>
                    <select value={reportRange} onChange={e => setReportRange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                       {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {reportRange === 'Pilih Tanggal' && (
                      <input 
                        type="date" 
                        value={reportCustomDate} 
                        onChange={e => setReportCustomDate(e.target.value)}
                        className="mt-2 w-full p-2 bg-emerald-50 rounded-lg text-[10px] font-bold outline-none border border-emerald-100"
                      />
                    )}
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Sholat</label>
                    <select value={reportPrayer} onChange={e => setReportPrayer(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                       <option value="Semua">SEMUA WAKTU</option>
                       {/* Fixed: Cast Object.values(PrayerTime) to string[] to fix unknown type error */}
                       {(Object.values(PrayerTime) as string[]).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkatan</label>
                    <select 
                      value={reportLevel} 
                      onChange={e => {
                        setReportLevel(e.target.value as any);
                        setReportClass('Semua'); // Auto reset saat jenjang ganti
                      }} 
                      className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none"
                    >
                       <option value="Semua">SEMUA TINGKATAN</option>
                       <option value="MTs">MTs</option>
                       <option value="MA">MA</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select value={reportGender} onChange={e => setReportGender(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none" >
                       <option value="Semua">SEMUA GENDER</option>
                       <option value="Putra">PUTRA</option>
                       <option value="Putri">PUTRI</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Spesifik</label>
                    <select value={reportClass} onChange={e => setReportClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                       <option value="Semua">SEMUA KELAS</option>
                       {availableClassesForReport.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* Stats Summary */}
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Berjamaah', val: stats.JAMAAH, color: 'emerald', icon: CheckCircle },
                { label: 'Udzur', val: stats.UDZUR, color: 'blue', icon: Activity },
                { label: 'Sakit', val: stats.SAKIT, color: 'indigo', icon: FileText },
                { label: 'Izin', val: stats.IZIN, color: 'amber', icon: Clock },
                { label: 'Terlambat', val: stats.TERLAMBAT, color: 'orange', icon: Clock },
                { label: 'Alpha', val: stats.ALPHA, color: 'red', icon: AlertTriangle },
              ].map(st => (
                <div key={st.label} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col items-center text-center hover:shadow-xl transition-all group">
                   <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-${st.color}-50 text-${st.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>
                      <st.icon size={18}/>
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.label}</p>
                   <h4 className="text-xl font-black text-slate-800 leading-none">{st.val}</h4>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-xl space-y-8">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Users size={18} className="text-emerald-700"/> Ranking Ketidakhadiran</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
                       {[PrayerStatus.ALPHA, PrayerStatus.TERLAMBAT, PrayerStatus.UDZUR, PrayerStatus.SAKIT, PrayerStatus.IZIN].map(st => (
                          <button key={st} onClick={() => setReportRankStatus(st)} className={`px-2.5 py-2 rounded-lg text-[9px] font-black transition-all ${reportRankStatus === st ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                             {st === 'Berjama\'ah' ? 'J' : st[0]}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    <RankingCard title={`Ranking Santri (${reportRankStatus})`} data={getRanking(reportRankStatus, 'name')} type="KALI" />
                    <RankingCard title={`Ranking Unit Kelas (${reportRankStatus})`} data={getRanking(reportRankStatus, 'class')} type="KALI" color="blue" />
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-xl space-y-8">
                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><Activity size={18} className="text-emerald-700"/> Visualisasi Komposisi</h3>
                 <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                            data={[
                              { name: 'Jamaah', val: stats.JAMAAH },
                              { name: 'Udzur', val: stats.UDZUR },
                              { name: 'Sakit', val: stats.SAKIT },
                              { name: 'Izin', val: stats.IZIN },
                              { name: 'Terlambat', val: stats.TERLAMBAT },
                              { name: 'Alpha', val: stats.ALPHA }
                            ].filter(d => d.val > 0)} 
                            cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="val"
                          >
                             {/* Fixed: Cast Object.keys(stats) as string[] to fix unknown type error in Cell mapping */}
                             {(Object.keys(stats) as string[]).map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '10px'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                 <div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><FileText size={20} className="text-emerald-700"/> Detail Histori Absensi</h3>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Data akumulasi berdasarkan filter aktif</p>
                 </div>
                 <button 
                   onClick={() => downloadCSV(filteredRecords, `Laporan_Sholat_Mahasina`)}
                   className="p-3.5 bg-emerald-900 text-white rounded-2xl shadow-lg flex items-center gap-3 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all active:scale-95 whitespace-nowrap"
                 >
                    <Download size={16}/> Unduh (.CSV)
                 </button>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b-2 border-slate-50">
                          <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Santri / Unit</th>
                          <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Sholat</th>
                          <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Petugas</th>
                          <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu Input</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredRecords.map(r => (
                          <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                             <td className="py-6 pr-4">
                                <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===r.studentId)?.name || 'Santri Dihapus'}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">KELAS: {r.class}</p>
                             </td>
                             <td className="py-6 pr-4">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  r.status === PrayerStatus.JAMAAH ? 'bg-emerald-100 text-emerald-800' : 
                                  r.status === PrayerStatus.ALPHA ? 'bg-red-100 text-red-800' : 
                                  r.status === PrayerStatus.TERLAMBAT ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                }`}>{r.status}</span>
                                {r.note && <p className="text-[8px] font-medium text-slate-400 mt-1 italic">{r.note}</p>}
                             </td>
                             <td className="py-6 pr-4">
                                <div className="flex items-center gap-2 text-emerald-700">
                                   <User size={12} className="opacity-40" />
                                   <p className="text-[10px] font-black uppercase tracking-tight">{r.recordedBy || 'Sistem'}</p>
                                </div>
                             </td>
                             <td className="py-6 pr-4">
                                <p className="text-[11px] font-black text-emerald-800 uppercase leading-none">{r.prayerTime} ({r.recordedTime})</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{r.date}</p>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredRecords.length === 0 && (
                    <div className="py-32 text-center text-slate-200 font-black uppercase italic tracking-[0.3em]">Belum Ada Histori Sholat Terarsip</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PrayerAttendance;
