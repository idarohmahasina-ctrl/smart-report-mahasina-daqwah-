
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  LayoutDashboard, UserCheck, ShieldAlert, Trophy, 
  TrendingUp, Award, Clock, Users, ChevronRight,
  Activity, AlertCircle, CheckCircle, Zap, Calendar,
  Download, Filter, Search, Image as ImageIcon, Eye, EyeOff, UserMinus, GraduationCap
} from 'lucide-react';
import { AppData, AttendanceStatus, UserRole, Student, AttendanceRecord, TeacherAttendance, ReportItem, ViolationCategory } from '../types.ts';
import { isTeacherMatch } from './utils/nameMatchers.ts';
import { downloadCSV } from './utils/csvExport.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

// Helper for filtering by time range
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

const Dashboard: React.FC<AppData & { profile: any }> = (data) => {
  const [activeTab, setActiveTab] = useState<'absen-santri' | 'absen-guru' | 'pelanggaran' | 'prestasi'>('absen-santri');
  
  // Global Filters
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Ranking Filters
  const [absenRankStatus, setAbsenRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);
  const [reportRankCategory, setReportRankCategory] = useState<string>('Semua');

  const [visiblePhotoId, setVisiblePhotoId] = useState<string | null>(null);

  const students = data.students || [];
  const attendance = data.attendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];
  const config = data.academicConfig;

  // Helper check for holiday
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

  // 1. Logic for ABSEN SANTRI
  const filteredAbsenSantri = useMemo(() => {
    return attendance.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(a.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || a.sessionType === sessionFilter;
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      const isSITA = [AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].includes(a.status);
      
      // Exclude alpha if holiday
      if (a.status === AttendanceStatus.A && isHoliday(a.class, a.sessionType)) return false;

      return matchTime && matchSess && matchLvl && matchGdr && matchCls && isSITA;
    });
  }, [attendance, students, timeRange, customDate, sessionFilter, levelFilter, genderFilter, classFilter, config]);

  // 2. Logic for ABSEN GURU
  const filteredAbsenGuru = useMemo(() => {
    return teacherAttendance.filter(ta => {
      const matchTime = isWithinTimeRange(ta.date, timeRange, customDate);
      const sch = schedules.find(s => s.teacherName === ta.teacherName && s.class === ta.class && s.subject === ta.subject);
      const matchSess = sessionFilter === 'Semua' || sch?.sessionType === sessionFilter;
      const matchLvl = levelFilter === 'Semua' || sch?.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || sch?.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || ta.class === classFilter;
      return matchTime && matchSess && matchLvl && matchGdr && matchCls;
    });
  }, [teacherAttendance, schedules, timeRange, customDate, sessionFilter, levelFilter, genderFilter, classFilter]);

  const teacherStats = useMemo(() => {
    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
    // Only count non-holiday schedules
    const activeSchedules = schedules.filter(s => s.day === today && !isHoliday(s.class, s.sessionType));
    const totalScheduled = activeSchedules.length;
    
    return {
      total: totalScheduled,
      present: filteredAbsenGuru.length,
      sickLeave: 0, 
      absent: Math.max(0, totalScheduled - filteredAbsenGuru.length)
    };
  }, [filteredAbsenGuru, schedules, config]);

  // 3. Logic for PELANGGARAN & PRESTASI
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

  // Rankings
  const rankings = useMemo(() => {
    const stdMap = new Map<string, number>();
    const clsMap = new Map<string, number>();

    if (activeTab === 'absen-santri') {
      const target = attendance.filter(a => {
        const s = students.find(std => std.id === a.studentId);
        // Exclude rank logic if status is alpha and it's holiday
        if (a.status === AttendanceStatus.A && isHoliday(a.class, a.sessionType)) return false;
        return s && a.status === absenRankStatus && isWithinTimeRange(a.date, timeRange, customDate);
      });
      target.forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) {
          stdMap.set(s.name, (stdMap.get(s.name) || 0) + 1);
          clsMap.set(a.class, (clsMap.get(a.class) || 0) + 1);
        }
      });
    } else if (activeTab === 'pelanggaran' || activeTab === 'prestasi') {
      const type = activeTab === 'pelanggaran' ? 'Violation' : 'Achievement';
      const target = reports.filter(r => {
        const s = students.find(std => std.id === r.studentId);
        const matchCat = reportRankCategory === 'Semua' || r.category === reportRankCategory;
        return s && r.type === type && matchCat && isWithinTimeRange(r.date, timeRange, customDate);
      });
      target.forEach(r => {
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
  }, [activeTab, attendance, reports, students, absenRankStatus, reportRankCategory, timeRange, customDate, config]);

  const chartData = useMemo(() => {
    if (activeTab === 'absen-santri') {
      const statusCounts = { S: 0, I: 0, T: 0, A: 0 };
      filteredAbsenSantri.forEach(a => {
        if (a.status === AttendanceStatus.S) statusCounts.S++;
        else if (a.status === AttendanceStatus.I) statusCounts.I++;
        else if (a.status === AttendanceStatus.T) statusCounts.T++;
        else if (a.status === AttendanceStatus.A) statusCounts.A++;
      });
      return [
        { name: 'Sakit', value: statusCounts.S },
        { name: 'Izin', value: statusCounts.I },
        { name: 'Terlambat', value: statusCounts.T },
        { name: 'Alpha', value: statusCounts.A },
      ].filter(d => d.value > 0);
    } else if (activeTab === 'absen-guru') {
      return [
        { name: 'Hadir', value: teacherStats.present },
        { name: 'Tidak Hadir', value: teacherStats.absent },
      ];
    } else {
      const catCounts: Record<string, number> = {};
      filteredReports.forEach(r => {
        catCounts[r.category] = (catCounts[r.category] || 0) + 1;
      });
      return Object.entries(catCounts).map(([name, value]) => ({ name, value }));
    }
  }, [activeTab, filteredAbsenSantri, filteredReports, teacherStats]);

  const exportData = () => {
    let csvData: any[] = [];
    if (activeTab === 'absen-santri') {
      csvData = filteredAbsenSantri.map(a => ({
        "Nama Santri": students.find(s => s.id === a.studentId)?.name || 'N/A',
        "Sesi": a.sessionType,
        "Kelas": a.class,
        "Status": a.status,
        "Keterangan": a.note
      }));
    } else if (activeTab === 'absen-guru') {
      csvData = filteredAbsenGuru.map(ta => ({
        "Nama Guru": ta.teacherName,
        "Sesi": schedules.find(s => s.teacherName === ta.teacherName && s.subject === ta.subject)?.sessionType || 'N/A',
        "Kelas": ta.class,
        "Status": "Hadir",
        "Mulai Mengajar": ta.startTime,
        "Selesai Mengajar": ta.endTime || '-',
        "Keterangan": ta.summary || '-'
      }));
    } else {
      csvData = filteredReports.map(r => ({
        "Nama Santri": students.find(s => s.id === r.studentId)?.name || 'N/A',
        "Kelas Formal": students.find(s => s.id === r.studentId)?.formalClass || 'N/A',
        "Kategori": r.category,
        "Nama Pelanggaran": r.description,
        "Status": r.status,
        "Keterangan Tindakan": r.actionNote || '-',
        "Pelapor": r.reporter
      }));
    }
    downloadCSV(csvData, `Laporan_${activeTab}`);
  };

  return (
    <div className="space-y-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* 4-Tab Navigation */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'absen-santri', label: 'Absen Santri', icon: <UserCheck size={18}/> },
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

      {/* Advanced Filters */}
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
           {(activeTab === 'absen-santri' || activeTab === 'absen-guru') && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
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
                   <option value="Semua">Semua</option>
                   {Object.values(ViolationCategory).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm grid grid-cols-2 gap-6">
            {activeTab === 'absen-santri' ? (
               <>
                 <StatCard label="Sakit" val={filteredAbsenSantri.filter(a=>a.status===AttendanceStatus.S).length} color="blue" />
                 <StatCard label="Izin" val={filteredAbsenSantri.filter(a=>a.status===AttendanceStatus.I).length} color="amber" />
                 <StatCard label="Terlambat" val={filteredAbsenSantri.filter(a=>a.status===AttendanceStatus.T).length} color="orange" />
                 <StatCard label="Alpha" val={filteredAbsenSantri.filter(a=>a.status===AttendanceStatus.A).length} color="red" />
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
           <RankingList 
             title="Ranking Santri" 
             data={rankings.students} 
             type="Kali" 
             color={activeTab === 'pelanggaran' ? 'red' : 'emerald'} 
             subFilter={activeTab === 'absen-santri' ? (
                <select value={absenRankStatus} onChange={e => setAbsenRankStatus(e.target.value as any)} className="text-[8px] font-black p-2 bg-slate-50 border-none rounded-lg uppercase">
                   <option value={AttendanceStatus.A}>Fokus Alpha</option>
                   <option value={AttendanceStatus.S}>Fokus Sakit</option>
                   <option value={AttendanceStatus.I}>Fokus Izin</option>
                   <option value={AttendanceStatus.T}>Fokus Lambat</option>
                </select>
             ) : (
                <select value={reportRankCategory} onChange={e => setReportRankCategory(e.target.value)} className="text-[8px] font-black p-2 bg-slate-50 border-none rounded-lg uppercase">
                   <option value="Semua">Semua Kategori</option>
                   {Object.values(ViolationCategory).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             )}
           />
           <RankingList 
             title="Ranking Unit Kelas" 
             data={rankings.classes} 
             type="Laporan" 
             color="indigo" 
           />
        </div>
      )}

      {/* Detail Tables */}
      <div className="bg-white p-12 rounded-[4rem] border shadow-2xl space-y-10">
         <div className="flex justify-between items-center border-b pb-8 border-slate-50">
            <div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Detail Histori</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesuai filter yang aktif</p>
            </div>
            <button onClick={exportData} className="px-8 py-4 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-3 hover:bg-emerald-900 transition-all">
               <Download size={18}/> Unduh Detail CSV
            </button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            {activeTab === 'absen-santri' && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Santri</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesi</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredAbsenSantri.map(a => (
                        <tr key={a.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-6 pr-4">
                              <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===a.studentId)?.name || 'N/A'}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{a.date}</p>
                           </td>
                           <td className="py-6 pr-4 font-black uppercase text-[10px] text-slate-500">{a.sessionType}</td>
                           <td className="py-6 pr-4 font-black uppercase text-[10px] text-slate-500">{a.class}</td>
                           <td className="py-6 pr-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${a.status === AttendanceStatus.A ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{a.status}</span>
                           </td>
                           <td className="py-6 pr-4 text-[10px] text-slate-500 italic">"{a.note || '-'}"</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {activeTab === 'absen-guru' && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pengajar</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit / Sesi</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mapel</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Summary</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredAbsenGuru.map(ta => (
                        <tr key={ta.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-6 pr-4">
                              <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{ta.teacherName}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{ta.date}</p>
                           </td>
                           <td className="py-6 pr-4">
                              <p className="font-black uppercase text-[10px] text-slate-800">{ta.class}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">SESI: MADRASAH</p>
                           </td>
                           <td className="py-6 pr-4 font-black uppercase text-[10px] text-slate-500">{ta.subject}</td>
                           <td className="py-6 pr-4 text-[10px] font-black text-emerald-700">{ta.startTime} - {ta.endTime || '?'}</td>
                           <td className="py-6 pr-4 text-[10px] text-slate-500 italic">"{ta.summary || '-'}"</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Santri</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Kasus / Kategori</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Poin</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pelapor</th>
                        <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Bukti</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredReports.map(r => (
                        <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-6 pr-4">
                              <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===r.studentId)?.name || 'N/A'}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">UNIT: {students.find(s=>s.id===r.studentId)?.formalClass || 'N/A'}</p>
                           </td>
                           <td className="py-6 pr-4">
                              <p className="text-[10px] font-black uppercase text-emerald-800">{r.category}</p>
                              <p className="text-[9px] font-bold text-slate-500 mt-1">"{r.description}"</p>
                           </td>
                           <td className="py-6 pr-4">
                              <div className="flex flex-col gap-2">
                                 <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase w-fit ${activeTab === 'pelanggaran' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{r.points} PT</span>
                                 <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase w-fit ${r.status === 'Ditindak' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                              </div>
                           </td>
                           <td className="py-6 pr-4">
                              <p className="text-[10px] font-black text-slate-600 truncate max-w-[120px]">{r.reporter}</p>
                              <p className="text-[8px] font-bold text-slate-300 uppercase">{r.time}</p>
                           </td>
                           <td className="py-6 pr-4">
                              {r.photoUrl ? (
                                <div className="space-y-2">
                                   <button onClick={() => setVisiblePhotoId(visiblePhotoId === r.id ? null : r.id)} className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase">
                                      {visiblePhotoId === r.id ? <EyeOff size={12}/> : <Eye size={12}/>} Foto
                                   </button>
                                   {visiblePhotoId === r.id && <div className="w-20 h-20 rounded-xl overflow-hidden border shadow-lg"><img src={r.photoUrl} className="w-full h-full object-cover" /></div>}
                                </div>
                              ) : <span className="text-[8px] font-black text-slate-200 uppercase">N/A</span>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}

            {chartData.length === 0 && (
               <div className="py-32 text-center text-slate-200 font-black uppercase italic tracking-[0.3em] text-[12px]">Belum Ada Data Tersedia</div>
            )}
         </div>
      </div>

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
