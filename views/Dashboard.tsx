
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, UserCheck, MonitorCheck, ShieldAlert, Trophy, 
  Filter, Download, TrendingUp, Award, Clock, Users, ChevronRight,
  Activity, AlertCircle, CheckCircle, MapPin, Camera
} from 'lucide-react';
import { AppData, AttendanceStatus, ViolationCategory, UserRole, TeacherAttendance, Student } from '../types.ts';
import { downloadCSV } from './utils/csvExport.ts';
import { isTeacherMatch } from './utils/nameMatchers.ts';

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
    </div>
  </div>
);

const Dashboard: React.FC<AppData & { profile: any }> = (data) => {
  const [activeModul, setActiveModul] = useState<'santri' | 'pelanggaran' | 'prestasi'>('santri');
  const [sessionFilter, setSessionFilter] = useState('Semua');
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [attRankStatus, setAttRankStatus] = useState<AttendanceStatus>(AttendanceStatus.A);

  const students = data.students || [];
  const attendance = data.attendance || [];
  const reports = data.reports || [];
  const profile = data.profile;
  const role = profile?.role;

  // LOGIKA HAK AKSES
  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH;
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';
  
  // Ambil daftar kelas yang dikelola (untuk Guru, Musyrif, & Walas)
  const myManagedClasses = useMemo(() => {
    if (isAdminOrPengasuh || isGenderRestricted) return []; 
    return Array.from(new Set(
      data.schedules
        .filter(s => isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName))
        .map(s => s.class)
    ));
  }, [data.schedules, profile, isAdminOrPengasuh, isGenderRestricted]);

  const isClassRestricted = (role === UserRole.GURU || role === UserRole.MUSYRIF) && !isAdminOrPengasuh;

  // FILTER DATA SANTRI
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGender = !isGenderRestricted || s.gender === targetGender;
      const matchClass = !isClassRestricted || myManagedClasses.includes(s.formalClass) || Object.values(s.sessionClasses || {}).some(c => myManagedClasses.includes(c as string));
      return matchGender && matchClass;
    });
  }, [students, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const studentIds = useMemo(() => new Set(filteredStudents.map(s => s.id)), [filteredStudents]);

  // FILTER DATA ABSENSI & LAPORAN
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (!studentIds.has(a.studentId)) return false;
      const matchSess = sessionFilter === 'Semua' || a.sessionType === sessionFilter;
      const matchCls = classFilter === 'Semua' || a.class === classFilter;
      return matchSess && matchCls;
    });
  }, [attendance, studentIds, sessionFilter, classFilter]);

  const filteredReports = useMemo(() => {
    const type = activeModul === 'pelanggaran' ? 'Violation' : 'Achievement';
    return reports.filter(r => {
      if (r.type !== type) return false;
      if (!studentIds.has(r.studentId)) return false;
      const s = students.find(std => std.id === r.studentId);
      const matchCls = classFilter === 'Semua' || s?.formalClass === classFilter;
      return matchCls;
    });
  }, [reports, studentIds, activeModul, classFilter, students]);

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
    } else {
      filteredReports.forEach(r => {
        const s = students.find(std => std.id === r.studentId);
        if (s) {
          studentMap[s.name] = (studentMap[s.name] || 0) + 1;
          classMap[s.formalClass] = (classMap[s.formalClass] || 0) + 1;
        }
      });
    }

    const sortFn = (a: any, b: any) => b.count - a.count;
    return {
      students: Object.entries(studentMap).map(([name, count]) => ({ name, count })).sort(sortFn),
      classes: Object.entries(classMap).map(([name, count]) => ({ name, count })).sort(sortFn),
    };
  }, [activeModul, filteredAttendance, filteredReports, students, attRankStatus]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-2 rounded-3xl shadow-sm flex overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'santri', label: 'Absensi Santri', icon: <UserCheck size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(mod => (
          <button 
            key={mod.id} 
            onClick={() => setActiveModul(mod.id as any)} 
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeModul === mod.id ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {mod.icon} {mod.label}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-8 rounded-[3rem] border shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
          <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
             <option value="Semua">Semua Sesi</option>
             <option value="Madrasah">Madrasah</option>
             <option value="Kitab Kuning">Kitab Kuning</option>
             <option value="Al-Quran">Al-Quran</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
             <option>Semua</option>
             <option>MA</option>
             <option>MTs</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gender</label>
          <select disabled={isGenderRestricted} value={isGenderRestricted ? targetGender : genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none disabled:opacity-50">
             <option>Semua</option>
             <option>Putra</option>
             <option>Putri</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Kelas</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-none appearance-none">
             <option value="Semua">Semua Kelas</option>
             {Array.from(new Set(filteredStudents.map(s => s.formalClass))).sort().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RankingList 
            title={`Top 5 Santri ${activeModul}`} 
            data={rankings.students} 
            type="Kali" 
            color={activeModul === 'pelanggaran' ? 'red' : 'emerald'}
          />
          <RankingList 
            title="Top 5 Unit Kelas" 
            data={rankings.classes} 
            type="Laporan" 
            color="indigo" 
          />
      </div>
    </div>
  );
};

export default Dashboard;
