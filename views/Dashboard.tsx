
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Activity, Clock, UserX, Users, Calendar, CheckCircle, Award, ShieldAlert, 
  TrendingUp, Filter, UserCheck, Search, ChevronRight, AlertCircle, BookmarkCheck,
  Download, Trophy, School, ListOrdered, GraduationCap, User, FileText, LayoutGrid, ChevronDown, ListChecks, Printer,
  Eye, ShieldCheck, HelpCircle, ClipboardCheck, AlertTriangle, Layers, Trash2, Edit2, Check, X, BarChart3, Medal
} from 'lucide-react';
import { 
  UserRole, AttendanceRecord, ReportItem, AttendanceStatus, Student, 
  UserProfile, TeacherAttendance, Schedule, TemplateItem, SessionType, ViolationCategory
} from '../types';
import { CLASSES } from '../constants';
import { downloadCSV } from '../utils/csvExport';

// Fix: Define Period type to resolve "Cannot find name 'Period'" error
type Period = 'Tanggal' | 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini' | 'Semester' | 'Tahun Ajaran';

const StatCard = ({ label, value, color, icon: Icon, subLabel }: { label: string, value: number | string, color: string, icon: any, subLabel?: string }) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white p-8 rounded-[3rem] border shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors[color] || 'bg-slate-50 text-slate-400'} shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h4>
        {subLabel && <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{subLabel}</p>}
      </div>
    </div>
  );
};

interface DashboardProps {
  attendance: AttendanceRecord[];
  reports: ReportItem[];
  profile: UserProfile;
  students: Student[];
  teacherAttendance: TeacherAttendance[];
  schedules: Schedule[];
  violationTemplates: TemplateItem[];
  achievementTemplates: TemplateItem[];
  onDeleteReport?: (id: string) => void;
  onUpdateReport?: (report: ReportItem) => void;
  onDeleteAttendance?: (id: string) => void;
  onDeleteTeacherAttendance?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  attendance, 
  reports, 
  profile, 
  students, 
  teacherAttendance, 
  schedules,
  violationTemplates,
  achievementTemplates,
  onDeleteReport,
  onUpdateReport,
  onDeleteAttendance,
  onDeleteTeacherAttendance
}) => {
  const [activeTab, setActiveTab] = useState<'santri' | 'guru' | 'pelanggaran' | 'prestasi'>('santri');
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  
  // Local state for Ranking Category
  const [activeRankCategory, setActiveRankCategory] = useState<AttendanceStatus>(AttendanceStatus.S);
  
  const [filters, setFilters] = useState({
    class: 'Semua',
    level: 'Semua',
    gender: 'Semua',
    session: 'Semua' as SessionType | 'Semua',
    period: 'Bulan Ini' as Period,
    customDate: new Date().toISOString().split('T')[0]
  });

  const isSuperAdmin = profile.email.toLowerCase() === 'idarohmahasina@gmail.com';
  const isManagement = profile.role === UserRole.IDAROH || profile.role === UserRole.PENGASUH;
  const isSantriOfficer = profile.role === UserRole.SANTRI_OFFICER;

  const isWithinPeriod = (dateStr: string) => {
    try {
      const parts = dateStr.split('/');
      const targetDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (filters.period) {
        case 'Tanggal': {
          const selected = new Date(filters.customDate);
          selected.setHours(0,0,0,0);
          return targetDate.getTime() === selected.getTime();
        }
        case 'Hari Ini': return targetDate.getTime() === now.getTime();
        case 'Minggu Ini': return diffDays >= 0 && diffDays < 7;
        case 'Bulan Ini': return targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear();
        case 'Semester': return diffDays >= 0 && diffDays < 180;
        case 'Tahun Ajaran': return true;
        default: return true;
      }
    } catch { return true; }
  };

  const filteredData = useMemo(() => {
    const allowedStudents = students.filter(s => {
      const isAllowed = isManagement || isSantriOfficer || 
        (profile.role === UserRole.MUSYRIF && profile.classes?.includes(s.formalClass));
      if (!isAllowed) return false;
      return (filters.class === 'Semua' || s.formalClass === filters.class) &&
             (filters.level === 'Semua' || s.level === filters.level) &&
             (filters.gender === 'Semua' || s.gender === filters.gender);
    });
    const ids = new Set(allowedStudents.map(s => s.id));
    return {
      students: allowedStudents,
      attendance: attendance.filter(a => ids.has(a.studentId) && isWithinPeriod(a.date) && (filters.session === 'Semua' || a.sessionType === filters.session)),
      reports: reports.filter(r => ids.has(r.studentId) && isWithinPeriod(r.date))
    };
  }, [students, attendance, reports, filters, profile, isManagement, isSantriOfficer]);

  const rankings = useMemo(() => {
    const sMap = new Map<string, { name: string, class: string, s: number, i: number, t: number, a: number }>();
    const cMap = new Map<string, { name: string, s: number, i: number, t: number, a: number }>();

    filteredData.students.forEach(s => {
      sMap.set(s.id, { name: s.name, class: s.formalClass, s: 0, i: 0, t: 0, a: 0 });
      if (!cMap.has(s.formalClass)) cMap.set(s.formalClass, { name: s.formalClass, s: 0, i: 0, t: 0, a: 0 });
    });

    filteredData.attendance.forEach(att => {
      const s = sMap.get(att.studentId);
      const c = cMap.get(att.class);
      if (s && c) {
        if (att.status === AttendanceStatus.S) { s.s++; c.s++; }
        else if (att.status === AttendanceStatus.I) { s.i++; c.i++; }
        else if (att.status === AttendanceStatus.T) { s.t++; c.t++; }
        else if (att.status === AttendanceStatus.A) { s.a++; c.a++; }
      }
    });

    const getTop = (map: Map<string, any>, key: 's'|'i'|'t'|'a') => 
      Array.from(map.values()).filter(x => x[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, 5);

    return {
      s: { s: getTop(sMap, 's'), i: getTop(sMap, 'i'), t: getTop(sMap, 't'), a: getTop(sMap, 'a') },
      c: { s: getTop(cMap, 's'), i: getTop(cMap, 'i'), t: getTop(cMap, 't'), a: getTop(cMap, 'a') }
    };
  }, [filteredData]);

  const currentRankInfo = useMemo(() => {
    const key = activeRankCategory === AttendanceStatus.S ? 's' : 
                activeRankCategory === AttendanceStatus.I ? 'i' : 
                activeRankCategory === AttendanceStatus.T ? 't' : 'a';
    const label = activeRankCategory === AttendanceStatus.S ? 'Sakit' : 
                  activeRankCategory === AttendanceStatus.I ? 'Izin' : 
                  activeRankCategory === AttendanceStatus.T ? 'Terlambat' : 'Alpha';
    const color = activeRankCategory === AttendanceStatus.S ? 'text-amber-600' : 
                  activeRankCategory === AttendanceStatus.I ? 'text-blue-600' : 
                  activeRankCategory === AttendanceStatus.T ? 'text-orange-600' : 'text-red-600';
    const unit = activeRankCategory === AttendanceStatus.T ? 'KALI' : 'HARI';
    
    return {
      students: rankings.s[key],
      classes: rankings.c[key],
      label, color, unit, key
    };
  }, [rankings, activeRankCategory]);

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-10 rounded-[4rem] border shadow-sm print:hidden">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-3xl w-full md:w-fit shadow-inner">
          {['santri', 'guru', 'pelanggaran', 'prestasi'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 md:flex-none px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === t ? 'bg-white text-emerald-800 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
              {t === 'santri' ? 'ABSENSI' : t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
             <select value={filters.period} onChange={e => setFilters({...filters, period: e.target.value as Period})} className="w-full pl-6 pr-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase outline-none appearance-none">
                {['Tanggal', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester', 'Tahun Ajaran'].map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          </div>
          <button onClick={handlePrint} className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl hover:bg-emerald-700 transition-all"><Printer size={20}/></button>
        </div>
      </div>

      {activeTab === 'santri' && (
        <div className="space-y-12">
          {/* Quick Recap Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Sakit (S)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.S).length} color="amber" icon={Activity} />
            <StatCard label="Izin (I)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.I).length} color="blue" icon={CheckCircle} />
            <StatCard label="Telat (T)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.T).length} color="orange" icon={Clock} />
            <StatCard label="Alpha (A)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.A).length} color="red" icon={UserX} />
          </div>

          {/* Unified Ranking Center */}
          {(isManagement || isSantriOfficer) && (
            <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-700">
               {/* Internal Ranking Filter Switcher */}
               <div className="absolute top-0 right-0 p-8 flex gap-2 z-10 print:hidden">
                  {[
                    { st: AttendanceStatus.S, label: 'S', color: 'bg-amber-500', bg: 'bg-amber-50' },
                    { st: AttendanceStatus.I, label: 'I', color: 'bg-blue-500', bg: 'bg-blue-50' },
                    { st: AttendanceStatus.T, label: 'T', color: 'bg-orange-500', bg: 'bg-orange-50' },
                    { st: AttendanceStatus.A, label: 'A', color: 'bg-red-500', bg: 'bg-red-50' }
                  ].map(item => (
                    <button
                      key={item.st}
                      onClick={() => setActiveRankCategory(item.st)}
                      className={`w-12 h-12 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center justify-center ${activeRankCategory === item.st ? `${item.color} text-white scale-110 shadow-lg` : `${item.bg} text-slate-400 hover:scale-105`}`}
                    >
                      {item.label}
                    </button>
                  ))}
               </div>

               <div className="flex items-center gap-6 mb-12">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-xl ${currentRankInfo.color.replace('text', 'bg')}`}>
                     <Medal size={32} />
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Peringkat Ketidakhadiran</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Filter Kategori: <span className={`${currentRankInfo.color} font-black`}>{currentRankInfo.label.toUpperCase()}</span></p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Top 5 Santri */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4">
                      <User size={14}/> Top 5 Santri Terbanyak {currentRankInfo.label}
                    </h4>
                    <div className="space-y-3">
                      {currentRankInfo.students.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-slate-50 hover:shadow-xl transition-all duration-300 group">
                           <div className="flex items-center gap-4">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{i+1}</span>
                              <div>
                                <p className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{item.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">KELAS {item.class}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="px-5 py-2 rounded-2xl bg-white shadow-sm border border-slate-50 flex flex-col items-center min-w-[70px]">
                                <span className={`text-xl font-black ${currentRankInfo.color}`}>{item[currentRankInfo.key]}</span>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{currentRankInfo.unit}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                      {currentRankInfo.students.length === 0 && <div className="py-12 text-center text-slate-300 italic text-xs">Belum ada data peringkat</div>}
                    </div>
                  </div>

                  {/* Top 5 Class */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4">
                      <School size={14}/> Top 5 Kelas Terbanyak {currentRankInfo.label}
                    </h4>
                    <div className="space-y-3">
                      {currentRankInfo.classes.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-slate-50 hover:shadow-xl transition-all duration-300 group">
                           <div className="flex items-center gap-4">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{i+1}</span>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">KELAS {item.name}</p>
                           </div>
                           <div className="text-right">
                              <div className="px-5 py-2 rounded-2xl bg-white shadow-sm border border-slate-50 flex flex-col items-center min-w-[70px]">
                                <span className={`text-xl font-black ${currentRankInfo.color}`}>{item[currentRankInfo.key]}</span>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{currentRankInfo.unit}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                      {currentRankInfo.classes.length === 0 && <div className="py-12 text-center text-slate-300 italic text-xs">Belum ada data peringkat</div>}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Raw Log Logs */}
          <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50">
             <div className="p-10 md:p-12 border-b bg-emerald-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Rekapitulasi Absensi Santri</h3>
                   <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em] mt-2 italic">Menampilkan Log Absensi Lengkap Sesuai Filter</p>
                </div>
                <button onClick={() => downloadCSV(filteredData.attendance, 'Log_Absensi_Santri')} className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl">
                  <Download size={18} /> EXPORT EXCEL
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">
                    <tr>
                      <th className="px-10 py-7 text-left">Santri</th>
                      <th className="px-10 py-7">Sesi</th>
                      <th className="px-6 py-7">Status</th>
                      <th className="px-10 py-7 text-right">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center">
                     {filteredData.attendance.map(a => (
                       <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-7 text-left">
                            <p className="font-black text-slate-800">{students.find(s => s.id === a.studentId)?.name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">KELAS {a.class}</p>
                          </td>
                          <td className="px-10 py-7 text-xs font-black text-emerald-600 uppercase tracking-widest">{a.sessionType}</td>
                          <td className="px-6 py-7">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              a.status === AttendanceStatus.H ? 'bg-emerald-100 text-emerald-700' :
                              a.status === AttendanceStatus.A ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{a.status}</span>
                          </td>
                          <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{a.date}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
