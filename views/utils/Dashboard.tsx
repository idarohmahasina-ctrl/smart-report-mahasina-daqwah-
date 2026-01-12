
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle, ShieldAlert, Trophy, 
  Award, AlertTriangle, PieChart as PieIcon, Zap, Sparkles,
  Calendar, ChevronRight, TrendingUp
} from 'lucide-react';
import { 
  UserRole, AttendanceRecord, AttendanceStatus, Student, 
  UserProfile, TeacherAttendance, Schedule, AcademicConfig,
  ReportItem
} from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444', '#64748b'];

const RankingCard = ({ title, data, type, color = "emerald" }: { title: string, data: any[], type: string, color?: string }) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}><Award size={20}/></div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h3>
       </div>
       <TrendingUp size={16} className="text-slate-300"/>
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
            <span className={`shrink-0 text-[10px] font-black ${idx === 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'} px-3 py-1 rounded-lg`}>{item.count} {type}</span>
         </div>
       ))}
       {data.length === 0 && (
         <div className="flex flex-col items-center py-10 opacity-30">
            <Activity size={32} />
            <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Data Belum Tersedia</p>
         </div>
       )}
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
}

const Dashboard: React.FC<DashboardProps> = ({ 
  attendance, reports, profile, students, teacherAttendance, schedules, academicConfig
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("Menganalisis data hari ini...");
  
  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const todayDateStr = new Date().toLocaleDateString('id-ID');

  const teacherScheduleToday = useMemo(() => {
    return schedules.filter(s => 
      s.day === todayDay && 
      (s.teacherName.toLowerCase().includes(profile.fullName.toLowerCase()) || profile.role === UserRole.IDAROH)
    ).sort((a,b) => a.time.localeCompare(b.time));
  }, [schedules, todayDay, profile]);

  const violationRanking = useMemo(() => {
    const map = new Map<string, number>();
    reports.filter(r => r.type === 'Violation').forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (student) {
        map.set(student.name, (map.get(student.name) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [reports, students]);

  useEffect(() => {
    const runAiAnalysis = async () => {
      if (!process.env.API_KEY) {
        setAiAnalysis("Semangat berkhidmah di Mahasina hari ini, ustadz/ah!");
        return;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const reportedToday = attendance.filter(a => a.date === todayDateStr);
        
        const prompt = `Analisis singkat Pesantren Mahasina (${todayDateStr}):
        - Santri Hadir: ${reportedToday.filter(a => a.status === AttendanceStatus.H).length}
        - Kasus Pelanggaran Baru: ${reports.filter(r => r.date === todayDateStr && r.type === 'Violation').length}
        - Nama Ustadz: ${profile.fullName}.
        Berikan 1 kalimat motivasi Islami singkat dan 1 pengingat tugas. Maks 2 kalimat.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text || "Semoga harimu diberkahi Allah. Semua sistem berjalan normal.");
      } catch (e) {
        setAiAnalysis("Berikan yang terbaik untuk santri hari ini. Allah bersamamu.");
      }
    };

    runAiAnalysis();
  }, [attendance, reports, profile, todayDateStr]);

  const stats = useMemo(() => {
    const att = attendance.filter(a => a.date === todayDateStr);
    return {
      H: att.filter(a => a.status === AttendanceStatus.H).length,
      A: att.filter(a => a.status === AttendanceStatus.A).length,
      T: att.filter(a => a.status === AttendanceStatus.T).length
    };
  }, [attendance, todayDateStr]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Welcome Banner */}
      <div className="relative bg-[#064e3b] p-8 md:p-12 rounded-[3.5rem] shadow-2xl overflow-hidden text-white group">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Sparkles size={140} />
        </div>
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase tracking-tight">Assalamu'alaikum, Ustadz/ah</h2>
              <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">MahaAI Live</span>
           </div>
           <p className="text-emerald-200 font-medium text-lg italic max-w-2xl leading-relaxed border-l-4 border-emerald-500 pl-6 py-1">
              "{aiAnalysis}"
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Stats Card Grid */}
         <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
               { label: 'Hadir', val: stats.H, icon: <CheckCircle/>, color: 'emerald' },
               { label: 'Alpha', val: stats.A, icon: <AlertTriangle/>, color: 'red' },
               { label: 'Jadwal', val: schedules.filter(s => s.day === todayDay).length, icon: <Zap/>, color: 'indigo' },
               { label: 'Laporan', val: reports.length, icon: <Activity/>, color: 'amber' },
            ].map(s => (
               <div key={s.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    {React.cloneElement(s.icon as React.ReactElement<any>, { size: 22 })}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">{s.val}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
               </div>
            ))}
         </div>

         {/* Today's Schedule Sidebar */}
         <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Clock size={18} className="text-emerald-600"/> Jadwal Anda</h3>
               <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">{todayDay}</span>
            </div>
            <div className="space-y-4 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
               {teacherScheduleToday.length > 0 ? teacherScheduleToday.map(sch => (
                 <div key={sch.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="min-w-0">
                       <p className="text-xs font-black text-slate-800 uppercase truncate">{sch.subject}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">KELAS {sch.class} • {sch.time}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0"/>
                 </div>
               )) : (
                 <div className="text-center py-10 opacity-30">
                    <Calendar size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase mt-4">Tidak ada jadwal</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Pie Chart Analysis */}
         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><PieIcon size={20} className="text-emerald-600"/> Komposisi Absensi Hari Ini</h3>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={[
                           { name: 'Hadir', val: stats.H }, 
                           { name: 'Alpha', val: stats.A }, 
                           { name: 'Telat', val: stats.T }
                        ].filter(d => d.val > 0)} 
                        cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={8} dataKey="val"
                        stroke="none"
                     >
                        {[0,4,3].map(idx => <Cell key={idx} fill={COLORS[idx % COLORS.length]} className="focus:outline-none" />)}
                     </Pie>
                     <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'}} 
                        itemStyle={{padding: '4px 0'}}
                     />
                     <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Disciplinary Ranking */}
         <RankingCard title="Perlu Bimbingan (Pelanggaran)" data={violationRanking} type="KALI" color="red" />
      </div>
    </div>
  );
};

export default Dashboard;
