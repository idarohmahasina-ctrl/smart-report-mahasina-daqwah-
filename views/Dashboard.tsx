
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, UserCheck, MonitorCheck, ShieldAlert, Trophy, 
  Filter, Download, TrendingUp, Award, Clock, Users, ChevronRight,
  Activity, AlertCircle, CheckCircle, MapPin, Camera
} from 'lucide-react';
import { AppData, AttendanceStatus, ViolationCategory, UserRole, TeacherAttendance } from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'];

const RankingList = ({ title, data, type, color = "emerald", icon }: { title: string, data: any[], type: string, color?: string, icon?: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center shadow-inner`}>{icon || <Award size={20}/>}</div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
       </div>
    </div>
    <div className="space-y-3">
       {data.slice(0, 5).map((item, idx) => (
         <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
            <div className="flex items-center gap-4 overflow-hidden">
               <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border text-slate-400'}`}>
                  {idx + 1}
               </span>
               <span className="text-[11px] font-black text-slate-700 uppercase truncate">{item.name}</span>
            </div>
            <span className={`shrink-0 text-[10px] font-black ${idx === 0 ? `text-${color}-700 bg-${color}-50` : 'text-slate-600 bg-slate-100'} px-3 py-1 rounded-lg`}>{item.count} {type}</span>
         </div>
       ))}
       {data.length === 0 && (
         <div className="flex flex-col items-center py-10 opacity-20">
            <Activity size={32} />
            <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Data Kosong</p>
         </div>
       )}
    </div>
  </div>
);

const Dashboard: React.FC<AppData & { profile: any }> = (data) => {
  const [activeModul, setActiveModul] = useState<'santri' | 'guru' | 'pelanggaran' | 'prestasi'>('santri');
  
  // Filters
  const [timeRange, setTimeRange] = useState('Hari Ini');
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [attRankStatus, setAttRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);

  // Safe data access
  const students = data.students || [];
  const attendance = data.attendance || [];
  const reports = data.reports || [];
  const teacherAttendance = data.teacherAttendance || [];

  const isAdmin = data.profile?.email?.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const canSeeFullTeacherReport = isAdmin || 
                                  data.profile?.role === UserRole.IDAROH || 
                                  data.profile?.role === UserRole.MUSYRIF || 
                                  data.profile?.role === UserRole.PENGASUH;
  
  const canSeeTeacherTab = data.profile?.role !== UserRole.SANTRI_OFFICER;

  // Derive available sessions from students
  const availableSessions = useMemo(() => {
    const sessions = new Set<string>(['Madrasah']);
    students.forEach(s => {
      Object.keys(s.sessionClasses || {}).forEach(sess => sessions.add(sess));
    });
    return Array.from(sessions).sort((a: any, b: any) => String(a).localeCompare(String(b)));
  }, [students]);

  // Derive available classes based on selected session
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    students.forEach(s => {
      if (sessionFilter === 'Semua') {
        if (s.formalClass) classes.add(s.formalClass);
        Object.values(s.sessionClasses || {}).forEach(cls => { if(cls) classes.add(cls as string); });
      } else if (sessionFilter === 'Madrasah') {
        if (s.formalClass) classes.add(s.formalClass);
      } else {
        const cls = s.sessionClasses?.[sessionFilter];
        if (cls) classes.add(cls as string);
      }
    });
    return Array.from(classes).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
  }, [students, sessionFilter]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchSess = sessionFilter === 'Semua' || a.sessionType === sessionFilter;
      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      return matchSess && matchLvl && matchGdr && matchCls;
    });
  }, [attendance, students, sessionFilter, levelFilter, genderFilter, classFilter]);

  const filteredTeacherAttendance = useMemo(() => {
    let list = [...teacherAttendance];
    // Rule: Guru hanya bisa melihat data miliknya sendiri
    if (!canSeeFullTeacherReport) {
      list = list.filter(ta => ta.teacherEmail === data.profile?.email);
    }
    return list.filter(ta => {
      const matchCls = classFilter === 'Semua' || ta.class === classFilter;
      return matchCls;
    });
  }, [teacherAttendance, classFilter, data.profile?.email, canSeeFullTeacherReport]);

  const filteredReports = useMemo(() => {
    const type = activeModul === 'pelanggaran' ? 'Violation' : 'Achievement';
    return reports.filter(r => {
      if (r.type !== type) return false;
      const s = students.find(std => std.id === r.studentId);
      if (!s) return false;
      
      const studentClassInSession = sessionFilter === 'Semua' 
        ? s.formalClass 
        : (sessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[sessionFilter]);

      const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
      const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
      const matchCls = classFilter === 'Semua' || studentClassInSession === classFilter;
      
      return matchLvl && matchGdr && matchCls;
    });
  }, [reports, students, activeModul, sessionFilter, levelFilter, genderFilter, classFilter]);

  const stats: Record<string, number> = useMemo(() => {
    if (activeModul === 'santri') {
      return {
        H: filteredAttendance.filter(a => a.status === AttendanceStatus.H).length,
        S: filteredAttendance.filter(a => a.status === AttendanceStatus.S).length,
        I: filteredAttendance.filter(a => a.status === AttendanceStatus.I).length,
        T: filteredAttendance.filter(a => a.status === AttendanceStatus.T).length,
        A: filteredAttendance.filter(a => a.status === AttendanceStatus.A).length,
      };
    } else if (activeModul === 'guru') {
      return {
        Total: filteredTeacherAttendance.length,
        Selesai: filteredTeacherAttendance.filter(ta => !!ta.endTime).length,
        Aktif: filteredTeacherAttendance.filter(ta => !ta.endTime).length,
      };
    } else {
      return {
        Total: filteredReports.length,
        Ditindak: filteredReports.filter(r => r.status === 'Ditindak').length,
        Belum: filteredReports.filter(r => r.status === 'Belum Ditindak').length,
      };
    }
  }, [activeModul, filteredAttendance, filteredTeacherAttendance, filteredReports]);

  const rankings = useMemo(() => {
    const studentMap: Record<string, number> = {};
    const classMap: Record<string, number> = {};

    if (activeModul === 'santri') {
      filteredAttendance.filter(a => a.status === attRankStatus).forEach(a => {
        const s = students.find(std => std.id === a.studentId);
        if (s) {
          studentMap[s.name] = (studentMap[s.name] || 0) + 1;
          classMap[a.class] = (classMap[a.class] || 0) + 1;
        }
      });
    } else if (activeModul === 'guru') {
      filteredTeacherAttendance.forEach(ta => {
        studentMap[ta.teacherName] = (studentMap[ta.teacherName] || 0) + 1;
        classMap[ta.class] = (classMap[ta.class] || 0) + 1;
      });
    } else {
      filteredReports.forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) {
          const studentClassInSession = sessionFilter === 'Semua' 
            ? s.formalClass 
            : (sessionFilter === 'Madrasah' ? s.formalClass : s.sessionClasses?.[sessionFilter]);

          studentMap[s.name] = (studentMap[s.name] || 0) + 1;
          if (studentClassInSession) {
            classMap[studentClassInSession] = (classMap[studentClassInSession] || 0) + 1;
          }
        }
      });
    }

    const sortFn = (a: any, b: any) => b.count - a.count;
    return {
      students: Object.entries(studentMap).map(([name, count]) => ({ name, count })).sort(sortFn),
      classes: Object.entries(classMap).map(([name, count]) => ({ name, count })).sort(sortFn),
    };
  }, [activeModul, filteredAttendance, filteredTeacherAttendance, filteredReports, students, attRankStatus, sessionFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Sub Header Navigation */}
      <div className="bg-white p-2 rounded-3xl shadow-sm flex overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'santri', label: 'Absensi Santri', icon: <UserCheck size={18}/>, visible: true },
          { id: 'guru', label: 'Absensi Guru', icon: <MonitorCheck size={18}/>, visible: canSeeTeacherTab },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/>, visible: true },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/>, visible: true },
        ].filter(m => m.visible).map(mod => (
          <button 
            key={mod.id} 
            onClick={() => {
              setActiveModul(mod.id as any);
              setClassFilter('Semua');
            }} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeModul === mod.id ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {mod.icon} {mod.label}
          </button>
        ))}
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white p-8 rounded-[3rem] border shadow-sm grid grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Rentang Waktu</label>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none shadow-inner">
             <option>Hari Ini</option>
             <option>Minggu Ini</option>
             <option>Bulan Ini</option>
             <option>Semester Ini</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
          <select value={sessionFilter} onChange={e => { setSessionFilter(e.target.value); setClassFilter('Semua'); }} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none shadow-inner">
             <option value="Semua">Semua Sesi</option>
             {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none shadow-inner">
             <option>Semua</option>
             <option>MA</option>
             <option>MTs</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gender</label>
          <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none shadow-inner">
             <option>Semua</option>
             <option>Putra</option>
             <option>Putri</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Kelas</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase border-none outline-none shadow-inner">
             <option value="Semua">Semua Kelas</option>
             {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Statistics Recap Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {activeModul === 'santri' ? (
          <>
            {[
              { label: 'Hadir', val: stats.H, icon: <CheckCircle/>, color: 'emerald' },
              { label: 'Sakit', val: stats.S, icon: <Activity/>, color: 'blue' },
              { label: 'Izin', val: stats.I, icon: <Clock/>, color: 'amber' },
              { label: 'Terlambat', val: stats.T, icon: <TrendingUp/>, color: 'orange' },
              { label: 'Alpha', val: stats.A, icon: <AlertCircle/>, color: 'red' },
            ].map(s => (
              <div key={s.label} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center gap-3">
                <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center`}>{s.icon}</div>
                <h4 className="text-xl font-black">{s.val}</h4>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </>
        ) : activeModul === 'guru' ? (
          <>
            {[
              { label: 'Total Mengajar', val: stats.Total, icon: <MonitorCheck/>, color: 'indigo' },
              { label: 'Selesai KBM', val: stats.Selesai, icon: <CheckCircle/>, color: 'emerald' },
              { label: 'Sedang Berlangsung', val: stats.Aktif, icon: <Activity/>, color: 'amber' },
            ].map(s => (
              <div key={s.label} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center gap-3">
                <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center`}>{s.icon}</div>
                <h4 className="text-xl font-black">{s.val}</h4>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: 'Total Laporan', val: stats.Total, icon: <ShieldAlert/>, color: 'slate' },
              { label: 'Sudah Ditindak', val: stats.Ditindak, icon: <CheckCircle/>, color: 'emerald' },
              { label: 'Belum Ditindak', val: stats.Belum, icon: <AlertCircle/>, color: 'red' },
            ].map(s => (
              <div key={s.label} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center gap-3">
                <div className={`w-10 h-10 bg-${s.color}-50 text-${s.color}-600 rounded-xl flex items-center justify-center`}>{s.icon}</div>
                <h4 className="text-xl font-black">{s.val}</h4>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-1 bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
           <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-3"><Activity size={18}/> Komposisi Data</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie 
                      data={Object.entries(stats).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value"
                    >
                       {COLORS.map((col, i) => <Cell key={i} fill={col} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '10px'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Ranking Section */}
        <div className="lg:col-span-2 space-y-8">
           {activeModul === 'santri' && (
             <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-4">
                {[AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].map(st => (
                  <button 
                    key={st} 
                    onClick={() => setAttRankStatus(st)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${attRankStatus === st ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {st}
                  </button>
                ))}
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RankingList 
                title={`Top 5 ${activeModul === 'guru' ? 'Guru' : 'Santri'}`} 
                data={rankings.students} 
                type="Laporan" 
                color={activeModul === 'pelanggaran' ? 'red' : activeModul === 'prestasi' ? 'amber' : 'emerald'}
                icon={activeModul === 'guru' ? <MonitorCheck size={20}/> : <Users size={20}/>}
              />
              <RankingList 
                title="Top 5 Unit Kelas" 
                data={rankings.classes} 
                type="Laporan" 
                color="indigo" 
                icon={<MapPin size={20}/>}
              />
           </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white p-10 rounded-[4rem] border shadow-sm overflow-hidden">
         <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
              {activeModul === 'guru' ? <MonitorCheck size={20}/> : <Users size={20}/>} 
              Histori Laporan {activeModul === 'guru' ? 'Kehadiran Pengajar' : 'Terfilter'}
            </h3>
            <button 
              onClick={() => {
                const dataToExport = activeModul === 'santri' ? filteredAttendance : 
                                   activeModul === 'guru' ? filteredTeacherAttendance : 
                                   filteredReports;
                downloadCSV(dataToExport, `Rekap_${activeModul}_Mahasina`);
              }}
              className="px-6 py-3 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Download size={16}/> Unduh CSV
            </button>
         </div>
         <div className="overflow-x-auto no-scrollbar">
            {activeModul === 'guru' ? (
              <table className="w-full text-left">
                <thead>
                   <tr className="border-b-2 border-slate-50">
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Guru / Mapel</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Unit / Sesi</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Waktu Masuk</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Bukti Foto</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredTeacherAttendance.map(ta => (
                     <tr key={ta.id} className="hover:bg-slate-50">
                        <td className="py-5">
                           <p className="font-black uppercase text-[10px]">{ta.teacherName}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">{ta.subject}</p>
                        </td>
                        <td className="py-5">
                           <span className="px-2 py-1 bg-indigo-50 text-indigo-800 rounded text-[9px] font-black uppercase">{ta.class}</span>
                        </td>
                        <td className="py-5">
                           <p className="text-[10px] font-black text-emerald-700">{ta.startTime}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{ta.date}</p>
                        </td>
                        <td className="py-5">
                           {ta.photoUrl ? (
                             <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in group relative" onClick={() => window.open(ta.photoUrl)}>
                                <img src={ta.photoUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                   <Camera size={14} className="text-white"/>
                                </div>
                             </div>
                           ) : <span className="text-[8px] text-slate-300 italic uppercase">Tidak Ada</span>}
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                   <tr className="border-b-2 border-slate-50">
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Santri</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Keterangan</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Waktu</th>
                      <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Oleh</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {(activeModul === 'santri' ? filteredAttendance : filteredReports).map((item: any) => (
                     <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-5">
                           <p className="font-black uppercase text-[10px]">{students.find(s=>s.id===item.studentId)?.name || 'Santri'}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">{students.find(s=>s.id===item.studentId)?.formalClass}</p>
                        </td>
                        <td className="py-5">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.status === 'Hadir' || item.status === 'Ditindak' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                              {item.status || item.category}
                           </span>
                           <p className="text-[8px] font-medium text-slate-400 mt-1 max-w-[200px] truncate">{item.description || item.note}</p>
                        </td>
                        <td className="py-5 text-[9px] font-bold text-slate-500">{item.date} {item.time || item.timestamp}</td>
                        <td className="py-5 text-[9px] font-black uppercase text-emerald-700">{item.recordedBy || item.reporter}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
            )}
            {(activeModul === 'guru' ? filteredTeacherAttendance : filteredAttendance).length === 0 && (
               <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic text-[10px]">Belum Ada Data Terfilter</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
