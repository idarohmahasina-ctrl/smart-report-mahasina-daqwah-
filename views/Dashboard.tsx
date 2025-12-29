
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Activity, Clock, UserX, Users, Calendar, CheckCircle, Award, ShieldAlert, 
  TrendingUp, Filter, UserCheck, Search, ChevronRight, AlertCircle, BookmarkCheck,
  Download, Trophy, School, ListOrdered, GraduationCap, User, FileText, LayoutGrid, ChevronDown, ListChecks, Printer,
  Eye, ShieldCheck, HelpCircle, ClipboardCheck, AlertTriangle, Layers, Trash2, Edit2, Check, X, BarChart3
} from 'lucide-react';
import { 
  UserRole, AttendanceRecord, ReportItem, AttendanceStatus, Student, 
  UserProfile, TeacherAttendance, Schedule, TemplateItem, SessionType, ViolationCategory
} from '../types';
import { CLASSES } from '../constants';
import { downloadCSV } from '../utils/csvExport';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4', '#84cc16'];

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
  
  const [filters, setFilters] = useState({
    class: 'Semua',
    level: 'Semua',
    gender: 'Semua',
    session: 'Semua' as SessionType | 'Semua',
    period: 'Bulan Ini' as Period,
    customDate: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
  });

  const isSuperAdmin = profile.email.toLowerCase() === 'idarohmahasina@gmail.com';
  const isManagement = profile.role === UserRole.IDAROH || profile.role === UserRole.PENGASUH;
  const isSantriOfficer = profile.role === UserRole.SANTRI_OFFICER;

  const availableTabs = useMemo(() => {
    const tabs: ('santri' | 'guru' | 'pelanggaran' | 'prestasi')[] = ['santri'];
    if (!isSantriOfficer) tabs.push('guru');
    tabs.push('pelanggaran');
    tabs.push('prestasi');
    return tabs;
  }, [isSantriOfficer]);

  const isWithinPeriod = (dateStr: string) => {
    try {
      const parts = dateStr.split('/');
      const targetDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = now.getTime() - targetDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filters.period) {
        case 'Tanggal': {
          const selectedDate = new Date(filters.customDate);
          selectedDate.setHours(0,0,0,0);
          return targetDate.getTime() === selectedDate.getTime();
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
      // Fix: Change s.class to s.formalClass since Student interface uses formalClass
      const isAllowedByRole = isManagement || isSantriOfficer || 
        (profile.role === UserRole.MUSYRIF && profile.classes?.includes(s.formalClass)) ||
        (profile.role === UserRole.GURU && schedules.some(sch => sch.teacherName.toLowerCase().includes(profile.fullName.toLowerCase()) && sch.class === s.formalClass));

      if (!isAllowedByRole) return false;

      // Fix: Change s.class to s.formalClass since Student interface uses formalClass
      const matchMacro = (filters.class === 'Semua' || s.formalClass === filters.class) &&
                         (filters.level === 'Semua' || s.level === filters.level) &&
                         (filters.gender === 'Semua' || s.gender === filters.gender);
      
      return matchMacro;
    });

    const studentIds = new Set(allowedStudents.map(s => s.id));

    return { 
      students: allowedStudents, 
      attendance: attendance.filter(a => 
        studentIds.has(a.studentId) && 
        isWithinPeriod(a.date) && 
        (filters.session === 'Semua' || a.sessionType === filters.session)
      ), 
      reports: reports.filter(r => studentIds.has(r.studentId) && isWithinPeriod(r.date)), 
      teacherAttendance: teacherAttendance.filter(a => {
        const matchPeriod = isWithinPeriod(a.date);
        const matchSession = filters.session === 'Semua' || a.sessionType === filters.session;
        const matchMacro = (filters.level === 'Semua' || a.level === filters.level) &&
                           (filters.gender === 'Semua' || a.gender === filters.gender) &&
                           (filters.class === 'Semua' || a.class === filters.class);
        if (!matchPeriod || !matchMacro || !matchSession) return false;
        return isManagement ? true : a.teacherName === profile.fullName;
      })
    };
  }, [students, attendance, reports, teacherAttendance, schedules, filters, profile, isManagement, isSantriOfficer]);

  const studentRecap = useMemo(() => {
    return filteredData.students.map(s => {
      const sAttendance = filteredData.attendance.filter(a => a.studentId === s.id);
      const counts = {
        [AttendanceStatus.H]: sAttendance.filter(a => a.status === AttendanceStatus.H).length,
        [AttendanceStatus.S]: sAttendance.filter(a => a.status === AttendanceStatus.S).length,
        [AttendanceStatus.I]: sAttendance.filter(a => a.status === AttendanceStatus.I).length,
        [AttendanceStatus.T]: sAttendance.filter(a => a.status === AttendanceStatus.T).length,
        [AttendanceStatus.A]: sAttendance.filter(a => a.status === AttendanceStatus.A).length,
      };
      const totalDays = sAttendance.length;
      const attendanceRate = totalDays > 0 ? ((counts[AttendanceStatus.H] / totalDays) * 100).toFixed(1) : '0';

      return {
        id: s.id,
        name: s.name,
        nis: s.nis,
        // Fix: Change s.class to s.formalClass since Student interface uses formalClass
        class: s.formalClass,
        ...counts,
        totalDays,
        rate: attendanceRate
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  const rankings = useMemo(() => {
    const sMap = new Map<string, { name: string, class: string, s: number, i: number, t: number, a: number, v: number, p: number }>();
    const cMap = new Map<string, { name: string, s: number, i: number, t: number, a: number, v: number, p: number }>();

    students.forEach(s => {
      // Fix: Change s.class to s.formalClass since Student interface uses formalClass
      sMap.set(s.id, { name: s.name, class: s.formalClass, s: 0, i: 0, t: 0, a: 0, v: 0, p: 0 });
      if (!cMap.has(s.formalClass)) cMap.set(s.formalClass, { name: s.formalClass, s: 0, i: 0, t: 0, a: 0, v: 0, p: 0 });
    });

    attendance.filter(a => isWithinPeriod(a.date) && (filters.session === 'Semua' || a.sessionType === filters.session)).forEach(att => {
      const s = sMap.get(att.studentId);
      const c = cMap.get(att.class);
      if (s && c) {
        if (att.status === AttendanceStatus.S) { s.s++; c.s++; }
        if (att.status === AttendanceStatus.I) { s.i++; c.i++; }
        if (att.status === AttendanceStatus.T) { s.t++; c.t++; }
        if (att.status === AttendanceStatus.A) { s.a++; c.a++; }
      }
    });

    reports.filter(r => isWithinPeriod(r.date)).forEach(rep => {
      const s = sMap.get(rep.studentId);
      const student = students.find(std => std.id === rep.studentId);
      // Fix: Change student.class to student.formalClass since Student interface uses formalClass
      const c = student ? cMap.get(student.formalClass) : null;
      if (s && c) {
        if (rep.type === 'Violation') { s.v += rep.points; c.v += rep.points; }
        if (rep.type === 'Achievement') { s.p += rep.points; c.p += rep.points; }
      }
    });

    const getTop = (map: Map<string, any>, key: 's'|'i'|'t'|'a'|'v'|'p') => 
      Array.from(map.values()).filter(x => x[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, 5);

    return {
      s: { s: getTop(sMap, 's'), c: getTop(cMap, 's') },
      i: { s: getTop(sMap, 'i'), c: getTop(cMap, 'i') },
      t: { s: getTop(sMap, 't'), c: getTop(cMap, 't') },
      a: { s: getTop(sMap, 'a'), c: getTop(cMap, 'a') },
      v: { s: getTop(sMap, 'v'), c: getTop(cMap, 'v') },
      p: { s: getTop(sMap, 'p'), c: getTop(cMap, 'p') }
    };
  }, [students, attendance, reports, filters.period, filters.session, filters.customDate]);

  const RankingSection = ({ title, sData, cData, valKey, unit, colorClass }: any) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
          <User size={14}/> Top 5 Santri ({title})
        </h4>
        <div className="space-y-3">
          {sData.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center p-5 bg-slate-50/80 rounded-2xl group hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-slate-50">
               <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{i+1}</span>
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KELAS {item.class}</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className={`text-lg font-black ${colorClass}`}>{item[valKey]}</span>
                  <span className="text-[10px] font-black text-slate-300 ml-1 uppercase">{unit}</span>
               </div>
            </div>
          ))}
          {sData.length === 0 && <div className="py-12 text-center text-slate-300 italic text-xs">Belum ada data peringkat</div>}
        </div>
      </div>
      <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
          <School size={14}/> Top 5 Kolektif Kelas ({title})
        </h4>
        <div className="space-y-3">
          {cData.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center p-5 bg-slate-50/80 rounded-2xl group hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-slate-50">
               <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>{i+1}</span>
                  <p className="text-sm font-black text-slate-800 uppercase group-hover:text-emerald-700 transition-colors">KELAS {item.name}</p>
               </div>
               <div className="text-right">
                  <span className={`text-lg font-black ${colorClass}`}>{item[valKey]}</span>
                  <span className="text-[10px] font-black text-slate-300 ml-1 uppercase">{unit}</span>
               </div>
            </div>
          ))}
          {cData.length === 0 && <div className="py-12 text-center text-slate-300 italic text-xs">Belum ada data peringkat</div>}
        </div>
      </div>
    </div>
  );

  const handleUpdateReportStatus = (report: ReportItem) => {
    if (!onUpdateReport) return;
    const newStatus = report.status === 'Pending' ? 'Processed' : 'Pending';
    onUpdateReport({ ...report, status: newStatus });
  };

  const handleUpdateReportDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !onUpdateReport) return;
    onUpdateReport(editingReport);
    setEditingReport(null);
    alert('Laporan berhasil diperbarui!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Edit Modal for Reports */}
      {editingReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setEditingReport(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
            <button onClick={() => setEditingReport(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8">Edit Detail Laporan</h3>
            <form onSubmit={handleUpdateReportDetail} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                 <select 
                  value={editingReport.category}
                  onChange={e => setEditingReport({...editingReport, category: e.target.value as ViolationCategory})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold"
                 >
                   {Object.values(ViolationCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Peraturan</label>
                 <input 
                  type="text" 
                  value={editingReport.description}
                  onChange={e => setEditingReport({...editingReport, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Poin</label>
                 <input 
                  type="number" 
                  value={editingReport.points}
                  onChange={e => setEditingReport({...editingReport, points: parseInt(e.target.value)})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold"
                 />
               </div>
               <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setEditingReport(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest">Batal</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Simpan Perubahan</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-10 rounded-[4rem] border shadow-sm print:hidden">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-3xl w-full md:w-fit shadow-inner">
          {availableTabs.map((t) => (
            <button 
              key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 md:flex-none px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === t ? 'bg-white text-emerald-800 shadow-xl shadow-emerald-950/10' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t === 'santri' ? 'ABSENSI' : t === 'guru' ? 'GURU' : t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:flex items-center gap-4 w-full md:auto">
          <div className="relative group flex-1 md:flex-none">
            <select 
              value={filters.period} 
              onChange={e => setFilters({...filters, period: e.target.value as Period})} 
              className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-all"
            >
              {['Tanggal', 'Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Semester', 'Tahun Ajaran'].map(p => <option value={p} key={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
          <button onClick={handlePrint} className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl hover:bg-emerald-700 transition-all group active:scale-95" title="Cetak PDF">
            <Printer size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* Detail Filters */}
      <div className="bg-white p-8 rounded-[3.5rem] border-2 border-slate-50 shadow-sm grid grid-cols-2 lg:grid-cols-5 gap-6 print:hidden">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jenjang</label>
          <select value={filters.level} onChange={e => setFilters({...filters, level: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all">
            <option value="Semua">SEMUA JENJANG</option>
            <option value="MTs">MTs</option>
            <option value="MA">MA</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Gender</label>
          <select value={filters.gender} onChange={e => setFilters({...filters, gender: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all">
            <option value="Semua">PUTRA & PUTRI</option>
            <option value="Putra">PUTRA</option>
            <option value="Putri">PUTRI</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kelas</label>
          <select value={filters.class} onChange={e => setFilters({...filters, class: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all">
            <option value="Semua">SEMUA KELAS</option>
            {CLASSES.map(c => <option value={c} key={c}>KELAS {c}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sesi Kelas</label>
          <select value={filters.session} onChange={e => setFilters({...filters, session: e.target.value as any})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all">
            <option value="Semua">SEMUA SESI</option>
            {Object.values(SessionType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>
        {filters.period === 'Tanggal' && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">Pilih Tanggal</label>
            <input 
              type="date" 
              value={filters.customDate} 
              onChange={e => setFilters({...filters, customDate: e.target.value})} 
              className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-xs font-black outline-none focus:bg-white focus:border-emerald-500 transition-all cursor-pointer" 
            />
          </div>
        )}
      </div>

      {activeTab === 'santri' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
            <StatCard label="Sakit (S)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.S).length} color="amber" icon={Activity} />
            <StatCard label="Izin (I)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.I).length} color="blue" icon={CheckCircle} />
            <StatCard label="Telat (T)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.T).length} color="orange" icon={Clock} />
            <StatCard label="Alpha (A)" value={filteredData.attendance.filter(a => a.status === AttendanceStatus.A).length} color="red" icon={UserX} />
          </div>

          <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50 print:border-0 print:shadow-none">
             <div className="p-10 md:p-12 border-b bg-emerald-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Rekapitulasi Absensi Santri</h3>
                   <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em] mt-2 italic">Filter Sesi: {filters.session} | Periode: {filters.period} {filters.period === 'Tanggal' ? `(${filters.customDate})` : ''}</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRawLogs(!showRawLogs)} 
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-800 text-white rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 print:hidden"
                  >
                    {showRawLogs ? <ListOrdered size={18} /> : <FileText size={18} />} {showRawLogs ? 'LIHAT REKAP' : 'LIHAT LOG DETAIL'}
                  </button>
                  <button onClick={() => downloadCSV(showRawLogs ? filteredData.attendance : studentRecap, `Laporan_Absensi_${filters.period}`)} className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl active:scale-95 print:hidden">
                    <Download size={18} /> EXPORT EXCEL
                  </button>
                </div>
             </div>
             
             {!showRawLogs ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b text-center">
                     <tr>
                       <th className="px-10 py-8 text-left">Nama Lengkap (NIS)</th>
                       <th className="px-6 py-8">Kelas</th>
                       <th className="px-6 py-8 text-emerald-600">H</th>
                       <th className="px-6 py-8 text-amber-600">S</th>
                       <th className="px-6 py-8 text-blue-600">I</th>
                       <th className="px-6 py-8 text-orange-600">T</th>
                       <th className="px-6 py-8 text-red-600">A</th>
                       <th className="px-10 py-8 text-right bg-slate-100/50">% Hadir</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {studentRecap.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors text-center group">
                          <td className="px-10 py-7 text-left">
                             <p className="font-black text-slate-800 text-base leading-tight group-hover:text-emerald-700 transition-colors">{s.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">NIS: {s.nis}</p>
                          </td>
                          <td className="px-6 py-7 font-black text-slate-500 text-xs">{s.class}</td>
                          <td className="px-6 py-7 font-black text-emerald-600">{s.Hadir}</td>
                          <td className="px-6 py-7 font-black text-amber-600">{s.Sakit}</td>
                          <td className="px-6 py-7 font-black text-blue-600">{s.Izin}</td>
                          <td className="px-6 py-7 font-black text-orange-600">{s.Terlambat}</td>
                          <td className="px-6 py-7 font-black text-red-600">{s.Alpha}</td>
                          <td className="px-10 py-7 text-right bg-slate-50/30 font-black text-emerald-700">{s.rate}%</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="overflow-x-auto animate-in fade-in duration-500">
                 <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">
                      <tr>
                        <th className="px-10 py-7 text-left">Santri</th>
                        <th className="px-10 py-7">Sesi</th>
                        <th className="px-6 py-7">Status</th>
                        <th className="px-10 py-7">Oleh</th>
                        <th className="px-10 py-7 text-right">Tanggal</th>
                        {isSuperAdmin && <th className="px-10 py-7 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-center">
                       {filteredData.attendance.map(a => {
                         const s = students.find(std => std.id === a.studentId);
                         return (
                           <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-7 text-left">
                                <p className="font-black text-slate-800">{s?.name}</p>
                                {/* Fix: Change s?.class to s?.formalClass since Student interface uses formalClass */}
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">KELAS {s?.formalClass}</p>
                              </td>
                              <td className="px-10 py-7 text-xs font-black text-emerald-600 uppercase tracking-widest">{a.sessionType}</td>
                              <td className="px-6 py-7">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  a.status === AttendanceStatus.H ? 'bg-emerald-100 text-emerald-700' :
                                  a.status === AttendanceStatus.A ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>{a.status}</span>
                              </td>
                              <td className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase">{a.recordedBy}</td>
                              <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{a.date}</td>
                              {isSuperAdmin && (
                                <td className="px-10 py-7 text-right">
                                   <button 
                                    onClick={() => onDeleteAttendance?.(a.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                   >
                                     <Trash2 size={16}/>
                                   </button>
                                </td>
                              )}
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'pelanggaran' && (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3">
             <StatCard label="Total Kasus" value={filteredData.reports.filter(r => r.type === 'Violation').length} color="red" icon={ShieldAlert} />
             <StatCard label="Ditindak" value={filteredData.reports.filter(r => r.type === 'Violation' && r.status === 'Processed').length} color="emerald" icon={ShieldCheck} subLabel="Kasus Selesai" />
             <StatCard label="Belum Ditindak" value={filteredData.reports.filter(r => r.type === 'Violation' && r.status === 'Pending').length} color="amber" icon={AlertTriangle} subLabel="Perlu Follow Up" />
          </div>

          <RankingSection title="Akumulasi Pelanggaran" sData={rankings.v.s} cData={rankings.v.c} valKey="v" unit="POIN" colorClass="text-red-600" />

          {/* Moved Trend Chart to the bottom before detail logs */}
          <div className="bg-white p-12 rounded-[4rem] border shadow-sm print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-10 flex items-center gap-4">
                <BarChart3 className="text-red-600"/> TREN KATEGORI PELANGGARAN
              </h3>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                      data={(() => {
                        const cats = new Map<string, number>();
                        filteredData.reports.filter(r => r.type === 'Violation').forEach(r => cats.set(r.category, (cats.get(r.category) || 0) + 1));
                        return Array.from(cats.entries()).map(([name, value]) => ({ name, value }));
                      })()}
                      innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none"
                      >
                        {COLORS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50 print:border-0">
             <div className="p-10 md:p-12 border-b bg-red-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Log Detail Pelanggaran</h3>
                   <p className="text-[10px] text-red-200 font-bold uppercase tracking-[0.2em] mt-2 italic">Daftar Kronologi & Status Penindakan</p>
                </div>
                <button onClick={() => downloadCSV(filteredData.reports.filter(r => r.type === 'Violation'), 'Log_Detail_Pelanggaran')} className="flex items-center gap-3 px-8 py-4 bg-white text-red-900 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-xl print:hidden">
                  <Download size={18} /> EXPORT LOG
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">
                    <tr>
                      <th className="px-10 py-7 text-left">Santri</th>
                      <th className="px-10 py-7 text-left">Jenis Pelanggaran</th>
                      <th className="px-6 py-7">Poin</th>
                      <th className="px-6 py-7">Status</th>
                      <th className="px-10 py-7 text-right">Tanggal</th>
                      {isSuperAdmin && <th className="px-10 py-7 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center">
                     {filteredData.reports.filter(r => r.type === 'Violation').map(r => (
                       <tr key={r.id} className="hover:bg-red-50/20 transition-colors">
                         <td className="px-10 py-7 text-left">
                            <p className="font-black text-slate-800">{students.find(s => s.id === r.studentId)?.name}</p>
                            {/* Fix: Change s.class to s.formalClass since Student interface uses formalClass */}
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">KELAS {students.find(s => s.id === r.studentId)?.formalClass}</p>
                         </td>
                         <td className="px-10 py-7 text-left">
                            <p className="text-xs font-black text-slate-600">{r.description}</p>
                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1">{r.category}</p>
                         </td>
                         <td className="px-6 py-7 font-black text-red-600">-{r.points}</td>
                         <td className="px-6 py-7">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'Processed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                              {r.status === 'Processed' ? 'DITINDAK' : 'BELUM DITINDAK'}
                            </span>
                         </td>
                         <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{r.date}</td>
                         {isSuperAdmin && (
                           <td className="px-10 py-7 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingReport(r)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                  title="Edit Isi Laporan"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                <button 
                                  onClick={() => handleUpdateReportStatus(r)}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  title="Ganti Status"
                                >
                                  <Check size={16}/>
                                </button>
                                <button 
                                  onClick={() => onDeleteReport?.(r.id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                  title="Hapus Permanen"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                           </td>
                         )}
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'prestasi' && (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-emerald-900 p-12 rounded-[4rem] text-white flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 bg-white/10 text-amber-400 rounded-[2rem] flex items-center justify-center">
                <Award size={32} />
              </div>
              <div>
                  <h3 className="text-5xl font-black tracking-tighter">
                    {filteredData.reports.filter(r => r.type === 'Achievement').length}
                  </h3>
                  <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mt-1">TOTAL PRESTASI SANTRI</p>
              </div>
          </div>

          <RankingSection title="Point Prestasi" sData={rankings.p.s} cData={rankings.p.c} valKey="p" unit="POIN" colorClass="text-emerald-600" />

          {/* Moved Trend Chart to the bottom before detail logs */}
          <div className="bg-white p-12 rounded-[4rem] border shadow-sm print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-10 flex items-center gap-4">
                <Trophy className="text-amber-500"/> TREN KATEGORI PRESTASI
              </h3>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                      data={(() => {
                        const cats = new Map<string, number>();
                        filteredData.reports.filter(r => r.type === 'Achievement').forEach(r => cats.set(r.category, (cats.get(r.category) || 0) + 1));
                        return Array.from(cats.entries()).map(([name, value]) => ({ name, value }));
                      })()}
                      innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none"
                      >
                        {COLORS.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50 print:border-0">
             <div className="p-10 md:p-12 border-b bg-emerald-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Log Detail Prestasi</h3>
                   <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em] mt-2 italic">Daftar Apresiasi Santri Mahasina</p>
                </div>
                <button onClick={() => downloadCSV(filteredData.reports.filter(r => r.type === 'Achievement'), 'Log_Detail_Prestasi')} className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl print:hidden">
                  <Download size={18} /> EXPORT LOG
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">
                    <tr>
                      <th className="px-10 py-7 text-left">Santri</th>
                      <th className="px-10 py-7 text-left">Bentuk Prestasi</th>
                      <th className="px-6 py-7">Poin</th>
                      <th className="px-6 py-7">Kategori</th>
                      <th className="px-10 py-7 text-right">Tanggal</th>
                      {isSuperAdmin && <th className="px-10 py-7 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center">
                     {filteredData.reports.filter(r => r.type === 'Achievement').map(r => (
                       <tr key={r.id} className="hover:bg-emerald-50/20 transition-colors">
                         <td className="px-10 py-7 text-left">
                            <p className="font-black text-slate-800">{students.find(s => s.id === r.studentId)?.name}</p>
                            {/* Fix: Change s.class to s.formalClass since Student interface uses formalClass */}
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">KELAS {students.find(s => s.id === r.studentId)?.formalClass}</p>
                         </td>
                         <td className="px-10 py-7 text-left text-xs font-black text-slate-600 truncate max-w-xs">{r.description}</td>
                         <td className="px-6 py-7 font-black text-emerald-600">+{r.points}</td>
                         <td className="px-6 py-7 text-[10px] font-black text-emerald-600 uppercase tracking-widest">{r.category}</td>
                         <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{r.date}</td>
                         {isSuperAdmin && (
                            <td className="px-10 py-7 text-right">
                               <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingReport(r)}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                  title="Edit Isi Laporan"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                <button 
                                  onClick={() => onDeleteReport?.(r.id)}
                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                >
                                  <Trash2 size={16}/>
                                </button>
                               </div>
                            </td>
                         )}
                       </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'guru' && !isSantriOfficer && (
        <div className="space-y-12 animate-in zoom-in-95 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <StatCard label="Total Jam" value={schedules.filter(s => isManagement ? true : s.teacherName.toLowerCase().includes(profile.fullName.toLowerCase())).length} color="slate" icon={Calendar} subLabel="Pertemuan Wajib" />
             <StatCard label="Hadir" value={filteredData.teacherAttendance.filter(a => a.status === 'Hadir').length} color="emerald" icon={UserCheck} subLabel="Validasi KBM" />
             <StatCard label="Ketidakhadiran" value={filteredData.teacherAttendance.filter(a => a.status !== 'Hadir').length} color="red" icon={UserX} subLabel="Alpha/Izin/Sakit" />
          </div>

          <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden border-2 border-slate-50 print:border-0">
             <div className="p-10 md:p-12 border-b bg-slate-800 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Log Detail Kehadiran Guru</h3>
                   <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-2 italic">Validasi Sesi KBM Mahasina</p>
                </div>
                <button onClick={() => downloadCSV(filteredData.teacherAttendance, 'Log_Absensi_Guru')} className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl print:hidden">
                  <Download size={18} /> EXPORT LOG
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b text-center">
                    <tr>
                      <th className="px-10 py-7 text-left">Nama Guru</th>
                      <th className="px-10 py-7">Mapel & Sesi</th>
                      <th className="px-6 py-7">Waktu</th>
                      <th className="px-6 py-7">Status</th>
                      <th className="px-10 py-7 text-right">Tanggal</th>
                      {isSuperAdmin && <th className="px-10 py-7 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-center">
                     {filteredData.teacherAttendance.map(a => (
                       <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-10 py-7 text-left">
                            <p className="font-black text-slate-800">{a.teacherName}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">KELAS {a.class}</p>
                         </td>
                         <td className="px-10 py-7">
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-tight">{a.subject}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{a.sessionType}</p>
                         </td>
                         <td className="px-6 py-7">
                            <div className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                               {a.checkInTime} - {a.checkOutTime || 'Sesi Aktif'}
                            </div>
                         </td>
                         <td className="px-6 py-7">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${a.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {a.status}
                            </span>
                         </td>
                         <td className="px-10 py-7 text-right text-[10px] font-black text-slate-400 uppercase">{a.date}</td>
                         {isSuperAdmin && (
                            <td className="px-10 py-7 text-right">
                               <button 
                                // Fix: Access id from the map iterator 'a'
                                onClick={() => onDeleteTeacherAttendance?.(a.id)}
                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                               >
                                 <Trash2 size={16}/>
                               </button>
                            </td>
                         )}
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
