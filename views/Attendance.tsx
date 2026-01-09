
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
  const [selectedSession, setSelectedSession] = useState<SessionType>(SessionType.MADRASAH);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customSessionText, setCustomSessionText] = useState('');
  
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sessionStudents, setSessionStudents] = useState<Student[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const [aiMessage, setAiMessage] = useState<string>("Menganalisis jadwal pribadi Anda...");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const isPastSchedule = (timeRange: string) => {
    try {
      const parts = timeRange.split(' - ');
      if (parts.length < 2) return false;
      const [endH, endM] = parts[1].split(':').map(Number);
      const scheduledEnd = new Date();
      scheduledEnd.setHours(endH, endM, 0, 0);
      return now > scheduledEnd;
    } catch (e) { return false; }
  };

  const isBeforeSchedule = (timeRange: string) => {
    try {
      const parts = timeRange.split(' - ');
      if (parts.length < 2) return false;
      const [startH, startM] = parts[0].split(':').map(Number);
      const scheduledStart = new Date();
      scheduledStart.setHours(startH, startM, 0, 0);
      return now < scheduledStart;
    } catch (e) { return false; }
  };

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

  // SINKRONISASI DAFTAR SANTRI BERDASARKAN PEMETAAN SESI & KELAS
  useEffect(() => {
    if (selectedClass) {
      // Mencari santri yang memiliki kelas ini PADA sesi kegiatan ini
      const initialList = students.filter(s => {
        const studentClassInSession = selectedSession === SessionType.MADRASAH ? s.formalClass : s.sessionClasses[selectedSession];
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

  const globalSearchResults = useMemo(() => {
    if (globalSearchTerm.length < 2) return [];
    return students.filter(s => 
      !sessionStudents.find(ss => ss.id === s.id) && 
      (s.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || s.nis.includes(globalSearchTerm))
    ).slice(0, 5);
  }, [students, globalSearchTerm, sessionStudents]);

  const addStudentToSession = (student: Student) => {
    setSessionStudents([...sessionStudents, student]);
    setGlobalSearchTerm('');
    setShowGlobalSearch(false);
  };

  const removeStudentFromSession = (id: string) => {
    setSessionStudents(sessionStudents.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (mode === 'Guru' && currentUser) {
      generateAiInsights();
    }
  }, [mode, mySchedulesToday, activeTeacherRecordsToday, currentUser]);

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const pendingSchedules = mySchedulesToday.filter(s => 
        !activeTeacherRecordsToday.find(r => r.timeScheduled === s.time && r.subject === s.subject)
      );
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Berikan sapaan singkat dan rekap jadwal guru ${currentUser} hari ini. Sesi: ${JSON.stringify(pendingSchedules)}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiMessage(response.text || `Semangat mengajar ${currentUser}!`);
    } catch (e) {
      setAiMessage(`Semangat mengajar hari ini, ${currentUser}!`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTeacherAction = (sch: Schedule) => {
    if (isPastSchedule(sch.time)) { alert("Sesi sudah berakhir."); return; }
    if (isBeforeSchedule(sch.time)) { alert("Belum waktunya mengajar."); return; }

    onTeacherCheckIn({
      id: Math.random().toString(36).substr(2, 9),
      date: now.toLocaleDateString('id-ID'),
      teacherName: currentUser,
      subject: sch.subject,
      class: sch.class,
      level: sch.level,
      gender: sch.gender,
      checkInTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Hadir',
      sessionType: sch.sessionType,
      timeScheduled: sch.time
    });
    alert(`Kehadiran tercatat.`);
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto animate-in fade-in duration-700">
      
      <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
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

      {mode === 'Guru' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl flex flex-col md:flex-row items-center gap-8 group">
             <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
                <BrainCircuit size={32} className={isAiLoading ? 'animate-spin' : ''}/>
             </div>
             <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{aiMessage}"</p>
             </div>
          </div>

          {activeTeacherView === 'presensi' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mySchedulesToday.map(sch => {
                   const hasRecord = activeTeacherRecordsToday.find(a => a.timeScheduled === sch.time && a.subject === sch.subject);
                   return (
                     <div key={sch.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm flex flex-col gap-8">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 font-black border border-emerald-100 shadow-inner">{sch.class}</div>
                              <div>
                                 <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{sch.sessionType}</span>
                                 <h4 className="text-base font-black text-slate-800 uppercase mt-2 leading-none">{sch.subject}</h4>
                              </div>
                           </div>
                        </div>
                        {!hasRecord ? (
                          <button onClick={() => handleTeacherAction(sch)} className="w-full py-5 bg-emerald-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-4">
                             Presensi Kehadiran Guru
                          </button>
                        ) : (
                          <div className="w-full py-5 bg-emerald-50 text-emerald-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 border border-emerald-100">
                             <CheckCircle size={20}/> Terabsen ({hasRecord.checkInTime})
                          </div>
                        )}
                     </div>
                   );
                })}
             </div>
          ) : (
             <div className="bg-white p-10 rounded-[4rem] border shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.filter(s => s.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim()).map(s => (
                   <div key={s.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{s.day} • {s.sessionType}</p>
                      <h4 className="text-base font-black text-slate-800 uppercase leading-none">{s.subject}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas {s.class} ({s.time})</p>
                   </div>
                ))}
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center"><Calendar size={24}/></div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pilih Jadwal Absen</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mySchedulesToday.map(sch => (
                   <button 
                     key={sch.id} 
                     onClick={() => {
                        setSelectedClass(sch.class);
                        setSelectedSession(sch.sessionType);
                        setSelectedSubject(sch.subject);
                        setIsCustomMode(false);
                     }}
                     className={`p-8 rounded-[2.5rem] border-2 transition-all text-left ${selectedClass === sch.class && selectedSubject === sch.subject ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xl scale-105' : 'bg-slate-50 border-transparent hover:border-emerald-200'}`}
                   >
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-emerald-300' : 'text-emerald-700'}`}>{sch.time}</p>
                      <h4 className={`text-base font-black uppercase leading-tight ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white' : 'text-slate-800'}`}>{sch.subject}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white/70' : 'text-slate-400'}`}>Unit: {sch.class} ({sch.sessionType})</p>
                   </button>
                 ))}
                 <button onClick={() => { setSelectedClass(''); setSessionStudents([]); setIsCustomMode(true); }} className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${isCustomMode ? 'bg-amber-500 border-amber-500 text-white shadow-2xl' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-500'}`}>
                    <Plus size={24}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Mode Bebas</span>
                 </button>
              </div>
           </div>

           {selectedClass || isCustomMode ? (
             <div className="space-y-8">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl flex flex-col md:flex-row gap-8 items-center">
                   <div className="flex-1 w-full relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
                      <input type="text" placeholder="Cari santri..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" />
                   </div>
                   <button onClick={() => setShowGlobalSearch(true)} className="px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 hover:bg-indigo-700">
                      <UserPlus size={18}/> Tambah Manual
                   </button>
                </div>

                <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden min-h-[500px]">
                   <div className="divide-y divide-slate-100">
                      {displayedStudents.map(s => {
                         const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                         return (
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
                                        <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: st }})} className={`w-10 h-10 rounded-xl text-[11px] font-black flex items-center justify-center transition-all ${curr.status === st ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400'}`}>{st[0]}</button>
                                     ))}
                                  </div>
                                  <input type="text" placeholder="Ket..." value={curr.note} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})} className="w-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold outline-none" />
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>

                <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 text-white">
                   <div>
                      <h4 className="text-xl font-black uppercase">{selectedSubject || 'Absensi Santri'}</h4>
                      <p className="text-[10px] font-black text-emerald-400 uppercase mt-2 tracking-widest">Sesi: {selectedSession} • {displayedStudents.length} Santri</p>
                   </div>
                   <button onClick={() => {
                      const records = sessionStudents.map(s => ({
                         id: Math.random().toString(36).substr(2, 9),
                         date: now.toLocaleDateString('id-ID'),
                         recordedTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                         studentId: s.id,
                         status: tempRecords[s.id]?.status || AttendanceStatus.H,
                         note: tempRecords[s.id]?.note || '',
                         recordedBy: currentUser,
                         class: selectedClass,
                         sessionType: selectedSession,
                         subject: selectedSubject || 'Kegiatan Pesantren'
                      }));
                      onSave(records);
                      alert("Absensi tersimpan.");
                      setSelectedClass('');
                   }} className="w-full md:w-80 py-5 bg-white text-emerald-950 rounded-2xl font-black uppercase text-[11px] shadow-xl flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all">
                      <Save size={20}/> Simpan Absensi
                   </button>
                </div>
             </div>
           ) : (
             <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                <Users size={64} className="mx-auto text-slate-100 mb-6"/>
                <h4 className="text-[14px] font-black text-slate-300 uppercase tracking-widest">Pilih Jadwal Kegiatan Untuk Mengabsen</h4>
             </div>
           )}
        </div>
      )}

      {showGlobalSearch && (
         <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[7000] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase">Tambah Santri Manual</h3>
                  <button onClick={() => setShowGlobalSearch(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={28}/></button>
               </div>
               <input type="text" autoFocus value={globalSearchTerm} onChange={e => setGlobalSearchTerm(e.target.value)} placeholder="Cari Nama / NISN..." className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner mb-6" />
               <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {globalSearchResults.map(s => (
                    <button key={s.id} onClick={() => addStudentToSession(s)} className="w-full p-4 hover:bg-emerald-50 rounded-xl text-left border border-slate-50 flex items-center justify-between group">
                       <div>
                          <p className="text-xs font-black text-slate-700 uppercase">{s.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{s.formalClass} • {s.nis}</p>
                       </div>
                       <Plus size={16} className="text-emerald-600"/>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default Attendance;
