
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, UserCheck, ShieldAlert, Trophy, History, 
  Download, Award, AlertTriangle, CheckCircle, Zap, Clock, Users, 
  GraduationCap, Calendar, BarChart3, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  AppData, AttendanceStatus, ViolationCategory, PrayerStatus, 
  TeacherAttendance, AttendanceRecord, ReportItem, Student, UserRole 
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
  
  // Global Filters
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  
  // Ranking/Category Filters
  const [rankStatus, setRankStatus] = useState<string>('Alpha'); // For KBM
  const [reportCategory, setReportCategory] = useState<string>('Semua'); // For Pelanggaran/Prestasi

  const students = data.students || [];
  const attendance = data.attendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];

  // Dinamis Options
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

  // Filtering Logic Per Modul
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
      const matchCat = reportCategory === 'Semua' || r.category === reportCategory;
      return matchTime && matchLvl && matchCls && matchGdr && matchCat;
    });
  }, [reports, activeTab, students, timeRange, customDate, levelFilter, classFilter, genderFilter, reportCategory]);

  // Stats for Cards
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
        H: filteredGuru.length, // Sederhana: Hadir jika ada log
        S: 0, I: 0, A: 0 // Implementasi real butuh status di teacherAttendance
      };
    } else {
      return {
        total: filteredReports.length,
        ditindak: filteredReports.filter(r => r.status === 'Ditindak').length,
        belum: filteredReports.filter(r => r.status === 'Belum Ditindak').length,
      };
    }
  }, [activeTab, filteredKBM, filteredGuru, filteredReports]);

  // Chart Data
  const chartData = useMemo(() => {
    if (activeTab === 'kbm') {
      return [
        { name: 'Hadir', value: stats.H },
        { name: 'Sakit', value: stats.S },
        { name: 'Izin', value: stats.I },
        { name: 'Telat', value: stats.T },
        { name: 'Alpha', value: stats.A },
      ].filter(d => d.value > 0);
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      const map = new Map<string, number>();
      filteredReports.forEach(r => map.set(r.category, (map.get(r.category) || 0) + 1));
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }
    return [];
  }, [activeTab, stats, filteredReports]);

  // Rankings
  const rankings = useMemo(() => {
    const studentMap = new Map<string, number>();
    const classMap = new Map<string, number>();

    if (activeTab === 'kbm') {
      const targetStatus = rankStatus === 'Alpha' ? AttendanceStatus.A : rankStatus === 'Sakit' ? AttendanceStatus.S : rankStatus === 'Izin' ? AttendanceStatus.I : AttendanceStatus.T;
      filteredKBM.filter(a => a.status === targetStatus).forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) {
          studentMap.set(s.name, (studentMap.get(s.name) || 0) + 1);
          classMap.set(s.formalClass, (classMap.get(s.formalClass) || 0) + 1);
        }
      });
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      filteredReports.forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) {
          studentMap.set(s.name, (studentMap.get(s.name) || 0) + r.points);
          classMap.set(s.formalClass, (classMap.get(s.formalClass) || 0) + r.points);
        }
      });
    }

    const sortFn = (a: any, b: any) => b.count - a.count;
    return {
      students: Array.from(studentMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn).slice(0, 5),
      classes: Array.from(classMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn).slice(0, 5)
    };
  }, [activeTab, rankStatus, filteredKBM, filteredReports, students]);

  const handleExport = () => {
    let exportData = [];
    let filename = `Export_${activeTab}`;
    if (activeTab === 'kbm') {
      exportData = filteredKBM.map(a => ({
        "Tanggal": a.date, "Nama": students.find(s=>s.id===a.studentId)?.name || 'N/A', "Sesi": a.sessionType, "Kelas": a.class, "Status": a.status, "Ket": a.note, "Petugas": a.recordedBy
      }));
    } else if (activeTab === 'guru') {
      exportData = filteredGuru.map(ta => ({
        "Tanggal": ta.date, "Nama Guru": ta.teacherName, "Mapel": ta.subject, "Kelas": ta.class, "Masuk": ta.startTime, "Ket": ta.summary
      }));
    } else {
      exportData = filteredReports.map(r => ({
        "Tanggal": r.date, "Nama": students.find(s=>s.id===r.studentId)?.name || 'N/A', "Kategori": r.category, "Deskripsi": r.description, "Poin": r.points, "Status": r.status, "Reporter": r.reporter
      }));
    }
    downloadCSV(exportData, filename);
  };

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto px-4">
      {/* Tab Menu Utama */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'kbm', label: 'Absen KBM', icon: <UserCheck size={18}/> },
          { id: 'guru', label: 'Absen Guru', icon: <GraduationCap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-[#064e3b] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm grid grid-cols-2 lg:grid-cols-6 gap-4">
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Waktu</label>
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner">
               {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester Ini', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
         </div>
         {timeRange === 'Pilih Tanggal' && (
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Tanggal</label>
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl text-[9px] font-black outline-none border border-slate-100" />
           </div>
         )}
         {(activeTab === 'kbm' || activeTab === 'guru') && (
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
              <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua Sesi</option>
                 {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
         )}
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit</label>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner">
               <option value="Semua">Semua Unit</option>
               <option value="MTs">MTs</option>
               <option value="MA">MA</option>
            </select>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Kelas</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner">
               <option value="Semua">Semua Kelas</option>
               {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         </div>
         <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Gender</label>
            <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner">
               <option value="Semua">Semua</option>
               <option value="Putra">Putra</option>
               <option value="Putri">Putri</option>
            </select>
         </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {activeTab === 'kbm' ? (
          <>
            <StatCard label="Hadir" val={stats.H} color="emerald" />
            <StatCard label="Sakit" val={stats.S} color="blue" />
            <StatCard label="Izin" val={stats.I} color="amber" />
            <StatCard label="Telat" val={stats.T} color="orange" />
            <StatCard label="Alpha" val={stats.A} color="red" />
          </>
        ) : activeTab === 'guru' ? (
          <>
            <StatCard label="Hadir" val={stats.H} color="emerald" />
            <StatCard label="Sakit" val={0} color="blue" />
            <StatCard label="Izin" val={0} color="amber" />
            <StatCard label="Alpha" val={0} color="red" />
          </>
        ) : (
          <>
            <StatCard label="Total Laporan" val={stats.total} color="slate" />
            <StatCard label="Telah Ditindak" val={stats.ditindak} color="emerald" />
            <StatCard label="Belum Ditindak" val={stats.belum} color="red" />
          </>
        )}
      </div>

      {/* Main Content: Charts & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Log Detail */}
            <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-3"><History size={20} className="text-emerald-700"/> Detail Log Data</h3>
                  <button onClick={handleExport} className="px-6 py-3 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Download size={14}/> Ekspor (.CSV)</button>
               </div>
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[500px]">
                     <thead>
                        <tr className="border-b-2 border-slate-50 text-[9px] font-black uppercase text-slate-400">
                           <th className="pb-4">Nama</th>
                           <th className="pb-4">Detail</th>
                           <th className="pb-4">Status / Poin</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {activeTab === 'kbm' && filteredKBM.slice(0, 10).map((a, i) => (
                           <tr key={i} className="group hover:bg-slate-50">
                              <td className="py-4"><p className="text-[11px] font-black uppercase">{students.find(s=>s.id===a.studentId)?.name}</p></td>
                              <td className="py-4"><p className="text-[9px] font-bold text-slate-400 uppercase">{a.date} • {a.sessionType} ({a.class})</p></td>
                              <td className="py-4"><span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${a.status === AttendanceStatus.H ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{a.status}</span></td>
                           </tr>
                        ))}
                        {activeTab === 'guru' && filteredGuru.slice(0, 10).map((ta, i) => (
                           <tr key={i} className="group hover:bg-slate-50">
                              <td className="py-4"><p className="text-[11px] font-black uppercase">{ta.teacherName}</p></td>
                              <td className="py-4"><p className="text-[9px] font-bold text-slate-400 uppercase">{ta.date} • {ta.subject} ({ta.class})</p></td>
                              <td className="py-4 text-[9px] font-black text-emerald-600">MASUK: {ta.startTime}</td>
                           </tr>
                        ))}
                        {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && filteredReports.slice(0, 10).map((r, i) => (
                           <tr key={i} className="group hover:bg-slate-50">
                              <td className="py-4"><p className="text-[11px] font-black uppercase">{students.find(s=>s.id===r.studentId)?.name}</p></td>
                              <td className="py-4"><p className="text-[9px] font-bold text-slate-400 uppercase">{r.date} • {r.category}</p><p className="text-[9px] italic text-slate-500 line-clamp-1">{r.description}</p></td>
                              <td className="py-4 text-[9px] font-black text-slate-800">{r.points} PT</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Visualisasi Tren */}
            <div className="bg-white p-10 rounded-[4rem] border shadow-sm flex flex-col items-center">
               <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3"><TrendingUp size={18} className="text-emerald-600"/> Komposisi {activeTab}</h3>
               <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     {activeTab === 'kbm' ? (
                       <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                             {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <ChartTooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                       </PieChart>
                     ) : (
                       <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 900}} />
                          <YAxis tick={{fontSize: 9, fontWeight: 900}} />
                          <ChartTooltip />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                             {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                       </BarChart>
                     )}
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            {/* Ranking Section */}
            <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-10">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Ranking Santri</h4>
                     {activeTab === 'kbm' && (
                        <select value={rankStatus} onChange={e => setRankStatus(e.target.value)} className="bg-slate-50 text-[9px] font-black uppercase p-2 rounded-lg outline-none">
                           <option value="Alpha">Alpha</option>
                           <option value="Sakit">Sakit</option>
                           <option value="Izin">Izin</option>
                           <option value="Terlambat">Telat</option>
                        </select>
                     )}
                     {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && (
                        <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="bg-slate-50 text-[9px] font-black uppercase p-2 rounded-lg outline-none max-w-[80px]">
                           <option value="Semua">Kategori</option>
                           {Object.values(ViolationCategory).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                     )}
                  </div>
                  <div className="space-y-3">
                     {rankings.students.map((row, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-400'}`}>{i+1}</span>
                              <p className="text-[10px] font-black uppercase truncate text-slate-800">{row.name}</p>
                           </div>
                           <p className="text-[10px] font-black text-slate-600 bg-white px-3 py-1 rounded-lg shadow-sm border">{row.count} {activeTab === 'kbm' ? 'Kali' : 'Poin'}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4 pt-8 border-t border-slate-50">
                  <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-blue-500"/> Ranking Kelas</h4>
                  <div className="space-y-3">
                     {rankings.classes.map((row, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>{i+1}</span>
                              <p className="text-[10px] font-black uppercase truncate text-slate-800">{row.name}</p>
                           </div>
                           <p className="text-[10px] font-black text-slate-600 bg-white px-3 py-1 rounded-lg shadow-sm border">{row.count} {activeTab === 'kbm' ? 'Kali' : 'Poin'}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Quick Summary Banner */}
            <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white space-y-8">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ringkasan Hari Ini</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                     <div>
                        <p className="text-[8px] font-black uppercase text-emerald-100/50">Log Kehadiran</p>
                        <p className="text-[10px] font-bold text-white mt-1">Sistem Aktif</p>
                     </div>
                     <p className="text-3xl font-black">{data.attendance.filter(a => a.date === new Date().toLocaleDateString('id-ID')).length}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                     <div>
                        <p className="text-[8px] font-black uppercase text-emerald-100/50">Guru Aktif</p>
                        <p className="text-[10px] font-bold text-white mt-1">Mengajar Saat Ini</p>
                     </div>
                     <p className="text-3xl font-black">{new Set(data.teacherAttendance.filter(a => a.date === new Date().toLocaleDateString('id-ID')).map(ta => ta.teacherName)).size}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color }: { label: string, val: number | string, color: string }) => (
  <div className={`p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group`}>
     <h4 className={`text-2xl font-black text-slate-800`}>{val}</h4>
     <p className={`text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full bg-${color}-500 group-hover:scale-150 transition-transform`}></span>
        {label}
     </p>
  </div>
);

export default Dashboard;
