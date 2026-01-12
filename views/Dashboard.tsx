
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, Clock, CheckCircle, ShieldAlert, Trophy, 
  Award, AlertTriangle, PieChart as PieIcon, Zap, Sparkles,
  Calendar, ChevronRight, TrendingUp, Quote
} from 'lucide-react';
import { 
  UserRole, AttendanceStatus, UserProfile
} from '../types.ts';
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
        const prompt = `Berikan satu kalimat motivasi Islami yang sangat singkat untuk ustadz/ah di Pesantren Mahasina hari ini (${todayDateStr}).`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text?.trim() || "Keikhlasan adalah kunci keberkahan mendidik.");
      } catch (e) {
        setAiAnalysis("Barangsiapa memudahkan urusan orang lain, Allah akan memudahkan urusannya.");
      }
    };
    runMahaAI();
  }, [todayDateStr]);

  const teacherScheduleToday = useMemo(() => {
    if (profile?.role === UserRole.SANTRI_OFFICER) return [];
    return (schedules || []).filter((s: any) => 
      s.day === todayDay && 
      (s.teacherName?.toLowerCase().includes(profile?.fullName?.toLowerCase()) || profile?.role === UserRole.IDAROH)
    ).sort((a: any, b: any) => a.time.localeCompare(b.time));
  }, [schedules, todayDay, profile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Premium Hero Banner */}
      <div className="relative bg-[#064e3b] p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-2xl overflow-hidden text-white border-b-8 border-emerald-500/30">
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
                <p className="text-xl md:text-2xl font-medium italic text-emerald-50 leading-relaxed">
                  "{aiAnalysis}"
                </p>
              </div>

              <div className="flex items-center gap-6 pt-2">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Presensi Santri Hari Ini</span>
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${(stats.H/stats.Total)*100}%` }} />
                       </div>
                       <span className="text-[10px] font-black">{Math.round((stats.H/stats.Total)*100)}%</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="hidden md:flex bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl shrink-0">
              <div className="text-center space-y-2">
                 <Calendar className="mx-auto text-emerald-400 mb-2" size={32} />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{todayDay}</p>
                 <h4 className="text-2xl font-black uppercase">{todayDateStr.split('/')[0]}</h4>
                 <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { label: 'Hadir', val: stats.H, icon: <CheckCircle/>, color: 'emerald' },
               { label: 'Alpa', val: stats.A, icon: <AlertTriangle/>, color: 'red' },
               { label: 'Poin Masuk', val: reports.filter((r:any)=>r.date === todayDateStr).length, icon: <Trophy/>, color: 'indigo' },
               { label: 'Total Laporan', val: reports.length, icon: <Activity/>, color: 'amber' },
            ].map((s, i) => (
               <div key={i} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-all`}>
                    {React.cloneElement(s.icon as any, { size: 24 })}
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-slate-800">{s.val}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
               </div>
            ))}
         </div>

         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Zap size={18} className="text-emerald-600"/> {profile?.role === UserRole.SANTRI_OFFICER ? 'Target Hari Ini' : 'Jadwal Anda'}
               </h3>
               <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase">Live</span>
            </div>
            
            <div className="space-y-4 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
               {teacherScheduleToday.length > 0 ? teacherScheduleToday.map((sch: any) => (
                 <div key={sch.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                    <div className="min-w-0">
                       <p className="text-xs font-black text-slate-800 uppercase truncate">{sch.subject}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">UNIT {sch.class} • {sch.time}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                 </div>
               )) : (
                 <div className="text-center py-8 opacity-30 space-y-4">
                    <Sparkles size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Bismillah, mari mulai hari ini!</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><PieIcon size={20} className="text-emerald-600"/> Komposisi Absensi</h3>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={[
                           { name: 'Hadir', val: stats.H }, 
                           { name: 'Alpha', val: stats.A }, 
                           { name: 'Telat', val: stats.T }
                        ].filter(d => d.val > 0)} 
                        cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={10} dataKey="val"
                        stroke="none"
                     >
                        {[0,4,3].map((idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                     </Pie>
                     <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase'}} 
                     />
                     <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><ShieldAlert size={20} className="text-red-600"/> Laporan Kedisiplinan Terbaru</h3>
            <div className="space-y-4">
               {reports.slice(0, 4).map((r: any) => (
                  <div key={r.id} className="p-5 bg-slate-50 rounded-3xl flex items-center justify-between border border-transparent transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${r.type === 'Violation' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} rounded-xl flex items-center justify-center font-black text-xs`}>
                           {r.category?.[0] || 'L'}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-black text-slate-800 uppercase truncate">
                             {students.find((s:any)=>s.id===r.studentId)?.name || 'Santri'}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate">{r.description}</p>
                        </div>
                     </div>
                     <span className={`px-3 py-1 ${r.type === 'Violation' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'} text-[8px] font-black rounded-lg uppercase shrink-0`}>{r.points} Poin</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
