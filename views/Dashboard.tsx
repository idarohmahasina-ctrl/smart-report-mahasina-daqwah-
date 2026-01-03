
import React, { useState, useMemo } from 'react';
import { 
  Activity, Clock, CheckCircle, ShieldAlert, Trophy, 
  Download, Filter, ChevronRight, Award, AlertTriangle, 
  PieChart as PieIcon, BarChart3, UserCheck, Calendar, Search, FileText
} from 'lucide-react';
import { 
  UserRole, AttendanceRecord, ReportItem, AttendanceStatus, Student, 
  UserProfile, TeacherAttendance, Schedule, AcademicConfig, SessionType, ViolationCategory
} from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { downloadCSV } from '../utils/csvExport';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

// Helper for filtering by time range
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
      // Last 6 months simplified
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

interface DashboardProps {
  attendance: AttendanceRecord[];
  reports: ReportItem[];
  profile: UserProfile;
  students: Student[];
  teacherAttendance: TeacherAttendance[];
  schedules: Schedule[];
  academicConfig: AcademicConfig;
  onDeleteReport?: (id: string) => void;
  onUpdateReport?: (report: ReportItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  attendance, reports, profile, students, teacherAttendance, schedules, academicConfig
}) => {
  const [activeTab, setActiveTab] = useState<'Santri' | 'Guru' | 'Pelanggaran' | 'Prestasi'>('Santri');
  const [timeRange, setTimeRange] = useState('Bulan Ini');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Advanced Filters
  const [filterSession, setFilterSession] = useState<SessionType | 'Semua'>('Semua');
  const [filterLevel, setFilterLevel] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [filterClass, setFilterClass] = useState('Semua');

  // Ranking View Toggles
  const [santriRankStatus, setSantriRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);

  const isAdmin = profile.role === UserRole.IDAROH || profile.role === UserRole.PENGASUH;
  const isMusyrif = profile.role === UserRole.MUSYRIF;
  const isGuru = profile.role === UserRole.GURU;
  const isPetugasSantri = profile.role === UserRole.SANTRI_OFFICER;

  // 1. Data Filter Logic (Santri)
  const filteredAttendance = useMemo(() => {
    let list = attendance.filter(a => isWithinRange(a.date, timeRange, customDate));
    
    // Role filter
    if (isMusyrif) {
      list = list.filter(a => {
        const s = students.find(std => std.id === a.studentId);
        return profile.classes?.includes(s?.formalClass || '');
      });
    }

    if (filterSession !== 'Semua') list = list.filter(a => a.sessionType === filterSession);
    if (filterClass !== 'Semua') list = list.filter(a => a.class === filterClass);

    return list.filter(a => {
      const s = students.find(std => std.id === a.studentId);
      if (!s) return false;
      const matchLvl = filterLevel === 'Semua' || s.level === filterLevel;
      const matchGdr = filterGender === 'Semua' || s.gender === filterGender;
      return matchLvl && matchGdr;
    });
  }, [attendance, timeRange, customDate, filterSession, filterClass, filterLevel, filterGender, isMusyrif, profile.classes, students]);

  // 2. Data Filter Logic (Teacher)
  const filteredTeachers = useMemo(() => {
    let list = teacherAttendance.filter(a => isWithinRange(a.date, timeRange, customDate));
    if (isGuru) list = list.filter(a => a.teacherName === profile.fullName);
    if (filterClass !== 'Semua') list = list.filter(a => a.class === filterClass);
    return list.filter(a => {
      const matchLvl = filterLevel === 'Semua' || a.level === filterLevel;
      const matchGdr = filterGender === 'Semua' || a.gender === filterGender;
      return matchLvl && matchGdr;
    });
  }, [teacherAttendance, timeRange, customDate, isGuru, profile.fullName, filterClass, filterLevel, filterGender]);

  // 3. Data Filter Logic (Reports)
  const getFilteredReports = (type: 'Violation' | 'Achievement') => {
    let list = reports.filter(r => r.type === type && isWithinRange(r.date, timeRange, customDate));
    
    if (isMusyrif) {
      list = list.filter(r => {
        const s = students.find(std => std.id === r.studentId);
        return profile.classes?.includes(s?.formalClass || '');
      });
    }

    if (filterClass !== 'Semua') list = list.filter(r => {
      const s = students.find(std => std.id === r.studentId);
      return s?.formalClass === filterClass;
    });

    return list.filter(r => {
      const s = students.find(std => std.id === r.studentId);
      if (!s) return false;
      const matchLvl = filterLevel === 'Semua' || s.level === filterLevel;
      const matchGdr = filterGender === 'Semua' || s.gender === filterGender;
      return matchLvl && matchGdr;
    });
  };

  // Stats Calculations
  const stats = {
    H: filteredAttendance.filter(a => a.status === AttendanceStatus.H).length,
    S: filteredAttendance.filter(a => a.status === AttendanceStatus.S).length,
    I: filteredAttendance.filter(a => a.status === AttendanceStatus.I).length,
    T: filteredAttendance.filter(a => a.status === AttendanceStatus.T).length,
    A: filteredAttendance.filter(a => a.status === AttendanceStatus.A).length,
  };

  const teacherStats = {
    present: filteredTeachers.filter(a => a.status === 'Hadir').length,
    late: filteredTeachers.filter(a => a.status === 'Terlambat').length,
    sick: filteredTeachers.filter(a => a.status === 'Izin').length,
    alpha: filteredTeachers.filter(a => a.status === 'Alpha').length,
    totalSessions: filteredTeachers.length
  };

  const getRankingSITA = (status: AttendanceStatus, target: 'name' | 'class') => {
    const map: Record<string, number> = {};
    filteredAttendance.filter(a => a.status === status).forEach(a => {
      const s = students.find(std => std.id === a.studentId);
      if (s) {
        const key = target === 'name' ? s.name : s.formalClass;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  };

  const getReportRankings = (type: 'Violation' | 'Achievement', target: 'name' | 'class') => {
    const list = getFilteredReports(type);
    const map: Record<string, number> = {};
    list.forEach(r => {
      const s = students.find(std => std.id === r.studentId);
      if (s) {
        const key = target === 'name' ? s.name : s.formalClass;
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  };

  const violationStats = getFilteredReports('Violation');
  const achievementStats = getFilteredReports('Achievement');

  const reportCategoryChart = useMemo(() => {
    const list = activeTab === 'Pelanggaran' ? violationStats : achievementStats;
    const map: Record<string, number> = {};
    list.forEach(r => {
      map[r.category] = (map[r.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeTab, violationStats, achievementStats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Dashboard</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2 italic">Analitik & Laporan Mahasina</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner shrink-0 overflow-x-auto no-scrollbar max-w-full">
            {['Santri', 'Guru', 'Pelanggaran', 'Prestasi'].map(t => {
               if (t === 'Guru' && isPetugasSantri) return null;
               if ((t === 'Pelanggaran' || t === 'Prestasi') && isGuru) return null;
               return (
                  <button 
                    key={t} 
                    onClick={() => setActiveTab(t as any)} 
                    className={`px-5 sm:px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t}
                  </button>
               )
            })}
         </div>
      </div>

      {/* 2. Global Filter Bar */}
      <div className="bg-white p-6 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentang Waktu</label>
               <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  {['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester', 'Pilih Tanggal'].map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesi / Unit</label>
               <select value={filterSession} onChange={e => setFilterSession(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA SESI</option>
                  {Object.values(SessionType).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkatan</label>
               <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA TINGKATAN (MA/MTs)</option>
                  <option value="MTs">MTs SAHAJA</option>
                  <option value="MA">MA SAHAJA</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
               <select value={filterGender} onChange={e => setFilterGender(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA GENDER (PUTRA & PUTRI)</option>
                  <option value="Putra">PUTRA</option>
                  <option value="Putri">PUTRI</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Spesifik</label>
               <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA KELAS</option>
                  {Array.from(new Set(students.map(s => s.formalClass))).sort().map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>
         {timeRange === 'Pilih Tanggal' && (
           <div className="pt-4 border-t border-slate-50 flex items-center gap-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih Tanggal Spesifik:</label>
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black outline-none border border-slate-100" />
           </div>
         )}
      </div>

      {/* 3. Main Statistic Content */}
      {activeTab === 'Santri' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Sakit / Izin', val: stats.S + stats.I, color: 'blue', icon: Activity },
                { label: 'Terlambat', val: stats.T, color: 'orange', icon: Clock },
                { label: 'Alpha', val: stats.A, color: 'red', icon: AlertTriangle },
                { label: 'Hadir', val: stats.H, color: 'emerald', icon: CheckCircle },
              ].map(st => (
                <div key={st.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6 hover:shadow-xl transition-all group">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${st.color}-50 text-${st.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>
                      <st.icon size={28}/>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.label}</p>
                      <h4 className="text-3xl font-black text-slate-800 leading-none">{st.val}</h4>
                   </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PieIcon size={16} className="text-emerald-600"/> Komposisi Kehadiran</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                            data={[
                              { name: 'Sakit', val: stats.S },
                              { name: 'Izin', val: stats.I },
                              { name: 'Terlambat', val: stats.T },
                              { name: 'Alpha', val: stats.A },
                              { name: 'Hadir', val: stats.H }
                            ].filter(d => d.val > 0)} 
                            cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="val"
                          >
                             {[0,1,2,3,4].map(idx => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '10px'}} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                       <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ranking Ketidakhadiran</h3>
                       <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                          {[AttendanceStatus.A, AttendanceStatus.T, AttendanceStatus.I, AttendanceStatus.S].map(st => (
                             <button key={st} onClick={() => setSantriRankStatus(st)} className={`w-8 h-8 rounded-md text-[10px] font-black transition-all ${santriRankStatus === st ? 'bg-emerald-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{st[0]}</button>
                          ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                       <RankingCard title={`Ranking Siswa (${santriRankStatus})`} data={getRankingSITA(santriRankStatus, 'name')} type="KALI" />
                       <RankingCard title={`Ranking Kelas (${santriRankStatus})`} data={getRankingSITA(santriRankStatus, 'class')} type="KALI" color="blue" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Guru' && !isPetugasSantri && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Sesi Diajar', val: teacherStats.totalSessions, color: 'slate', icon: FileText },
                { label: 'Hadir', val: teacherStats.present, color: 'emerald', icon: CheckCircle },
                { label: 'Terlambat', val: teacherStats.late, color: 'orange', icon: Clock },
                { label: 'Izin / Sakit', val: teacherStats.sick, color: 'blue', icon: Activity },
                { label: 'Alpha', val: teacherStats.alpha, color: 'red', icon: AlertTriangle },
              ].map(st => (
                <div key={st.label} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm text-center">
                   <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${st.color}-50 text-${st.color}-600`}>
                      <st.icon size={20}/>
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{st.label}</p>
                   <h4 className="text-xl font-black text-slate-800 mt-1">{st.val}</h4>
                </div>
              ))}
           </div>
        </div>
      )}

      {(activeTab === 'Pelanggaran' || activeTab === 'Prestasi') && !isGuru && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: `Total ${activeTab}`, val: activeTab === 'Pelanggaran' ? violationStats.length : achievementStats.length, color: activeTab === 'Pelanggaran' ? 'red' : 'emerald', icon: activeTab === 'Pelanggaran' ? ShieldAlert : Trophy },
                { label: 'Sudah Ditindak', val: (activeTab === 'Pelanggaran' ? violationStats : achievementStats).filter(r => r.status === 'Ditindak').length, color: 'blue', icon: CheckCircle },
                { label: 'Belum Ditindak', val: (activeTab === 'Pelanggaran' ? violationStats : achievementStats).filter(r => r.status === 'Belum Ditindak').length, color: 'amber', icon: Clock },
              ].map(st => (
                <div key={st.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${st.color}-50 text-${st.color}-600 shadow-inner`}>
                      <st.icon size={28}/>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.label}</p>
                      <h4 className="text-3xl font-black text-slate-800">{st.val}</h4>
                   </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={16} className="text-indigo-600"/> Tren Kategori {activeTab}</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={reportCategoryChart}>
                          <XAxis dataKey="name" fontSize={8} fontWeight="bold" />
                          <YAxis fontSize={8} />
                          <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '10px'}} />
                          <Bar dataKey="value" fill={activeTab === 'Pelanggaran' ? '#ef4444' : '#10b981'} radius={[6, 6, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                 <RankingCard title={`Ranking Siswa Ter-aktif (${activeTab})`} data={getReportRankings(activeTab === 'Pelanggaran' ? 'Violation' : 'Achievement', 'name')} type="DATA" />
                 <RankingCard title={`Ranking Kelas Ter-aktif (${activeTab})`} data={getReportRankings(activeTab === 'Pelanggaran' ? 'Violation' : 'Achievement', 'class')} type="DATA" color="blue" />
              </div>
           </div>
        </div>
      )}

      {/* 4. DETAIL DATA TABLE (AT THE VERY BOTTOM) */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-xl overflow-hidden mt-12">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><FileText size={20} className="text-emerald-700"/> Rekap Detail {activeTab}</h3>
               <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Tampilkan data berdasarkan filter yang aktif</p>
            </div>
            <button 
              onClick={() => {
                let dataToExport = [];
                if (activeTab === 'Santri') dataToExport = filteredAttendance;
                else if (activeTab === 'Guru') dataToExport = filteredTeachers;
                else if (activeTab === 'Pelanggaran') dataToExport = violationStats;
                else dataToExport = achievementStats;
                downloadCSV(dataToExport, `Rekap_${activeTab}_Mahasina`);
              }}
              className="p-3.5 bg-emerald-900 text-white rounded-2xl shadow-lg flex items-center gap-3 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all active:scale-95 whitespace-nowrap"
            >
               <Download size={16}/> Unduh Laporan (CSV)
            </button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            {activeTab === 'Santri' ? (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Siswa / Kelas</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesi / Tanggal</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredAttendance.map(a => (
                        <tr key={a.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-5 pr-4">
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===a.studentId)?.name || 'Siswa Dihapus'}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">Unit: {a.class}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                a.status === AttendanceStatus.H ? 'bg-emerald-100 text-emerald-800' : 
                                a.status === AttendanceStatus.A ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>{a.status}</span>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[9px] font-bold text-slate-600">{a.sessionType}</p>
                              <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">{a.date}</p>
                           </td>
                           <td className="py-5 pr-4 text-[10px] font-medium text-slate-500 italic">{a.note || '-'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : activeTab === 'Guru' ? (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Guru</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mapel / Kelas</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Jam Absen</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredTeachers.map(a => (
                        <tr key={a.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-5 pr-4 text-[11px] font-black text-slate-800 uppercase">{a.teacherName}</td>
                           <td className="py-5 pr-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>{a.status}</span>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[10px] font-bold text-slate-600">{a.subject}</p>
                              <p className="text-[8px] font-black text-slate-400 mt-1 uppercase">{a.class} • {a.level}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[9px] font-black text-slate-800">{a.checkInTime} - {a.checkOutTime || '...'}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{a.date}</p>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : (
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b-2 border-slate-50">
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Siswa / Kelas</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Laporan</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Kat / Poin</th>
                        <th className="pb-5 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Tindak</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {(activeTab === 'Pelanggaran' ? violationStats : achievementStats).map(r => (
                        <tr key={r.id} className="group hover:bg-slate-50 transition-all">
                           <td className="py-5 pr-4">
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{students.find(s=>s.id===r.studentId)?.name || 'Siswa Dihapus'}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">{r.date}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[10px] font-bold text-slate-700 leading-tight">{r.description}</p>
                              <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">Oleh: {r.reporter}</p>
                           </td>
                           <td className="py-5 pr-4">
                              <p className="text-[9px] font-black text-indigo-700 uppercase leading-none">{r.category}</p>
                              <p className="text-[10px] font-black text-slate-800 mt-1.5">{r.points} PT</p>
                           </td>
                           <td className="py-5 pr-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                r.status === 'Ditindak' ? 'bg-emerald-700 text-white shadow-md' : 'bg-amber-100 text-amber-800'
                              }`}>{r.status}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
            {((activeTab === 'Santri' && filteredAttendance.length === 0) || 
               (activeTab === 'Guru' && filteredTeachers.length === 0) || 
               (activeTab === 'Pelanggaran' && violationStats.length === 0) ||
               (activeTab === 'Prestasi' && achievementStats.length === 0)) && (
               <div className="py-32 text-center">
                  <p className="text-[12px] font-black text-slate-300 uppercase italic tracking-[0.3em]">Data Tidak Ditemukan Untuk Filter Ini</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
