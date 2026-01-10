
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceStatus, AttendanceRecord, UserRole, Student, TeacherAttendance, Schedule, SessionType, AcademicConfig
} from '../types';
import { 
  Clock, UserCheck, CheckCircle, Save, Search, BookOpen, Edit, Users, Filter, ChevronRight, Info, Calendar, AlertTriangle, Sparkles, BrainCircuit, ListTodo, History, Plus, UserPlus, Trash2, X
} from 'lucide-react';

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

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // DYNAMIC OPTIONS
  const dynamicSessions = useMemo(() => {
    const sess = new Set<string>(['Madrasah']);
    schedules.forEach(s => { if(s.sessionType) sess.add(s.sessionType); });
    return Array.from(sess).sort();
  }, [schedules]);

  const dynamicClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.formalClass))).sort((a: any, b: any) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  }, [students]);

  // LOGIN RECOGNITION: Filter Jadwal Berdasarkan Nama Guru
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

  // CORE LOGIC: Menghubungkan Sesi Jadwal dengan Data Santri
  useEffect(() => {
    if (selectedClass && selectedSession) {
      const filtered = students.filter(s => {
        // Jika Sesi Madrasah, pakai kelas formal
        if (selectedSession.toLowerCase().includes('madrasah')) {
          return s.formalClass === selectedClass;
        }
        
        // Jika Sesi Lain (Kitab, Quran, dll), cari di pemetaan sessionClasses
        // Kita gunakan pencocokan fleksibel (case-insensitive)
        const studentMappings = s.sessionClasses || {};
        const matchKey = Object.keys(studentMappings).find(key => 
          key.toLowerCase().trim() === selectedSession.toLowerCase().trim()
        );

        if (matchKey) {
          return studentMappings[matchKey] === selectedClass;
        }
        
        // Fallback: jika tidak ada pemetaan khusus, coba cek kelas formal
        return s.formalClass === selectedClass;
      });
      setSessionStudents(filtered);
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
    alert(`Presensi mengajar Ustadz/ah ${currentUser} berhasil dicatat.`);
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
              {mode === 'Guru' ? <BookOpen size={32} /> : <Users size={32} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">{mode === 'Guru' ? `Portal Pengajar` : 'Absensi Santri'}</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3">{todayDay} • {nowTimeStr}</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
             <button onClick={() => setActiveTeacherView('presensi')} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTeacherView === 'presensi' ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                <UserCheck size={16}/> {mode === 'Guru' ? 'Kehadiran Saya' : 'Absen Kelas'}
             </button>
             <button onClick={() => setActiveTeacherView('jadwal')} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTeacherView === 'jadwal' ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                <Calendar size={16}/> Jadwal & Absen Santri
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 animate-in slide-in-from-bottom-6">
        {activeTeacherView === 'presensi' && mode === 'Guru' && (
           <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle size={24}/></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Presensi Mengajar Ustadz/ah</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfirmasi kehadiran ustadz/ah di kelas</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {mySchedulesToday.map(sch => {
                   const isCheckedIn = activeTeacherRecordsToday.some(r => r.timeScheduled === sch.time && r.subject === sch.subject);
                   return (
                     <div key={sch.id} className={`p-8 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${isCheckedIn ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-transparent shadow-inner opacity-80'}`}>
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-2">{sch.time}</p>
                           <h4 className="text-base font-black uppercase text-slate-800 leading-tight">{sch.subject}</h4>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Unit: {sch.class} • Sesi: {sch.sessionType}</p>
                        </div>
                        {isCheckedIn ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                             <CheckCircle size={16}/> Hadir
                          </div>
                        ) : (
                          <button onClick={() => handleTeacherAction(sch)} className="px-6 py-4 bg-emerald-800 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 active:scale-95 transition-all">Check-In</button>
                        )}
                     </div>
                   );
                 })}
                 {mySchedulesToday.length === 0 && (
                   <div className="col-span-full py-24 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                         <Calendar size={32} className="text-slate-200" />
                      </div>
                      <p className="text-slate-300 font-black uppercase italic tracking-widest text-[11px]">Tidak Ada Jadwal Mengajar Anda Hari Ini</p>
                   </div>
                 )}
              </div>
           </div>
        )}

        {(mode === 'Santri' || activeTeacherView === 'jadwal') && (
           <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center shadow-lg"><Users size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pilih Unit & Absen Santri</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar otomatis menyesuaikan sesi aktif</p>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mySchedulesToday.map(sch => (
                   <button key={sch.id} onClick={() => { setSelectedClass(sch.class); setSelectedSession(sch.sessionType); setSelectedSubject(sch.subject); setIsCustomMode(false); }} className={`p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group ${selectedClass === sch.class && selectedSubject === sch.subject ? 'bg-emerald-800 border-emerald-800 text-white shadow-2xl scale-105 z-10' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl'}`}>
                      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white' : 'text-emerald-900'}`}><BookOpen size={60}/></div>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-3 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-emerald-300' : 'text-emerald-700'}`}>{sch.time} • {sch.sessionType}</p>
                      <h4 className={`text-base font-black uppercase leading-tight ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white' : 'text-slate-800'}`}>{sch.subject}</h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 flex items-center gap-2 ${selectedClass === sch.class && selectedSubject === sch.subject ? 'text-white/70' : 'text-slate-400'}`}>
                         <Users size={12}/> Unit Kelas {sch.class}
                      </p>
                   </button>
                 ))}
                 
                 <button onClick={() => { setSelectedClass(''); setSelectedSession(''); setSelectedSubject('Kegiatan Umum'); setSessionStudents([]); setIsCustomMode(true); }} className={`p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${isCustomMode ? 'bg-amber-500 border-amber-500 text-white shadow-2xl scale-105' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-emerald-500 hover:bg-white'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isCustomMode ? 'bg-white/20 border-white' : 'bg-white border-slate-100'}`}><Plus size={24}/></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Absen Luar Jadwal</span>
                 </button>
              </div>
           </div>
        )}

        {isCustomMode && (
          <div className="bg-white p-10 rounded-[3.5rem] border shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95">
             <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">1. Tentukan Sesi</label>
                <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase appearance-none cursor-pointer shadow-inner border-2 border-transparent focus:border-emerald-600 transition-all">
                   <option value="">-- PILIH JENIS KEGIATAN --</option>
                   {dynamicSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">2. Tentukan Unit Kelas</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase appearance-none cursor-pointer shadow-inner border-2 border-transparent focus:border-emerald-600 transition-all">
                   <option value="">-- PILIH UNIT KELAS --</option>
                   {dynamicClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>
        )}

        {selectedClass && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
             <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden min-h-[500px]">
                <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-emerald-950 text-white rounded-2xl flex items-center justify-center shadow-lg"><Users size={22}/></div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900">Daftar Santri Sesi {selectedSession}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Unit: {selectedClass} • {sessionStudents.length} Santri Terdeteksi</p>
                      </div>
                   </div>
                   <div className="relative w-full md:w-72">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari nama santri..." className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-[10px] font-bold outline-none shadow-sm focus:border-emerald-600 transition-all" />
                   </div>
                </div>
                
                <div className="divide-y divide-slate-50">
                   {displayedStudents.map(s => (
                     <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-8 hover:bg-slate-50/50 gap-6 group transition-all">
                        <div className="flex items-center gap-5 flex-1 w-full min-w-0">
                           <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-emerald-950 group-hover:text-white transition-all shadow-inner shrink-0">{s.name[0]}</div>
                           <div className="min-w-0">
                              <h4 className="text-sm font-black text-slate-800 uppercase leading-none truncate">{s.name}</h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{s.nis} • {s.gender}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="flex bg-slate-100 p-1 rounded-[1.2rem] shadow-inner shrink-0">
                              {[AttendanceStatus.H, AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].map(st => (
                                 <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...(tempRecords[s.id] || {status: AttendanceStatus.H, note: ''}), status: st }})} className={`w-10 h-10 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${ (tempRecords[s.id]?.status || AttendanceStatus.H) === st ? (st === 'Hadir' ? 'bg-emerald-800 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') : 'text-slate-400 hover:text-slate-600'}`}>{st[0]}</button>
                              ))}
                           </div>
                           <input type="text" placeholder="Catatan..." value={tempRecords[s.id]?.note || ''} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...(tempRecords[s.id] || {status: AttendanceStatus.H, note: ''}), note: e.target.value }})} className="w-28 px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none shadow-inner focus:bg-white focus:border-emerald-600 transition-all" />
                        </div>
                     </div>
                   ))}
                   {displayedStudents.length === 0 && (
                      <div className="py-32 text-center space-y-6">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-100"><Users size={32} className="text-slate-200" /></div>
                         <p className="text-slate-300 font-black uppercase italic tracking-[0.2em] text-[10px]">Data Santri Untuk Unit Ini Tidak Ditemukan</p>
                      </div>
                   )}
                </div>
             </div>
             
             {sessionStudents.length > 0 && (
               <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center text-white gap-8 border-b-4 border-emerald-500">
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Finalisasi Absensi:</p>
                     <h5 className="text-xl font-black text-white uppercase mt-2 tracking-tight">{selectedSubject} • {selectedClass}</h5>
                     <p className="text-[9px] font-bold text-white/40 uppercase mt-1 tracking-widest italic">* Pastikan semua status santri sudah benar</p>
                  </div>
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
                     alert(`Data absensi berhasil disimpan untuk unit ${selectedClass}.`);
                     setSelectedClass('');
                     setTempRecords({});
                  }} className="w-full md:w-80 py-6 bg-white text-emerald-950 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-4 hover:bg-emerald-50 active:scale-95 transition-all">
                     <Save size={20}/> Simpan Ke Database
                  </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
