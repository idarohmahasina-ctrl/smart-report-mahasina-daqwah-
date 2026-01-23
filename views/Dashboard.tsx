
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, UserCheck, ShieldAlert, Trophy, History, 
  Download, Award, AlertTriangle, CheckCircle, Zap, Clock, Users, 
  GraduationCap, Calendar, BarChart3, Filter, ChevronRight, User, List,
  // Add missing PieIcon import from lucide-react
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend
} from 'recharts';
import { 
  AppData, AttendanceStatus, ViolationCategory, 
  AttendanceRecord, ReportItem, Student, UserRole
} from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';
import { normalizeSessionName } from './utils/nameMatchers.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#f97316'];

const isWithinTimeRange = (dateStr: string, range: string, customDate?: string) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  switch (range) {
    case 'Hari Ini': return date.getTime() === now.getTime();
    case 'Minggu Ini': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return date >= startOfWeek;
    }
    case 'Bulan Ini': return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case 'Semester Ini': {
      const currentMonth = now.getMonth();
      return (currentMonth < 6 ? date.getMonth() < 6 : date.getMonth() >= 6) && date.getFullYear() === now.getFullYear();
    }
    case 'Pilih Tanggal':
      if (!customDate) return true;
      const [cy, cm, cd] = customDate.split('-').map(Number);
      return date.getTime() === new Date(cy, cm - 1, cd).getTime();
    default: return true;
  }
};

const Dashboard: React.FC<AppData & { profile: any }> = ({ profile, ...data }) => {
  const [activeTab, setActiveTab] = useState<'kbm' | 'guru' | 'pelanggaran' | 'prestasi'>('kbm');
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [kbmRankStatus, setKbmRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);
  const [reportRankCategory, setReportRankCategory] = useState<string>('Semua');

  const students = data.students || [];
  const attendance = data.attendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];

  const dynamicSessions = useMemo(() => {
    const s = new Set<string>();
    schedules.forEach(sch => s.add(normalizeSessionName(sch.sessionType)));
    return Array.from(s).sort();
  }, [schedules]);

  const dynamicClasses = useMemo(() => {
    const c = new Set<string>();
    students.forEach(std => c.add(std.formalClass));
    return Array.from(c).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students]);

  const filteredKBM = useMemo(() => {
    return attendance.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(a.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || normalizeSessionName(a.sessionType) === sessionFilter;
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      return matchTime && matchSess && matchLvl && matchCls && matchGdr;
    });
  }, [attendance, students, timeRange, customDate, sessionFilter, levelFilter, classFilter, genderFilter]);

  const filteredGuru = useMemo(() => {
    return teacherAttendance.filter(ta => {
      const matchTime = isWithinTimeRange(ta.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || normalizeSessionName(ta.sessionType || "") === sessionFilter;
      const matchCls = classFilter === 'Semua' || ta.class === classFilter;
      return matchTime && matchSess && matchCls;
    });
  }, [teacherAttendance, timeRange, customDate, sessionFilter, classFilter]);

  const filteredReports = useMemo(() => {
    const type = activeTab === 'pelanggaran' ? 'Violation' : 'Achievement';
    return reports.filter(r => {
      if (r.type !== type) return false;
      const s = students.find(std => std.id === r.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(r.date, timeRange, customDate);
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchCls = classFilter === 'Semua' || s.formalClass === classFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      return matchTime && matchLvl && matchCls && matchGdr;
    });
  }, [reports, activeTab, students, timeRange, customDate, levelFilter, classFilter, genderFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'kbm') {
      return {
        H: filteredKBM.filter(a => a.status === AttendanceStatus.H).length,
        S: filteredKBM.filter(a => a.status === AttendanceStatus.S).length,
        I: filteredKBM.filter(a => a.status === AttendanceStatus.I).length,
        T: filteredKBM.filter(a => a.status === AttendanceStatus.T).length,
        A: filteredKBM.filter(a => a.status === AttendanceStatus.A).length,
      };
    } else if (activeTab === 'guru') {
      return {
        H: filteredGuru.filter(ta => ta.status === AttendanceStatus.H || !ta.status).length,
        S: filteredGuru.filter(ta => ta.status === AttendanceStatus.S).length,
        I: filteredGuru.filter(ta => ta.status === AttendanceStatus.I).length,
        A: teacherAttendance.filter(ta => ta.status === AttendanceStatus.A).length, // Mendeteksi log Alpha jika ada
        total: filteredGuru.length
      };
    } else {
      return {
        total: filteredReports.length,
        ditindak: filteredReports.filter(r => r.status === 'Ditindak').length,
        belum: filteredReports.filter(r => r.status === 'Belum Ditindak').length,
      };
    }
  }, [activeTab, filteredKBM, filteredGuru, filteredReports, teacherAttendance]);

  const rankings = useMemo(() => {
    const studentMap = new Map<string, { name: string; className: string; count: number; points: number }>();
    const classMap = new Map<string, { count: number; points: number }>();
    
    if (activeTab === 'kbm') {
      filteredKBM.filter(a => a.status === kbmRankStatus).forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) {
          const entry = studentMap.get(s.id) || { name: s.name, className: a.class, count: 0, points: 0 };
          entry.count++;
          studentMap.set(s.id, entry);
          const cEntry = classMap.get(a.class) || { count: 0, points: 0 };
          cEntry.count++;
          classMap.set(a.class, cEntry);
        }
      });
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      filteredReports.filter(r => reportRankCategory === 'Semua' || r.category === reportRankCategory).forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) {
          const entry = studentMap.get(s.id) || { name: s.name, className: s.formalClass, count: 0, points: 0 };
          entry.count++;
          entry.points += r.points;
          studentMap.set(s.id, entry);
          const cEntry = classMap.get(s.formalClass) || { count: 0, points: 0 };
          cEntry.count++;
          cEntry.points += r.points;
          classMap.set(s.formalClass, cEntry);
        }
      });
    }
    const sortFn = (a: any, b: any) => (activeTab === 'kbm' ? b.count - a.count : b.points - a.points);
    return {
      students: Array.from(studentMap.entries()).map(([id, data]) => ({ id, ...data })).sort(sortFn).slice(0, 5),
      classes: Array.from(classMap.entries()).map(([name, data]) => ({ name, ...data })).sort(sortFn).slice(0, 5)
    };
  }, [activeTab, kbmRankStatus, reportRankCategory, filteredKBM, filteredReports, students]);

  const chartData = useMemo(() => {
    if (activeTab === 'kbm') {
      const s = stats as { H: number; S: number; I: number; T: number; A: number };
      return [{ name: 'Hadir', value: s.H }, { name: 'Sakit', value: s.S }, { name: 'Izin', value: s.I }, { name: 'Telat', value: s.T }, { name: 'Alpha', value: s.A }].filter(d => d.value > 0);
    } else if (activeTab === 'guru') {
      const s = stats as { H: number, S: number, I: number, A: number };
      return [{ name: 'Hadir', value: s.H }, { name: 'Sakit', value: s.S }, { name: 'Izin', value: s.I }, { name: 'Alpha', value: s.A }].filter(d => d.value > 0);
    } else {
      const s = stats as { total: number; ditindak: number; belum: number };
      return [{ name: 'Ditindak', value: s.ditindak }, { name: 'Belum Ditindak', value: s.belum }].filter(d => d.value > 0);
    }
  }, [activeTab, stats]);

  const handleExport = () => {
    let exportData = [];
    if (activeTab === 'kbm') {
      exportData = filteredKBM.map(a => ({ "Tanggal": a.date, "Nama": students.find(s=>s.id===a.studentId)?.name || 'N/A', "Sesi": a.sessionType, "Kelas": a.class, "Status": a.status, "Ket": a.note, "Petugas": a.recordedBy }));
    } else if (activeTab === 'guru') {
      exportData = filteredGuru.map(ta => ({ "Tanggal": ta.date, "Guru": ta.teacherName, "Mapel": ta.subject, "Kelas": ta.class, "Status": ta.status || 'Hadir', "Mulai": ta.startTime, "Ket": ta.summary }));
    } else {
      exportData = filteredReports.map(r => ({ "Tanggal": r.date, "Nama": students.find(s=>s.id===r.studentId)?.name || 'N/A', "Kategori": r.category, "Deskripsi": r.description, "Poin": r.points, "Status": r.status }));
    }
    downloadCSV(exportData, `Log_Dashboard_${activeTab}`);
  };

  return (
    <div className="space-y-10 pb-32 max-w-7xl mx-auto px-4">
      {/* Tab Utama */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'kbm', label: 'Absen KBM', icon: <UserCheck size={18}/> },
          { id: 'guru', label: 'Absen Guru', icon: <GraduationCap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-[#064e3b] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Filter Row */}
      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm grid grid-cols-2 lg:grid-cols-5 gap-4">
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Rentang Waktu</label>
            <div className="flex gap-2">
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="flex-1 p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner border border-slate-100">
                {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester Ini', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {timeRange === 'Pilih Tanggal' && <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="p-2 bg-slate-50 rounded-xl text-[9px] font-black border border-slate-100" />}
            </div>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi / Unit</label>
            <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner border border-slate-100"><option value="Semua">Semua Sesi</option>{dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}</select>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner border border-slate-100">
               <option value="Semua">Semua Tingkat</option>
               <option value="MTs">MTs</option>
               <option value="MA">MA</option>
            </select>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Kelas</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner border border-slate-100"><option value="Semua">Semua Kelas</option>{dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Gender</label>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border border-slate-100"><option value="Semua">Semua Gender</option><option value="Putra">Putra</option><option value="Putri">Putri</option></select>
         </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-${activeTab === 'guru' || activeTab === 'kbm' ? '5' : '4'} gap-4`}>
        {activeTab === 'kbm' && <><StatCard label="Hadir" val={stats.H} color="emerald" /><StatCard label="Sakit" val={stats.S} color="blue" /><StatCard label="Izin" val={stats.I} color="amber" /><StatCard label="Telat" val={stats.T} color="orange" /><StatCard label="Alpha" val={stats.A} color="red" /></>}
        {activeTab === 'guru' && <><StatCard label="Hadir" val={(stats as any).H} color="emerald" /><StatCard label="Sakit" val={(stats as any).S} color="blue" /><StatCard label="Izin" val={(stats as any).I} color="amber" /><StatCard label="Alpha" val={(stats as any).A} color="red" /><StatCard label="Total Log" val={(stats as any).total} color="slate" /></>}
        {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && <><StatCard label="Total Kasus" val={(stats as any).total} color="indigo" /><StatCard label="Ditindak" val={(stats as any).ditindak} color="emerald" /><StatCard label="Belum Ditindak" val={(stats as any).belum} color="red" /><StatCard label="Total Poin" val={filteredReports.reduce((a,b)=>a+b.points,0)} color="orange" /></>}
      </div>

      {/* Charts & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-10 flex items-center gap-2"><PieIcon size={16} className="text-emerald-600"/> Komposisi Visual</h3>
            <div className="w-full h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                     </Pie>
                     <ChartTooltip />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Ranking Santri</h3>
                  {activeTab === 'kbm' && <select value={kbmRankStatus} onChange={e=>setKbmRankStatus(e.target.value as any)} className="bg-slate-50 text-[8px] font-black border rounded p-1 outline-none"><option value={AttendanceStatus.A}>Alpha</option><option value={AttendanceStatus.T}>Telat</option></select>}
               </div>
               <div className="space-y-3">
                  {rankings.students.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border hover:border-emerald-500 transition-all">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white' : 'bg-white border text-slate-400'}`}>{i+1}</span>
                          <span className="text-[10px] font-black text-slate-800 uppercase truncate">{r.name}</span>
                       </div>
                       <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">{r.count || r.points} {activeTab === 'kbm' ? 'Kali' : 'Poin'}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Award size={16} className="text-blue-500"/> Ranking Kelas</h3>
               <div className="space-y-3">
                  {rankings.classes.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border hover:border-blue-500 transition-all">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white border text-slate-400'}`}>{i+1}</span>
                          <span className="text-[10px] font-black text-slate-800 uppercase truncate">Unit {r.name}</span>
                       </div>
                       <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-1 rounded shadow-sm">{r.count || r.points} {activeTab === 'kbm' ? 'Kali' : 'Poin'}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Detail List */}
      <div className="bg-white p-12 rounded-[4rem] border shadow-2xl space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b pb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center"><List size={24}/></div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Detail Log {activeTab.toUpperCase()}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Laporan lengkap berdasarkan filter aktif</p>
               </div>
            </div>
            <button onClick={handleExport} className="px-10 py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center gap-3 hover:bg-emerald-900 transition-all"><Download size={18}/> Unduh Detail (.CSV)</button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[800px]">
               <thead>
                  <tr className="text-[9px] font-black uppercase text-slate-400 border-b-2 border-slate-50">
                     <th className="pb-6 pr-4">Identitas</th>
                     {activeTab === 'kbm' || activeTab === 'guru' ? <th className="pb-6 pr-4">Sesi / Mapel</th> : null}
                     <th className="pb-6 pr-4">Unit / Kelas Asal</th>
                     <th className="pb-6 pr-4">Kategori & Poin</th>
                     <th className="pb-6 pr-4">Laporan / Keterangan</th>
                     <th className="pb-6 text-right">Waktu & Pelapor</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {activeTab === 'kbm' && filteredKBM.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-6 pr-4"><p className="text-[11px] font-black uppercase">{students.find(s=>s.id===a.studentId)?.name || 'N/A'}</p><p className="text-[8px] font-bold text-slate-400 mt-1">NIS: {students.find(s=>s.id===a.studentId)?.nis || '-'}</p></td>
                       <td className="py-6 pr-4"><span className="text-[10px] font-black uppercase text-slate-500">{a.sessionType}</span></td>
                       <td className="py-6 pr-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black">{a.class}</span></td>
                       <td className="py-6 pr-4"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${a.status === AttendanceStatus.H ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{a.status}</span></td>
                       <td className="py-6 pr-4"><p className="text-[9px] font-bold text-slate-400 italic">"{a.note || '-'}"</p></td>
                       <td className="py-6 text-right text-[10px] font-black text-slate-600">{a.date} <br/> <span className="text-[8px] opacity-50">{a.recordedBy}</span></td>
                    </tr>
                  ))}
                  {activeTab === 'guru' && filteredGuru.map((ta, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-6 pr-4"><p className="text-[11px] font-black uppercase">{ta.teacherName}</p></td>
                       <td className="py-6 pr-4"><p className="text-[10px] font-black uppercase text-slate-500">{ta.subject}</p></td>
                       <td className="py-6 pr-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black">{ta.class}</span></td>
                       <td className="py-6 pr-4"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${ta.status === AttendanceStatus.H || !ta.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{ta.status || 'Hadir'}</span></td>
                       <td className="py-6 pr-4"><p className="text-[9px] font-bold text-slate-400 italic">"{ta.summary || '-'}"</p></td>
                       <td className="py-6 text-right text-[10px] font-black text-slate-600">{ta.date} <br/> <span className="text-[8px] opacity-50">Mulai: {ta.startTime}</span></td>
                    </tr>
                  ))}
                  {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && filteredReports.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-6 pr-4"><p className="text-[11px] font-black uppercase">{students.find(s=>s.id===r.studentId)?.name || 'N/A'}</p><p className="text-[8px] font-bold text-slate-400 mt-1">NIS: {students.find(s=>s.id===r.studentId)?.nis || '-'}</p></td>
                       <td className="py-6 pr-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black">{students.find(s=>s.id===r.studentId)?.formalClass}</span></td>
                       <td className="py-6 pr-4"><p className="text-[10px] font-black uppercase text-slate-700">{r.category}</p><p className={`text-[9px] font-black uppercase ${activeTab === 'pelanggaran' ? 'text-red-600' : 'text-emerald-600'}`}>{r.points} Poin</p></td>
                       <td className="py-6 pr-4"><p className="text-[10px] font-black text-slate-800 uppercase leading-snug">{r.description}</p><p className="text-[9px] font-bold text-slate-400 italic mt-1">"{r.actionNote || '-'}"</p></td>
                       <td className="py-6 text-right"><p className="text-[10px] font-black text-slate-600">{r.date}</p><p className="text-[8px] font-bold text-emerald-600 uppercase mt-1">{r.reporter}</p></td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color }: { label: string, val: number | string, color: string }) => (
  <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group">
     <h4 className="text-2xl font-black text-slate-800">{val}</h4>
     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><span className={`w-2 h-2 rounded-full bg-${color}-500 group-hover:scale-150 transition-transform`}></span>{label}</p>
  </div>
);

export default Dashboard;
