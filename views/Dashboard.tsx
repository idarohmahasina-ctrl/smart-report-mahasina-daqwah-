
import React, { useState, useMemo } from 'react';
import { 
  Activity, Clock, CheckCircle, ShieldAlert, Trophy, 
  Download, Filter, ChevronRight, Award, AlertTriangle, 
  PieChart as PieIcon, BarChart3, UserCheck, Calendar, Search, FileText, UserMinus,
  Info as InfoIcon, Zap, Users
} from 'lucide-react';
import { 
  UserRole, AttendanceRecord, AttendanceStatus, Student, 
  UserProfile, TeacherAttendance, Schedule, AcademicConfig, SessionType, ViolationCategory,
  ReportItem
} from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { downloadCSV } from '../utils/csvExport';

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444', '#64748b'];

const isWithinRange = (dateStr: string, range: string, customDate?: string) => {
  if (!dateStr) return false;
  const parts = dateStr.split('/');
  if (parts.length < 3) return false;
  const [d, m, y] = parts.map(Number);
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
  
  const [filterSession, setFilterSession] = useState<string | 'Semua'>('Semua');
  const [filterLevel, setFilterLevel] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [filterClass, setFilterClass] = useState('Semua');
  const [santriRankStatus, setSantriRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);

  const isSuperAdmin = profile.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isMusyrif = profile.role === UserRole.MUSYRIF;
  const isPetugasSantri = profile.role === UserRole.SANTRI_OFFICER;

  // ANALITIK AKTIVITAS TIM
  const teamActivity = useMemo(() => {
    const combined = [...(attendance || []), ...(reports || [])];
    const uniqueReporters = new Set(combined.map(c => c.recordedBy || c.reporter));
    return {
      activeMembers: uniqueReporters.size,
      totalEntriesToday: combined.filter(c => c.date === new Date().toLocaleDateString('id-ID')).length
    };
  }, [attendance, reports]);

  // DYNAMIC SESSIONS FROM SCHEDULES (SAFE)
  const dynamicSessions = useMemo(() => {
    if (!schedules) return [];
    const sess = new Set<string>();
    schedules.forEach(s => { if(s.sessionType) sess.add(s.sessionType); });
    return Array.from(sess).sort();
  }, [schedules]);

  // DYNAMIC CLASSES FROM STUDENTS (SAFE)
  const dynamicClasses = useMemo(() => {
    if (!students) return [];
    let baseList = students;
    if (filterLevel !== 'Semua') {
      baseList = students.filter(s => s.level === filterLevel);
    }
    const classNames = baseList.map(s => s.formalClass).filter(Boolean);
    return Array.from(new Set(classNames)).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  }, [students, filterLevel]);

  const filteredAttendance = useMemo(() => {
    if (!attendance) return [];
    let list = attendance.filter(a => isWithinRange(a.date, timeRange, customDate));
    
    if (isMusyrif && !isSuperAdmin) {
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
  }, [attendance, timeRange, customDate, filterSession, filterClass, filterLevel, filterGender, isMusyrif, isSuperAdmin, profile.classes, students]);

  const stats = {
    H: filteredAttendance.filter(a => a.status === AttendanceStatus.H).length,
    S: filteredAttendance.filter(a => a.status === AttendanceStatus.S).length,
    I: filteredAttendance.filter(a => a.status === AttendanceStatus.I).length,
    T: filteredAttendance.filter(a => a.status === AttendanceStatus.T).length,
    A: filteredAttendance.filter(a => a.status === AttendanceStatus.A).length,
  };

  const getRankingSITA = (status: AttendanceStatus, target: 'name' | 'class') => {
    const map: Record<string, number> = {};
    filteredAttendance.filter(a => a.status === status).forEach(a => {
      const s = students.find(std => std.id === a.studentId);
      if (s) {
        const key = target === 'name' ? (s.name || 'N/A') : (s.formalClass || 'N/A');
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* STATUS BAR OTOMATIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between group overflow-hidden relative">
           <div className="absolute -right-4 -bottom-4 text-emerald-100 group-hover:scale-110 transition-transform"><Users size={100}/></div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Tim Bertugas Hari Ini</p>
              <h4 className="text-2xl font-black text-emerald-950 mt-1">{teamActivity.activeMembers} <span className="text-sm font-bold opacity-50">Petugas</span></h4>
           </div>
           <div className="text-right relative z-10">
              <p className="text-[9px] font-black text-emerald-600 bg-white px-3 py-1 rounded-lg shadow-sm uppercase tracking-tighter">Total {teamActivity.totalEntriesToday} Input</p>
           </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-center justify-between group overflow-hidden relative">
           <div className="absolute -right-4 -bottom-4 text-indigo-100 group-hover:scale-110 transition-transform"><Zap size={100}/></div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Status Sinkronisasi</p>
              <h4 className="text-xl font-black text-indigo-950 mt-1 uppercase">Otomatis Aktif</h4>
           </div>
           <div className="text-right relative z-10">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"/> Live Cloud
              </span>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Analitik Data</h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2 italic">
               {isSuperAdmin ? 'Pantauan Real-time Pusat' : `Area Tugas: ${profile.fullName}`}
            </p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner shrink-0 overflow-x-auto no-scrollbar max-w-full">
            {['Santri', 'Guru', 'Pelanggaran', 'Prestasi'].map(t => {
               if (t === 'Guru' && isPetugasSantri) return null;
               return (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 sm:px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {t}
                  </button>
               )
            })}
         </div>
      </div>

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
               <select value={filterSession} onChange={e => setFilterSession(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA SESI</option>
                  {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkatan</label>
               <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA TINGKATAN</option>
                  <option value="MTs">MTs</option>
                  <option value="MA">MA</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
               <select value={filterGender} onChange={e => setFilterGender(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA GENDER</option>
                  <option value="Putra">PUTRA</option>
                  <option value="Putri">PUTRI</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kelas Spesifik</label>
               <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
                  <option value="Semua">SEMUA KELAS</option>
                  {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>
      </div>

      {activeTab === 'Santri' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Hadir', val: stats.H, color: 'emerald', icon: CheckCircle },
                { label: 'Sakit', val: stats.S, color: 'blue', icon: Activity },
                { label: 'Izin', val: stats.I, color: 'indigo', icon: FileText },
                { label: 'Terlambat', val: stats.T, color: 'orange', icon: Clock },
                { label: 'Alpha', val: stats.A, color: 'red', icon: AlertTriangle },
              ].map(st => (
                <div key={st.label} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col items-center text-center hover:shadow-xl transition-all group">
                   <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center bg-${st.color}-50 text-${st.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>
                      <st.icon size={22}/>
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.label}</p>
                   <h4 className="text-2xl font-black text-slate-800 leading-none">{st.val}</h4>
                </div>
              ))}
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm space-y-6">
                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><PieIcon size={16} className="text-emerald-600"/> Komposisi Kehadiran</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={[{ name: 'Hadir', val: stats.H }, { name: 'Sakit', val: stats.S }, { name: 'Izin', val: stats.I }, { name: 'Terlambat', val: stats.T }, { name: 'Alpha', val: stats.A }].filter(d => d.val > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="val">
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
                       <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Analisis Ketidakhadiran</h3>
                       <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
                          {[AttendanceStatus.A, AttendanceStatus.T, AttendanceStatus.I, AttendanceStatus.S].map(st => (
                             <button key={st} onClick={() => setSantriRankStatus(st)} className={`w-8 h-8 rounded-md text-[10px] font-black transition-all ${santriRankStatus === st ? 'bg-emerald-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{st[0]}</button>
                          ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                       <RankingCard title={`Ranking Santri (${santriRankStatus})`} data={getRankingSITA(santriRankStatus, 'name')} type="KALI" />
                       <RankingCard title={`Unit Kelas (${santriRankStatus})`} data={getRankingSITA(santriRankStatus, 'class')} type="KALI" color="blue" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
