
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceStatus, AttendanceRecord, UserRole, Student, TeacherAttendance, Schedule, SessionType, AcademicConfig
} from '../types';
import { 
  Clock, UserCheck, CheckCircle, Save, Search, BookOpen, Edit, Users, Filter, ChevronRight, Info, Calendar, AlertTriangle, Sparkles, BrainCircuit, ListTodo, History, Plus, UserPlus, Trash2, X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AttendanceProps {
  mode: 'Guru' | 'Santri';
  onSave: (records: AttendanceRecord[]) => void;
  onTeacherCheckIn: (record: TeacherAttendance) => void;
  onTeacherCheckOut: (attendanceId: string) => void;
  role: UserRole;
  classes?: string[];
  currentUser: string;
  students: Student[];
  teacherAttendance: TeacherAttendance[];
  schedules: Schedule[];
  academicConfig: AcademicConfig;
}

const Attendance: React.FC<AttendanceProps> = ({ 
  mode, onSave, onTeacherCheckIn, onTeacherCheckOut, role, currentUser, students, teacherAttendance, schedules, academicConfig
}) => {
  const [activeTeacherView, setActiveTeacherView] = useState<'presensi' | 'jadwal'>('presensi');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionStudents, setSessionStudents] = useState<Student[]>([]);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // DYNAMIC OPTIONS
  const dynamicSessions = useMemo(() => {
    const sess = new Set<string>();
    schedules.forEach(s => sess.add(s.sessionType));
    return Array.from(sess).sort();
  }, [schedules]);

  const dynamicClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.formalClass))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  }, [students]);

  const mySchedulesToday = useMemo(() => {
    return schedules.filter(s => 
      s.day.toLowerCase() === todayDay.toLowerCase() && 
      s.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim()
    );
  }, [schedules, currentUser, todayDay]);

  const activeTeacherRecordsToday = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    return teacherAttendance.filter(a => a.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim() && a.date === today);
  }, [teacherAttendance, currentUser]);

  useEffect(() => {
    if (selectedClass) {
      const initialList = students.filter(s => {
        // Logika cerdas: jika sesi adalah Madrasah, cek formalClass. Jika lainnya, cek sessionClasses.
        const isFormal = selectedSession.toLowerCase().includes('madrasah');
        const studentClassInSession = isFormal ? s.formalClass : (s.sessionClasses as any)[selectedSession];
        return studentClassInSession === selectedClass;
      });
      setSessionStudents(initialList);
    } else {
      setSessionStudents([]);
    }
  }, [selectedClass, selectedSession, students]);

  const displayedStudents = useMemo(() => {
    return sessionStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessionStudents, searchTerm]);

  const handleTeacherAction = (sch: Schedule) => {
    onTeacherCheckIn({
      id: Math.random().toString(36).substr(2, 9),
      date: now.toLocaleDateString('id-ID'),
      teacherName: currentUser,
      subject: sch.subject,
      class: sch.class,
      level: sch.level,
      gender: sch.gender,
      checkInTime: nowTimeStr,
      status: 'Hadir',
      sessionType: sch.sessionType,
      timeScheduled: sch.time
    });
    alert(`Kehadiran tercatat.`);
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
              {mode === 'Guru' ? <BookOpen size={32} /> : <Users size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{mode === 'Guru' ? 'Portal Ustadz/ah' : 'Absensi Santri'}</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3">{todayDay} • {nowTimeStr}</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
             <button onClick={() => setActiveTeacherView('presensi')} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTeacherView === 'presensi' ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                <UserCheck size={16}/> {mode === 'Guru' ? 'Kehadiran' : 'Absen Kelas'}
             </button>
             <button onClick={() => setActiveTeacherView('jadwal')} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTeacherView === 'jadwal' ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                <Calendar size={16}/> Jadwal
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 animate-in slide-in-from-bottom-6">
        {activeTeacherView === 'presensi' && mode === 'Guru' && (
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center"><CheckCircle size={24}/></div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Presensi Mengajar Hari Ini</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {mySchedulesToday.map(sch => {
                   const isCheckedIn = activeTeacherRecordsToday.some(r => r.timeScheduled === sch.time && r.subject === sch.subject);
                   return (
                     <div key={sch.id} className={`p-8 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${isCheckedIn ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent'}`}>
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-2">{sch.time}</p>
                           <h4 className="text-base font-black uppercase text-slate-800 leading-tight">{sch.subject}</h4>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Unit: {sch.class} ({sch.sessionType})</p>
                        </div>
                        {isCheckedIn ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                             <CheckCircle size={18}/> Sudah Presensi
                          </div>
                        ) : (
                          <button onClick={() => handleTeacherAction(sch)} className="px-6 py-3 bg-emerald-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-900 active:scale-95 transition-all">Check-In</button>
                        )}
                     </div>
                   );
                 })}
                 {mySchedulesToday.length === 0 && (
                   <div className="col-span-full py-12 text-center text-slate-300 font-black uppercase italic tracking-widest">Tidak Ada Jadwal Mengajar Hari Ini</div>
                 )}
              </div>
           </div>
        )}

        {(mode === 'Santri' || activeTeacherView === 'jadwal') && (
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center"><Calendar size={24}/></div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pilih Jadwal Absen Santri</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mySchedulesToday.map(sch => (
                   <button key={sch.id} onClick={() => { setSelectedClass(sch.class); setSelectedSession(sch.sessionType); setSelectedSubject(sch.subject); setIsCustomMode(false); }} className={`p-8 rounded-[2.5rem] border-2 transition-all text-left ${selectedClass === sch.class && selectedSubject === sch.subject ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xl scale-105' : 'bg-slate-50 border-transparent hover:border-emerald-200'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-emerald-300' : 'text-emerald-700'}`}>{sch.time}</p>
                      <h4 className={`text-base font-black uppercase leading-tight ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white' : 'text-slate-800'}`}>{sch.subject}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white/70' : 'text-slate-400'}`}>Unit: {sch.class} ({sch.sessionType})</p>
                   </button>
                 ))}
                 <button onClick={() => { setSelectedClass(''); setSelectedSession(''); setSelectedSubject('Manual'); setSessionStudents([]); setIsCustomMode(true); }} className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${isCustomMode ? 'bg-amber-500 border-amber-500 text-white shadow-2xl' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-500'}`}>
                    <Plus size={24}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Mode Bebas</span>
                 </button>
              </div>
           </div>
        )}

        {isCustomMode && (
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95">
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Sesi</label>
                <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase appearance-none cursor-pointer">
                   <option value="">-- PILIH SESI --</option>
                   {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Kelas</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase appearance-none cursor-pointer">
                   <option value="">-- PILIH KELAS --</option>
                   {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>
        )}

        {selectedClass && (
          <div className="space-y-8">
             <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden min-h-[500px]">
                <div className="divide-y divide-slate-100">
                   {displayedStudents.map(s => (
                     <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-8 hover:bg-slate-50 gap-6 group">
                        <div className="flex items-center gap-5 flex-1 w-full">
                           <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-emerald-950 group-hover:text-white transition-all shadow-inner">{s.name[0]}</div>
                           <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase leading-none truncate">{s.name}</h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{s.nis} • Kelas {selectedClass}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
                              {[AttendanceStatus.H, AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].map(st => (
                                 <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...(tempRecords[s.id] || {status: AttendanceStatus.H, note: ''}), status: st }})} className={`w-10 h-10 rounded-xl text-[11px] font-black flex items-center justify-center transition-all ${ (tempRecords[s.id]?.status || AttendanceStatus.H) === st ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400'}`}>{st[0]}</button>
                              ))}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl flex justify-between items-center text-white">
                <button onClick={() => {
                   const records = sessionStudents.map(s => ({
                      id: Math.random().toString(36).substr(2, 9),
                      date: now.toLocaleDateString('id-ID'),
                      recordedTime: nowTimeStr,
                      studentId: s.id,
                      status: tempRecords[s.id]?.status || AttendanceStatus.H,
                      note: tempRecords[s.id]?.note || '',
                      recordedBy: currentUser,
                      class: selectedClass,
                      sessionType: selectedSession as any,
                      subject: selectedSubject || 'Kegiatan Pesantren'
                   }));
                   onSave(records);
                   alert("Absensi tersimpan.");
                   setSelectedClass('');
                }} className="w-full py-5 bg-white text-emerald-950 rounded-2xl font-black uppercase text-[11px] shadow-xl flex items-center justify-center gap-4">
                   <Save size={20}/> Simpan Absensi
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
