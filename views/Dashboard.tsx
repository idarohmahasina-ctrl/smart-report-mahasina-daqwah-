
import React, { useState, useMemo } from 'react';
import { TrendingUp, UserCheck, ShieldAlert, Trophy, History, Download, Users, GraduationCap, Award, Calendar, Activity } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend } from 'recharts';
import { AppData, AttendanceStatus, UserRole } from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';
import { normalizeSessionName } from './utils/nameMatchers.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#f97316'];

const Dashboard: React.FC<AppData & { profile: any }> = ({ profile, ...data }) => {
  const [activeTab, setActiveTab] = useState<'kbm' | 'guru' | 'pelanggaran' | 'prestasi'>('kbm');
  const [timeRange, setTimeRange] = useState('Semua');
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');

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
    schedules.forEach(sch => c.add(sch.class));
    return Array.from(c).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students, schedules]);

  const filteredKBM = useMemo(() => {
    return attendance.filter(a => {
      const matchSess = sessionFilter === 'Semua' || normalizeSessionName(a.sessionType) === sessionFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      return matchSess && matchCls;
    });
  }, [attendance, sessionFilter, classFilter]);

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

  const pieData = useMemo(() => {
    if (activeTab === 'kbm') {
      return [
        { name: 'Hadir', value: stats.H },
        { name: 'Sakit', value: stats.S },
        { name: 'Izin', value: stats.I },
        { name: 'Telat', value: stats.T },
        { name: 'Alpha', value: stats.A },
      ].filter(d => d.value > 0);
    }
    return [];
  }, [activeTab, stats]);

  const studentRanking = useMemo(() => {
    const map = new Map<string, number>();
    if (activeTab === 'kbm') {
      filteredKBM.filter(a => a.status === AttendanceStatus.A).forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) map.set(s.name, (map.get(s.name) || 0) + 1);
      });
    } else if (activeTab === 'pelanggaran') {
      reports.filter(r => r.type === 'Violation').forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) map.set(s.name, (map.get(s.name) || 0) + r.points);
      });
    } else if (activeTab === 'prestasi') {
      reports.filter(r => r.type === 'Achievement').forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) map.set(s.name, (map.get(s.name) || 0) + r.points);
      });
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [activeTab, filteredKBM, reports, students]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
           {/* Filters */}
           <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                 <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border border-slate-100">
                    <option value="Semua">Semua Sesi</option>
                    {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Unit / Kelas</label>
                 <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border border-slate-100">
                    <option value="Semua">Semua Unit</option>
                    {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div className="flex items-end">
                 <button onClick={() => downloadCSV(filteredKBM, 'Dashboard_Export')} className="w-full px-6 py-3 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2"><Download size={14}/> Unduh Data</button>
              </div>
           </div>

           {/* Stats Cards */}
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {activeTab === 'kbm' ? (
                <>
                  <StatCard label="Hadir" val={stats.H} color="emerald" />
                  <StatCard label="Sakit" val={stats.S} color="blue" />
                  <StatCard label="Izin" val={stats.I} color="amber" />
                  <StatCard label="Alpha" val={stats.A} color="red" />
                  <StatCard label="Total" val={filteredKBM.length} color="slate" />
                </>
              ) : (
                <div className="col-span-5 bg-white p-10 rounded-[2.5rem] border text-center font-black uppercase text-[12px] opacity-30">Analisa {activeTab} siap digunakan</div>
              )}
           </div>

           {/* Ranking */}
           <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase text-slate-800 flex items-center gap-3"><Trophy size={20} className="text-amber-500"/> Ranking {activeTab === 'kbm' ? 'Alpha Terbanyak' : 'Poin Tertinggi'}</h3>
              </div>
              <div className="space-y-3">
                 {studentRanking.map((row, idx) => (
                   <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-[2rem] hover:bg-white border hover:border-slate-100 transition-all group">
                      <div className="flex items-center gap-5">
                         <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-white shadow-lg scale-110' : 'bg-white text-slate-400'}`}>{idx+1}</span>
                         <p className="font-black uppercase text-[12px] text-slate-800">{row.name}</p>
                      </div>
                      <p className="text-[11px] font-black text-slate-600 bg-white px-4 py-1.5 rounded-xl border border-slate-100">{row.count} {activeTab === 'kbm' ? 'Kali' : 'Poin'}</p>
                   </div>
                 ))}
                 {studentRanking.length === 0 && <div className="py-10 text-center opacity-30 italic">Belum ada data ranking</div>}
              </div>
           </div>
        </div>

        {/* Visualisasi Samping */}
        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <h3 className="text-[11px] font-black uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={16}/> Komposisi {activeTab}</h3>
              {pieData.length > 0 ? (
                <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                         </Pie>
                         <ChartTooltip />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-20 opacity-20"><Activity size={64}/></div>
              )}
           </div>

           <div className="bg-emerald-950 p-10 rounded-[3.5rem] text-white space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Ringkasan Hari Ini</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <p className="text-[9px] font-bold uppercase text-emerald-100/60">Input Kehadiran</p>
                    <p className="text-2xl font-black">{data.attendance.filter(a => a.date === new Date().toLocaleDateString('id-ID')).length}</p>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <p className="text-[9px] font-bold uppercase text-emerald-100/60">Guru Aktif Mengajar</p>
                    <p className="text-2xl font-black">{new Set(data.teacherAttendance.filter(a => a.date === new Date().toLocaleDateString('id-ID')).map(ta => ta.teacherName)).size}</p>
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
