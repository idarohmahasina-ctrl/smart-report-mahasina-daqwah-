
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle, ShieldAlert, Trophy, 
  Award, AlertTriangle, PieChart as PieIcon, Zap, Sparkles,
  Calendar, ChevronRight, TrendingUp, Quote
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

const Dashboard: React.FC<any> = ({ 
  attendance = [], reports = [], profile, students = [], schedules = [], academicConfig
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("Bismillah, sedang menyiapkan laporan...");
  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const todayDateStr = new Date().toLocaleDateString('id-ID');

  const stats = useMemo(() => {
    const todayAtt = attendance.filter((a: any) => a.date === todayDateStr);
    return {
      H: todayAtt.filter((a: any) => a.status === AttendanceStatus.H).length,
      A: todayAtt.filter((a: any) => a.status === AttendanceStatus.A).length,
      T: todayAtt.filter((a: any) => a.status === AttendanceStatus.T).length,
      Total: students.length || 1
    };
  }, [attendance, todayDateStr, students]);

  useEffect(() => {
    const runMahaAI = async () => {
      if (!process.env.API_KEY) {
        setAiAnalysis("Semangat berkhidmah untuk agama dan bangsa hari ini!");
        return;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Laporan Pesantren Mahasina (${todayDateStr}):
        - Santri Hadir: ${stats.H}
        - Alpa: ${stats.A}
        - Total: ${stats.Total}
        - Ustadz: ${profile?.fullName}.
        Berikan 1 kalimat nasihat bijak Islami singkat (maks 12 kata) tentang keberkahan mendidik santri.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text?.trim() || "Keikhlasan adalah kunci keberkahan dalam mendidik santri.");
      } catch (e) {
        setAiAnalysis("Barangsiapa memudahkan urusan orang lain, Allah akan memudahkan urusannya.");
      }
    };
    runMahaAI();
  }, [stats, profile, todayDateStr]);

  const teacherScheduleToday = useMemo(() => {
    return schedules.filter((s: any) => 
      s.day === todayDay && 
      (s.teacherName?.toLowerCase().includes(profile?.fullName?.toLowerCase()) || profile?.role === UserRole.IDAROH)
    ).sort((a: any, b: any) => a.time.localeCompare(b.time));
  }, [schedules, todayDay, profile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Premium Hero Banner */}
      <div className="relative bg-[#064e3b] p-10 md:p-14 rounded-[4rem] shadow-2xl overflow-hidden text-white border-b-8 border-emerald-500/30">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
           <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-emerald-500/30">
                    <Sparkles className="text-emerald-400" size={20} />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-tighter">Assalamu'alaikum, {profile?.fullName?.split(' ')[0]}</h2>
              </div>
              
              <div className="relative pl-8 border-l-4 border-emerald-400/50">
                <Quote className="absolute top-0 left-0 -ml-4 -mt-2 text-emerald-500/20" size={40} />
                <p className="text-xl md:text-2xl font-medium italic text-emerald-50 leading-relaxed">
                  "{aiAnalysis}"
                </p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tingkat Kehadiran Santri</span>
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${(stats.H/stats.Total)*100}%` }} />
                       </div>
                       <span className="text-[10px] font-black">{Math.round((stats.H/stats.Total)*100)}%</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl shrink-0 group hover:bg-white/10 transition-all duration-500">
              <div className="text-center space-y-2">
                 <Calendar className="mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={32} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Hari Ini</p>
                 <h4 className="text-2xl font-black uppercase">{todayDay}</h4>
                 <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{todayDateStr}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Stats Grid */}
         <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: 'Hadir', val: stats.H, icon: <CheckCircle/>, color: 'emerald' },
               { label: 'Alpa', val: stats.A, icon: <AlertTriangle/>, color: 'red' },
               { label: 'Jadwal', val: teacherScheduleToday.length, icon: <Clock/>, color: 'indigo' },
               { label: 'Laporan', val: reports.length, icon: <Activity/>, color: 'amber' },
            ].map((s, i) => (
               <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`w-14 h-14 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 group-hover:scale-110 transition-all`}>
                    {React.cloneElement(s.icon as any, { size: 24 })}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-800">{s.val}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
               </div>
            ))}
         </div>

         {/* Today's Classes */}
         <div className="bg-white p-8 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Zap size={18} className="text-emerald-600"/> Jadwal KBM
               </h3>
               <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase">Aktif</span>
            </div>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
               {teacherScheduleToday.length > 0 ? teacherScheduleToday.map((sch: any) => (
                 <div key={sch.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="min-w-0">
                       <p className="text-xs font-black text-slate-800 uppercase truncate">{sch.subject}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">KELAS {sch.class} • {sch.time}</p>
                    </div>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:text-emerald-600 shadow-sm transition-all">
                       <ChevronRight size={16} />
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-12 opacity-30 space-y-4">
                    <Sparkles size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Waktunya Istirahat</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><PieIcon size={20} className="text-emerald-600"/> Kehadiran Santri</h3>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={[
                           { name: 'Hadir', val: stats.H }, 
                           { name: 'Alpha', val: stats.A }, 
                           { name: 'Telat', val: stats.T }
                        ].filter(d => d.val > 0)} 
                        cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={10} dataKey="val"
                        stroke="none"
                     >
                        {[0,4,3].map((idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                     </Pie>
                     <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'}} 
                     />
                     <Legend verticalAlign="bottom" height={40} iconType="circle" />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><ShieldAlert size={20} className="text-red-600"/> Laporan Terbaru</h3>
            <div className="space-y-4">
               {reports.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="p-5 bg-slate-50 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-lg hover:border-slate-200 border border-transparent transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xs shadow-inner">
                           {r.category?.[0] || 'V'}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800 uppercase">{students.find((s:any)=>s.id===r.studentId)?.name || 'Santri'}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{r.description?.slice(0, 30)}...</p>
                        </div>
                     </div>
                     <span className="px-3 py-1 bg-red-100 text-red-700 text-[8px] font-black rounded-lg uppercase">{r.points} Poin</span>
                  </div>
               ))}
               {reports.length === 0 && (
                  <div className="text-center py-20 opacity-20 italic font-black uppercase text-[10px] tracking-widest">Alhamdulillah, Belum Ada Pelanggaran</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
