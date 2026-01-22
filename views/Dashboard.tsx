
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
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [rankStatus, setRankStatus] = useState<string>('Alpha');

  const students = data.students || [];
  const attendance = data.attendance || [];
  const teacherAttendance = data.teacherAttendance || [];
  const reports = data.reports || [];
  const schedules = data.schedules || [];

  // Discovery Opsi Dinamis dari Master Data
  const dynamicSessions = useMemo(() => {
    const s = new Set<string>();
    schedules.forEach(sch => s.add(normalizeSessionName(sch.sessionType)));
    return Array.from(s).sort();
  }, [schedules]);

  const dynamicClasses = useMemo(() => {
    const c = new Set<string>();
    students.forEach(std => c.add(std.formalClass));
    schedules.forEach(sch => c.add(sch.class));
    return Array.from(c).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students, schedules]);

  const dynamicCategories = useMemo(() => {
    const cat = new Set<string>();
    reports.forEach(r => cat.add(r.category));
    return Array.from(cat).sort();
  }, [reports]);

  const filteredKBM = useMemo(() => {
    return attendance.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchTime = isWithinTimeRange(a.date, timeRange, customDate);
      const matchSess = sessionFilter === 'Semua' || normalizeSessionName(a.sessionType) === normalizeSessionName(sessionFilter);
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      return matchTime && matchSess && matchLvl && matchGdr && matchCls;
    });
  }, [attendance, students, timeRange, customDate, sessionFilter, levelFilter, genderFilter, classFilter]);

  const stats = useMemo(() => {
    if (activeTab === 'kbm') {
      return {
        H: filteredKBM.filter(a => a.status === AttendanceStatus.H).length,
        S: filteredKBM.filter(a => a.status === AttendanceStatus.S).length,
        I: filteredKBM.filter(a => a.status === AttendanceStatus.I).length,
        T: filteredKBM.filter(a => a.status === AttendanceStatus.T).length,
        A: filteredKBM.filter(a => a.status === AttendanceStatus.A).length,
      };
    }
    return { count: reports.length, present: teacherAttendance.length };
  }, [activeTab, filteredKBM, reports, teacherAttendance]);

  // Fix: Added missing handleExportLog function
  const handleExportLog = () => {
    let exportData: any[] = [];
    let filename = `Dashboard_Export_${activeTab}`;

    if (activeTab === 'kbm') {
      exportData = filteredKBM.map(a => {
        const s = students.find(std => std.id === a.studentId);
        return {
          "Tanggal": a.date,
          "Sesi": a.sessionType,
          "Nama Santri": s?.name || 'N/A',
          "Kelas": a.class,
          "Status": a.status,
          "Keterangan": a.note || '-',
          "Petugas": a.recordedBy
        };
      });
    } else if (activeTab === 'guru') {
      exportData = teacherAttendance.map(ta => ({
        "Tanggal": ta.date,
        "Nama Guru": ta.teacherName,
        "Mapel": ta.subject,
        "Kelas": ta.class,
        "Jam Masuk": ta.startTime,
        "Keterangan": ta.summary || '-'
      }));
    } else {
      const type = activeTab === 'pelanggaran' ? 'Violation' : 'Achievement';
      exportData = reports.filter(r => r.type === type).map(r => {
        const s = students.find(std => std.id === r.studentId);
        return {
          "Tanggal": r.date,
          "Nama Santri": s?.name || 'N/A',
          "Kategori": r.category,
          "Deskripsi": r.description,
          "Poin": r.points,
          "Reporter": r.reporter,
          "Status": r.status
        };
      });
    }
    downloadCSV(exportData, filename);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        {[
          { id: 'kbm', label: 'Absen KBM', icon: <UserCheck size={18}/> },
          { id: 'guru', label: 'Absen Guru', icon: <GraduationCap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-[#064e3b] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Waktu</label>
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                 {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester Ini', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
           </div>
           {(activeTab === 'kbm' || activeTab === 'guru') && (
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                   <option value="Semua">Semua Sesi</option>
                   {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
           )}
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit / Kelas</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                 <option value="Semua">Semua</option>
                 {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {(activeTab === 'pelanggaran' || activeTab === 'prestasi') && (
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Kategori</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                   <option value="Semua">Semua</option>
                   {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {activeTab === 'kbm' && (
          <>
            <StatCard label="Hadir" val={stats.H} color="emerald" />
            <StatCard label="Sakit" val={stats.S} color="blue" />
            <StatCard label="Izin" val={stats.I} color="amber" />
            <StatCard label="Telat" val={stats.T} color="orange" />
            <StatCard label="Alpha" val={stats.A} color="red" />
          </>
        )}
      </div>

      <div className="bg-white p-10 rounded-[4rem] border shadow-sm">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase text-slate-800">Visualisasi Data Dinamis</h3>
            <button onClick={handleExportLog} className="px-6 py-3 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Download size={14}/> Ekspor (.CSV)</button>
         </div>
         <div className="h-64 opacity-50 flex items-center justify-center italic text-slate-400 font-bold uppercase text-[10px]">Laporan Berdasarkan Master Data Terbaru Anda</div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color }: { label: string, val: number | string, color: string }) => (
  <div className={`p-6 bg-${color}-50 border border-white rounded-[2.5rem] flex flex-col gap-3 shadow-sm`}>
     <h4 className="text-2xl font-black text-slate-800">{val}</h4>
     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
  </div>
);

export default Dashboard;
