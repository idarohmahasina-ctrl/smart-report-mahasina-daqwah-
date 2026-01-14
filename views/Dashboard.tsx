
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Activity, UserCheck, ShieldAlert, Trophy, GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend 
} from 'recharts';
import { AppData, AttendanceStatus, ViolationCategory } from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

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
  const [activeTab, setActiveTab] = useState<'absen-kbm' | 'absen-guru' | 'pelanggaran' | 'prestasi'>('absen-kbm');
  
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  const [absenRankStatus, setAbsenRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);
  const [reportRankCategory, setReportRankCategory] = useState<string>('Semua');

  const students = data.students || [];
  const attendance = data.attendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];
  const config = data.academicConfig;

  const isHoliday = (cls: string, sess: string) => {
    if (config?.excludedClasses?.[cls]) return true;
    if (config?.excludedSessions?.[sess]) return true;
    return false;
  };

  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    students.forEach(s => cls.add(s.formalClass));
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const filteredAbsenKBM = useMemo(() => {
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

  const filteredAbsenGuru = useMemo(() => {
    return teacherAttendance.filter(ta => {
      const matchTime = isWithinTimeRange(ta.date, timeRange, customDate);
      const taClass = ta.class;
      const matchCls = classFilter === 'Semua' || taClass === classFilter;
      return matchTime && matchCls;
    });
  }, [teacherAttendance, timeRange, customDate, classFilter]);

  const teacherStats = useMemo(() => {
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
    const activeSchedules = schedules.filter(s => s.day === today && !isHoliday(s.class, s.sessionType));
    const totalScheduled = activeSchedules.length;
    return {
      total: totalScheduled,
      present: filteredAbsenGuru.length,
      sickLeave: 0, 
      absent: Math.max(0, totalScheduled - filteredAbsenGuru.length)
    };
  }, [filteredAbsenGuru, schedules, config]);

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

  const rankings = useMemo(() => {
    const stdMap = new Map<string, number>();
    const clsMap = new Map<string, number>();
    if (activeTab === 'absen-kbm') {
      const target = filteredAbsenKBM.filter(a => a.status === absenRankStatus);
      target.forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) {
          stdMap.set(s.name, (stdMap.get(s.name) || 0) + 1);
          clsMap.set(a.class, (clsMap.get(a.class) || 0) + 1);
        }
      });
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      filteredReports.forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) {
          stdMap.set(s.name, (stdMap.get(s.name) || 0) + 1);
          clsMap.set(s.formalClass, (clsMap.get(s.formalClass) || 0) + 1);
        }
      });
    }
    const sortFn = (a: any, b: any) => b.count - a.count;
    return {
      students: Array.from(stdMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn),
      classes: Array.from(clsMap.entries()).map(([name, count]) => ({ name, count })).sort(sortFn)
    };
  }, [activeTab, filteredAbsenKBM, filteredReports, students, absenRankStatus]);

  const chartData = useMemo(() => {
    if (activeTab === 'absen-kbm') {
      const statusCounts = { S: 0, I: 0, T: 0, A: 0 };
      filteredAbsenKBM.forEach(a => {
        if (a.status === AttendanceStatus.S) statusCounts.S++;
        else if (a.status === AttendanceStatus.I) statusCounts.I++;
        else if (a.status === AttendanceStatus.T) statusCounts.T++;
        else if (a.status === AttendanceStatus.A) statusCounts.A++;
      });
      return [
        { name: 'Sakit', value: statusCounts.S }, 
        { name: 'Izin', value: statusCounts.I }, 
        { name: 'Terlambat', value: statusCounts.T }, 
        { name: 'Alpha', value: statusCounts.A }
      ].filter(d => d.value > 0);
    } else if (activeTab === 'absen-guru') {
      return [{ name: 'Hadir', value: teacherStats.present }, { name: 'Tidak Hadir', value: teacherStats.absent }];
    } else {
      const catCounts: Record<string, number> = {};
      filteredReports.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      return Object.entries(catCounts).map(([name, value]) => ({ name, value }));
    }
  }, [activeTab, filteredAbsenKBM, filteredReports, teacherStats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'absen-kbm', label: 'Absen KBM', icon: <UserCheck size={18}/> },
          { id: 'absen-guru', label: 'Absen Guru', icon: <GraduationCap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? `bg-[#064e3b] text-white shadow-lg` : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Rentang Waktu</label>
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                 {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester Ini', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
           {timeRange === 'Pilih Tanggal' && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Hari</label>
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full p-4 bg-emerald-50 rounded-2xl text-[10px] font-black outline-none border border-emerald-100" />
             </div>
           )}
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
              <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua Sesi</option>
                 {['Madrasah', 'Hadis-Aswaja', 'Kitab Kuning', 'Al-Quran'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm grid grid-cols-2 gap-6">
            {activeTab === 'absen-kbm' ? (
               <>
                 <StatCard label="Sakit" val={filteredAbsenKBM.filter(a=>a.status===AttendanceStatus.S).length} color="blue" />
                 <StatCard label="Izin" val={filteredAbsenKBM.filter(a=>a.status===AttendanceStatus.I).length} color="amber" />
                 <StatCard label="Terlambat" val={filteredAbsenKBM.filter(a=>a.status===AttendanceStatus.T).length} color="orange" />
                 <StatCard label="Alpha" val={filteredAbsenKBM.filter(a=>a.status===AttendanceStatus.A).length} color="red" />
               </>
            ) : activeTab === 'absen-guru' ? (
               <>
                 <StatCard label="Total Jadwal" val={teacherStats.total} color="emerald" />
                 <StatCard label="Kehadiran Guru" val={teacherStats.present} color="blue" />
                 <StatCard label="Sakit/Izin" val={teacherStats.sickLeave} color="amber" />
                 <StatCard label="Tidak Hadir" val={teacherStats.absent} color="red" />
               </>
            ) : (
               <>
                 <StatCard label="Jumlah Kasus" val={filteredReports.length} color={activeTab === 'pelanggaran' ? 'red' : 'emerald'} />
                 <StatCard label="Total Poin" val={filteredReports.reduce((acc, r) => acc + r.points, 0)} color="blue" />
                 <StatCard label="Ditindak" val={filteredReports.filter(r=>r.status === 'Ditindak').length} color="emerald" />
                 <StatCard label="Belum Ditindak" val={filteredReports.filter(r=>r.status === 'Belum Ditindak').length} color="orange" />
               </>
            )}
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-3"><TrendingUp size={18}/> Grafik Tren Laporan</h3>
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
      </div>

      {activeTab !== 'absen-guru' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <RankingList title="Ranking Santri" data={rankings.students} type="Kali" color={activeTab === 'pelanggaran' ? 'red' : 'emerald'} 
             subFilter={activeTab === 'absen-kbm' ? (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                   {[{ s: AttendanceStatus.A, l: 'A' }, { s: AttendanceStatus.T, l: 'T' }, { s: AttendanceStatus.I, l: 'I' }, { s: AttendanceStatus.S, l: 'S' }].map(opt => (
                      <button key={opt.s} onClick={() => setAbsenRankStatus(opt.s)} className={`w-8 h-8 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${absenRankStatus === opt.s ? 'bg-[#064e3b] text-white shadow-md' : 'text-slate-400'}`}>
                         {opt.l}
                      </button>
                   ))}
                </div>
             ) : (
                <select value={reportRankCategory} onChange={e => setReportRankCategory(e.target.value)} className="text-[8px] font-black p-2 bg-slate-50 border-none rounded-lg uppercase">
                   <option value="Semua">Semua Kategori</option>
                   {Object.values(ViolationCategory).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             )}
           />
           <RankingList title="Ranking Unit Kelas" data={rankings.classes} type="Laporan" color="indigo" />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, val, color }: { label: string, val: number, color: string }) => (
  <div className={`p-6 bg-${color}-50 border border-white rounded-[2.5rem] flex flex-col gap-3 transition-transform hover:scale-105 shadow-sm`}>
     <div className="flex items-center justify-between">
        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center text-${color}-600 shadow-sm`}><Activity size={20}/></div>
        <TrendingUp size={16} className="text-slate-300"/>
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
       {data.length === 0 && <div className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest italic opacity-20">No Data</div>}
    </div>
  </div>
);

export default Dashboard;
