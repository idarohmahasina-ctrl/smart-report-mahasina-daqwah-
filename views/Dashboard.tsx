
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, UserCheck, ShieldAlert, Trophy, History, 
  Download, Eye, EyeOff, AlertTriangle, CheckCircle, Zap, Clock, Users, GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend 
} from 'recharts';
import { 
  AppData, AttendanceStatus, ViolationCategory, PrayerStatus, 
  PrayerTime, TeacherAttendance, AttendanceRecord, ReportItem, Student, UserRole 
} from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#f97316'];

const isWithinTimeRange = (dateStr: string, range: string, customDate?: string) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

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
    case 'Semester Ini': {
      const currentMonth = now.getMonth();
      const isSem2 = currentMonth < 6;
      if (isSem2) return date.getMonth() < 6 && date.getFullYear() === now.getFullYear();
      return date.getMonth() >= 6 && date.getFullYear() === now.getFullYear();
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

const Dashboard: React.FC<AppData & { profile: any }> = ({ profile, ...data }) => {
  const [activeTab, setActiveTab] = useState<'kbm' | 'pondok' | 'guru' | 'pelanggaran' | 'prestasi'>('kbm');
  
  // Universal Filters
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Sub-filter for ranking (Stores AttendanceStatus or ViolationCategory)
  const [rankStatus, setRankStatus] = useState<string>('Alpha');
  const [visiblePhotoId, setVisiblePhotoId] = useState<string | null>(null);

  const students = data.students || [];
  const attendance = data.attendance || [];
  const prayerAttendance = data.prayerAttendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];
  const config = data.academicConfig;

  // Granular Holiday check
  const isHoliday = (cls: string, sess: string) => {
    if (config?.excludedClasses?.[cls]) return true;
    if (config?.excludedSessions?.[sess]) return true;
    if (config?.sessionClassExclusions?.[sess]?.[cls]) return true;
    return false;
  };

  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    students.forEach(s => { if (s.formalClass) cls.add(s.formalClass); });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  // Tab Filtering Data
  const filteredKBM = useMemo(() => {
    return attendance.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(a.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || a.sessionType === sessionFilter;
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      if (a.status === AttendanceStatus.A && isHoliday(a.class, a.sessionType)) return false;
      return matchTime && matchSess && matchLvl && matchGdr && matchCls;
    });
  }, [attendance, students, timeRange, customDate, sessionFilter, levelFilter, genderFilter, classFilter, config]);

  const filteredPondok = useMemo(() => {
    return prayerAttendance.filter(p => {
      const s = students.find(std => std.id === p.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(p.date, timeRange, customDate);
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || p.class === classFilter;
      if (p.status === PrayerStatus.ALPHA && isHoliday(p.class, p.prayerTime)) return false;
      return matchTime && matchLvl && matchGdr && matchCls;
    });
  }, [prayerAttendance, students, timeRange, customDate, levelFilter, genderFilter, classFilter, config]);

  const filteredGuru = useMemo(() => {
    return teacherAttendance.filter(ta => {
      const matchTime = isWithinTimeRange(ta.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || ta.sessionType === sessionFilter;
      const matchCls = classFilter === 'Semua' || ta.class === classFilter;
      return matchTime && matchSess && matchCls;
    });
  }, [teacherAttendance, timeRange, customDate, sessionFilter, classFilter]);

  const filteredReports = useMemo(() => {
    const type = activeTab === 'pelanggaran' ? 'Violation' : 'Achievement';
    return reports.filter(r => {
      const s = students.find(std => std.id === r.studentId);
      if (!s || r.type !== type) return false;
      const matchTime = isWithinTimeRange(r.date, timeRange, customDate);
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || s.formalClass === classFilter;
      const matchCat = categoryFilter === 'Semua' || r.category === categoryFilter;
      return matchTime && matchLvl && matchGdr && matchCls && matchCat;
    });
  }, [reports, students, activeTab, timeRange, customDate, levelFilter, genderFilter, classFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (activeTab === 'kbm') {
      return {
        H: filteredKBM.filter(a => a.status === AttendanceStatus.H).length,
        S: filteredKBM.filter(a => a.status === AttendanceStatus.S).length,
        I: filteredKBM.filter(a => a.status === AttendanceStatus.I).length,
        T: filteredKBM.filter(a => a.status === AttendanceStatus.T).length,
        A: filteredKBM.filter(a => a.status === AttendanceStatus.A).length,
      };
    } else if (activeTab === 'pondok') {
      return {
        J: filteredPondok.filter(p => p.status === PrayerStatus.JAMAAH).length,
        U: filteredPondok.filter(p => p.status === PrayerStatus.UDZUR).length,
        S: filteredPondok.filter(p => p.status === PrayerStatus.SAKIT).length,
        I: filteredPondok.filter(p => p.status === PrayerStatus.IZIN).length,
        T: filteredPondok.filter(p => p.status === PrayerStatus.TERLAMBAT).length,
        A: filteredPondok.filter(p => p.status === PrayerStatus.ALPHA).length,
      };
    } else if (activeTab === 'guru') {
      const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
      const totalSchedules = schedules.filter(s => s.day === todayDay && !isHoliday(s.class, s.sessionType)).length;
      return {
        total: totalSchedules,
        present: filteredGuru.length,
        leave: 0, 
        absent: Math.max(0, totalSchedules - filteredGuru.length)
      };
    } else {
      return {
        count: filteredReports.length,
        points: filteredReports.reduce((acc, r) => acc + r.points, 0),
        handled: filteredReports.filter(r => r.status === 'Ditindak').length,
        unhandled: filteredReports.filter(r => r.status === 'Belum Ditindak').length,
      };
    }
  }, [activeTab, filteredKBM, filteredPondok, filteredGuru, filteredReports, schedules, config]);

  // Rankings
  const rankings = useMemo(() => {
    const stdMap = new Map<string, number>();
    const clsMap = new Map<string, number>();
    let targetData: any[] = [];

    if (activeTab === 'kbm') {
      targetData = filteredKBM.filter(a => a.status.includes(rankStatus));
    } else if (activeTab === 'pondok') {
      targetData = filteredPondok.filter(p => p.status.includes(rankStatus));
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      targetData = filteredReports;
      if (rankStatus && rankStatus !== 'Semua') {
        targetData = targetData.filter(r => r.category === rankStatus);
      }
    }

    targetData.forEach(item => {
      const s = students.find(std => std.id === item.studentId);
      if (s) {
        stdMap.set(s.name, (stdMap.get(s.name) || 0) + 1);
        clsMap.set(item.class || s.formalClass, (clsMap.get(item.class || s.formalClass) || 0) + 1);
      }
    });

    const sortFn = (a: any, b: any) => b.count - a.count;
    return {
      students: Array.from(stdMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn),
      classes: Array.from(clsMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn)
    };
  }, [activeTab, filteredKBM, filteredPondok, filteredReports, students, rankStatus]);

  // Charts
  const chartData = useMemo(() => {
    if (activeTab === 'kbm') {
      return [
        { name: 'Sakit', value: stats.S },
        { name: 'Izin', value: stats.I },
        { name: 'Terlambat', value: stats.T },
        { name: 'Alpha', value: stats.A },
      ].filter(d => d.value > 0);
    } else if (activeTab === 'pondok') {
      return [
        { name: 'Udzur', value: stats.U },
        { name: 'Sakit', value: stats.S },
        { name: 'Izin', value: stats.I },
        { name: 'Terlambat', value: stats.T },
        { name: 'Alpha', value: stats.A },
      ].filter(d => d.value > 0);
    } else if (activeTab === 'guru') {
      return [
        { name: 'Hadir', value: stats.present },
        { name: 'Tidak Hadir', value: stats.absent },
      ].filter(d => d.value > 0);
    } else {
      const catCounts: Record<string, number> = {};
      filteredReports.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      return Object.entries(catCounts).map(([name, value]) => ({ name, value }));
    }
  }, [activeTab, stats, filteredReports]);

  const handleExportLog = () => {
    let csvData: any[] = [];
    if (activeTab === 'kbm') {
      csvData = filteredKBM.map(a => ({
        "Nama Santri": students.find(s=>s.id===a.studentId)?.name || 'N/A',
        "Tanggal": a.date,
        "Sesi": a.sessionType,
        "Kelas": a.class,
        "Status": a.status,
        "Keterangan": a.note || '-'
      }));
    } else if (activeTab === 'pondok') {
      csvData = filteredPondok.map(p => ({
        "Nama Santri": students.find(s=>s.id===p.studentId)?.name || 'N/A',
        "Tanggal": p.date,
        "Kelas": p.class,
        "Status": p.status,
        "Keterangan": p.note || '-'
      }));
    } else if (activeTab === 'guru') {
      csvData = filteredGuru.map(ta => ({
        "Nama Guru": ta.teacherName,
        "Tanggal": ta.date,
        "Sesi": ta.sessionType || '-',
        "Kelas": ta.class,
        "Status": "Hadir",
        "Jam Mulai": ta.startTime,
        "Jam Selesai": ta.endTime || '-',
        "Keterangan": ta.summary || '-'
      }));
    } else {
      csvData = filteredReports.map(r => ({
        "Nama Santri": students.find(s=>s.id===r.studentId)?.name || 'N/A',
        "Tanggal": r.date,
        "Kelas": students.find(s=>s.id===r.studentId)?.formalClass || '-',
        "Kategori": r.category,
        "Deskripsi": r.description,
        "Status": r.status,
        "Keterangan Tindakan": r.actionNote || '-',
        "Pelapor": r.reporter
      }));
    }
    downloadCSV(csvData, `Log_${activeTab}_Mahasina`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'kbm', label: 'Absen KBM', icon: <UserCheck size={18}/> },
          { id: 'pondok', label: 'Absen Pondok', icon: <Zap size={18}/> },
          { id: 'guru', label: 'Absen Guru', icon: <GraduationCap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setActiveTab(tab.id as any); setRankStatus(tab.id === 'kbm' || tab.id === 'pondok' ? 'Alpha' : ''); }} 
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? `bg-[#064e3b] text-white shadow-lg` : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Rentang Waktu</label>
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer appearance-none">
                 {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester Ini', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
           {timeRange === 'Pilih Tanggal' && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Hari</label>
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full p-4 bg-emerald-50 rounded-2xl text-[10px] font-black outline-none border border-emerald-100" />
             </div>
           )}
           {(activeTab === 'kbm' || activeTab === 'guru') && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer">
                   <option value="Semua">Semua Sesi</option>
                   {['Madrasah', 'Hadis-Aswaja', 'Kitab Kuning', 'Al-Quran'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
           </div>
           )}
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua</option>
                 <option value="MTs">MTs</option>
                 <option value="MA">MA</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gender</label>
              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua</option>
                 <option value="Putra">Putra</option>
                 <option value="Putri">Putri</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Kelas</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua Kelas</option>
                 {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Kategori</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                   <option value="Semua">Semua Kategori</option>
                   {Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
           )}
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {activeTab === 'kbm' && (
          <>
            <StatCard label="Hadir" val={stats.H} color="emerald" />
            <StatCard label="Sakit" val={stats.S} color="blue" />
            <StatCard label="Izin" val={stats.I} color="amber" />
            <StatCard label="Terlambat" val={stats.T} color="orange" />
            <StatCard label="Alpha" val={stats.A} color="red" />
          </>
        )}
        {activeTab === 'pondok' && (
          <>
            <StatCard label="Hadir" val={stats.J} color="emerald" />
            <StatCard label="Udzur" val={stats.U} color="blue" />
            <StatCard label="Sakit" val={stats.S} color="indigo" />
            <StatCard label="Izin" val={stats.I} color="amber" />
            <StatCard label="Terlambat" val={stats.T} color="orange" />
            <StatCard label="Alpha" val={stats.A} color="red" />
          </>
        )}
        {activeTab === 'guru' && (
          <>
            <StatCard label="Total Jadwal" val={stats.total} color="slate" />
            <StatCard label="Guru Hadir" val={stats.present} color="emerald" />
            <StatCard label="Guru Sakit/Izin" val={stats.leave} color="amber" />
            <StatCard label="Guru Absen" val={stats.absent} color="red" />
          </>
        )}
        {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && (
          <>
            <StatCard label="Jumlah Laporan" val={stats.count} color={activeTab === 'pelanggaran' ? 'red' : 'emerald'} />
            <StatCard label="Total Poin" val={stats.points} color="blue" />
            <StatCard label="Sudah Ditindak" val={stats.handled} color="emerald" />
            <StatCard label="Belum Ditindak" val={stats.unhandled} color="orange" />
          </>
        )}
      </div>

      {/* Graphs & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-3"><Activity size={18}/> Grafik Tren Laporan</h3>
            <div className="w-full h-64">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <ChartTooltip />
                       <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-200">
                    <Activity size={48} />
                    <p className="text-[10px] font-black uppercase mt-4">Belum Ada Data</p>
                 </div>
               )}
            </div>
         </div>

         {activeTab !== 'guru' && (
           <div className="space-y-8">
              <RankingList 
                title="Ranking Santri" 
                data={rankings.students} 
                type={activeTab === 'kbm' || activeTab === 'pondok' ? 'Kali' : 'Laporan'} 
                color={activeTab === 'pelanggaran' ? 'red' : 'emerald'} 
                subFilter={(activeTab === 'kbm' || activeTab === 'pondok') ? (
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                      {(activeTab === 'kbm' ? ['Alpha', 'Terlambat', 'Izin', 'Sakit'] : ['Alpha', 'Terlambat', 'Izin', 'Sakit', 'Udzur']).map(opt => (
                         <button key={opt} onClick={() => setRankStatus(opt)} className={`px-3 py-1 rounded-lg text-[9px] font-black flex items-center justify-center transition-all ${rankStatus === opt ? 'bg-[#064e3b] text-white shadow-md' : 'text-slate-400'}`}>{opt[0]}</button>
                      ))}
                   </div>
                ) : (activeTab === 'pelanggaran' || activeTab === 'prestasi') ? (
                  <select 
                    value={rankStatus} 
                    onChange={e => setRankStatus(e.target.value)}
                    className="p-2 bg-slate-100 rounded-xl text-[9px] font-black uppercase outline-none shadow-inner border border-slate-200"
                  >
                    <option value="">Semua Kategori</option>
                    {Object.values(ViolationCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                ) : null}
              />
              <RankingList title="Ranking Unit Kelas" data={rankings.classes} type="Laporan" color="indigo" />
           </div>
         )}
      </div>

      {/* Log Detail Table */}
      <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
         <div className="flex justify-between items-center border-b pb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center"><History size={24}/></div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Detail Log Aktivitas</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Histori lengkap laporan {activeTab.toUpperCase()}</p>
               </div>
            </div>
            <button onClick={handleExportLog} className="px-8 py-4 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-3 hover:bg-emerald-900 transition-all active:scale-95">
               <Download size={18}/> Unduh Detail CSV
            </button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'guru' ? 'Pengajar' : 'Santri'} / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu / Tanggal</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesi / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Detail</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'guru' ? 'Jam Mengajar' : 'Petugas'}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {activeTab === 'kbm' && filteredKBM.map(a => (
                     <tr key={a.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===a.studentId)?.name || 'N/A'}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">NIS: {students.find(s=>s.id===a.studentId)?.nis || '-'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[11px] font-black text-slate-700">{a.date}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="font-black uppercase text-[10px] text-slate-500">{a.sessionType}</p>
                           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Unit: {a.class}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${a.status === AttendanceStatus.H ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{a.status}</span>
                           <p className="text-[8px] italic text-slate-400 mt-1.5 line-clamp-1">"{a.note || '-'}"</p>
                        </td>
                        <td className="py-6 pr-4 text-[9px] font-black text-slate-400 uppercase truncate max-w-[100px]">{a.recordedBy}</td>
                     </tr>
                  ))}
                  {activeTab === 'pondok' && filteredPondok.map(p => (
                     <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===p.studentId)?.name || 'N/A'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[11px] font-black text-slate-700">{p.date}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="font-black uppercase text-[10px] text-slate-500">{p.prayerTime}</p>
                           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Unit: {p.class}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === PrayerStatus.JAMAAH ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{p.status}</span>
                           <p className="text-[8px] italic text-slate-400 mt-1.5 line-clamp-1">"{p.note || '-'}"</p>
                        </td>
                        <td className="py-6 pr-4 text-[9px] font-black text-slate-400 uppercase truncate max-w-[100px]">{p.recordedBy}</td>
                     </tr>
                  ))}
                  {activeTab === 'guru' && filteredGuru.map(ta => (
                     <tr key={ta.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{ta.teacherName}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[11px] font-black text-slate-700">{ta.date}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="font-black uppercase text-[10px] text-slate-500">{ta.sessionType || 'Madrasah'}</p>
                           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Unit: {ta.class}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600">Hadir</span>
                           <p className="text-[8px] italic text-slate-400 mt-1.5 line-clamp-1">"{ta.summary || '-'}"</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[10px] font-black text-emerald-600">{ta.startTime} - {ta.endTime || '?'}</p>
                        </td>
                     </tr>
                  ))}
                  {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && filteredReports.map(r => (
                     <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                        <td className="py-6 pr-4">
                           <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===r.studentId)?.name || 'N/A'}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Unit: {students.find(s=>s.id===r.studentId)?.formalClass || '-'}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[11px] font-black text-slate-700">{r.date}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="font-black uppercase text-[10px] text-slate-800">{r.category}</p>
                           <p className="text-[8px] font-medium text-slate-400 mt-1 uppercase tracking-tight truncate max-w-[150px]">{r.description}</p>
                        </td>
                        <td className="py-6 pr-4">
                           <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase w-fit ${activeTab === 'pelanggaran' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{r.points} PT</span>
                              <span className={`text-[8px] font-black uppercase ${r.status === 'Ditindak' ? 'text-blue-600' : 'text-orange-600'}`}>{r.status}</span>
                           </div>
                        </td>
                        <td className="py-6 pr-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[80px]">{r.reporter}</p>
                           {r.photoUrl && <button onClick={() => setVisiblePhotoId(visiblePhotoId === r.id ? null : r.id)} className="mt-2 p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600"><Eye size={12}/></button>}
                           {visiblePhotoId === r.id && <img src={r.photoUrl} className="mt-2 w-16 h-16 rounded-xl object-cover shadow-lg border border-white animate-in zoom-in-95" />}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {(activeTab === 'kbm' ? filteredKBM : activeTab === 'pondok' ? filteredPondok : activeTab === 'guru' ? filteredGuru : filteredReports).length === 0 && (
               <div className="py-32 text-center text-slate-200 font-black uppercase italic tracking-[0.3em] text-[12px]">Data tidak tersedia untuk filter terpilih</div>
            )}
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color }: { label: string, val: number | string, color: string }) => (
  <div className={`p-6 bg-${color}-50 border border-white rounded-[2.5rem] flex flex-col gap-3 transition-transform hover:scale-105 shadow-sm`}>
     <div className="flex items-center justify-between">
        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center text-${color}-600 shadow-sm`}><Activity size={20}/></div>
        <TrendingUp size={16} className="text-slate-200"/>
     </div>
     <div>
        <h4 className="text-2xl font-black text-slate-800">{val}</h4>
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
     </div>
  </div>
);

const RankingList = ({ title, data, type, color = "emerald", subFilter }: { title: string, data: any[], type: string, color?: string, subFilter?: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all">
    <div className="flex items-center justify-between">
       <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
       {subFilter}
    </div>
    <div className="space-y-3">
       {data.slice(0, 5).map((item, idx) => (
         <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
            <div className="flex items-center gap-4 overflow-hidden">
               <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border text-slate-400'}`}>{idx + 1}</span>
               <span className="text-[11px] font-black text-slate-700 uppercase truncate">{item.name}</span>
            </div>
            <span className={`shrink-0 text-[10px] font-black ${idx === 0 ? `text-${color}-700 bg-${color}-50` : 'text-slate-600 bg-slate-100'} px-3 py-1 rounded-lg`}>{item.count} {type}</span>
         </div>
       ))}
       {data.length === 0 && <div className="py-10 text-center text-slate-200 font-black uppercase italic tracking-widest text-[9px]">Belum Ada Data</div>}
    </div>
  </div>
);

export default Dashboard;
