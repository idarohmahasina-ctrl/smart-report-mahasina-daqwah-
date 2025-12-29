import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceStatus, 
  AttendanceRecord, 
  UserRole, 
  Student,
  TeacherAttendance,
  Schedule,
  SessionType,
  AcademicConfig
} from '../types';
import { CLASSES } from '../constants';
import { Clock, UserCheck, CheckCircle, LogOut, LayoutGrid, Layers, Save, Calendar, ChevronDown, Coffee, Moon, Stars, Info, BookOpen, User } from 'lucide-react';

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
  mode, onSave, onTeacherCheckIn, onTeacherCheckOut, role, currentUser, students, teacherAttendance, schedules, academicConfig, classes
}) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionType>(SessionType.SEKOLAH);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});

  const now = new Date();
  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now);
  const todayDate = now.toLocaleDateString('id-ID');
  const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const classesForSession = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      const cls = s.sessionClasses[selectedSession];
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [students, selectedSession]);

  const authorizedClasses = useMemo(() => {
    if (role === UserRole.IDAROH || role === UserRole.PENGASUH || role === UserRole.SANTRI_OFFICER) {
      return classesForSession;
    }
    
    if (role === UserRole.MUSYRIF) {
      const myClasses = classes || [];
      return classesForSession.filter(c => myClasses.includes(c));
    }

    // Role Guru
    const taughtClasses = schedules
      .filter(s => s.teacherName.toLowerCase().trim().includes(currentUser.toLowerCase().trim()) && s.sessionType === selectedSession)
      .map(s => s.class);
    return classesForSession.filter(c => taughtClasses.includes(c));
  }, [role, schedules, currentUser, selectedSession, classesForSession, classes]);

  useEffect(() => {
    if (authorizedClasses.length > 0 && !authorizedClasses.includes(selectedClass)) {
      setSelectedClass(authorizedClasses[0]);
    } else if (authorizedClasses.length === 0) {
      setSelectedClass('');
    }
  }, [authorizedClasses, selectedSession]);

  const filteredStudents = useMemo(() => 
    students.filter(s => s.sessionClasses[selectedSession] === selectedClass)
  , [students, selectedClass, selectedSession]);

  const activeTeacherSessions = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    return teacherAttendance.filter(a => a.teacherName === currentUser && a.date === today && !a.checkOutTime);
  }, [teacherAttendance, currentUser]);

  const currentClassSession = useMemo(() => 
    activeTeacherSessions.find(s => s.class === selectedClass && s.sessionType === selectedSession)
  , [activeTeacherSessions, selectedClass, selectedSession]);

  const currentSchedule = useMemo(() => {
    if (!selectedClass) return null;
    return schedules.find(s => 
      s.class === selectedClass && 
      s.sessionType === selectedSession && 
      s.day.toLowerCase() === todayDay.toLowerCase()
    );
  }, [schedules, selectedClass, selectedSession, todayDay]);

  const handleTeacherCheckIn = () => {
    if (!selectedClass) return;
    const nowCheckIn = new Date();
    const representative = filteredStudents[0];
    
    onTeacherCheckIn({
      id: Math.random().toString(36).substr(2, 9),
      date: nowCheckIn.toLocaleDateString('id-ID'),
      teacherName: currentUser,
      subject: currentSchedule?.subject || 'Bimbingan Kitab/Halaqah', 
      class: selectedClass,
      level: representative?.level || 'MA',
      gender: representative?.gender || 'Putra',
      checkInTime: nowCheckIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Hadir',
      sessionType: selectedSession
    });
  };

  const submitSantriAttendance = () => {
    const finalRecords: AttendanceRecord[] = filteredStudents.map(student => ({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('id-ID'),
      studentId: student.id,
      status: tempRecords[student.id]?.status || AttendanceStatus.H,
      note: tempRecords[student.id]?.note || '',
      recordedBy: currentUser,
      class: selectedClass,
      sessionType: selectedSession
    }));
    onSave(finalRecords);
    alert("Absensi Berhasil Disimpan!");
    setTempRecords({});
  };

  if (academicConfig.isHoliday) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-700">
        <div className="w-64 h-64 bg-amber-50 rounded-[4rem] flex items-center justify-center relative shadow-inner mb-12">
           <div className="absolute top-8 right-8 text-amber-200 animate-pulse"><Stars size={48}/></div>
           <Coffee size={100} className="text-amber-600 drop-shadow-lg" />
           <div className="absolute bottom-10 left-10 text-amber-300 rotate-12"><Moon size={32}/></div>
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">Pondok Sedang <span className="text-amber-600">Libur</span></h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Keperluan Istirahat & Hari Besar</p>
          <div className="pt-8 space-y-2">
             <p className="text-sm font-medium text-slate-600 leading-relaxed px-10">
               Seluruh aktivitas presensi untuk pengajar dan santri dinonaktifkan sementara oleh Idaroh Pusat. 
             </p>
             <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 inline-block px-4 py-2 rounded-xl border border-amber-100 mt-4">Selamat Beristirahat, Ustadz/ah!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-emerald-900 text-white p-14 rounded-[4rem] shadow-2xl relative overflow-hidden border-4 border-emerald-800">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-800/80 rounded-full border border-emerald-700 text-[10px] font-black uppercase tracking-widest"><Calendar size={12}/> {todayDay}, {todayDate}</div>
           <h1 className="text-5xl font-black uppercase tracking-tighter">Panel <span className="text-emerald-400">Presensi</span></h1>
           <p className="text-emerald-200 text-xs font-medium max-w-md italic">Silakan pilih sesi dan kelas untuk verifikasi jadwal KBM.</p>
        </div>
      </div>

      <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-xl space-y-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 pb-10 border-b border-slate-50">
           <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-inner ${mode === 'Guru' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                 {mode === 'Guru' ? <Clock size={32}/> : <UserCheck size={32}/>}
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{mode === 'Guru' ? 'Check-In Pengajar' : 'Absensi Santri'}</h2>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="relative">
                 <select value={selectedSession} onChange={e => { setSelectedSession(e.target.value as any); setSelectedClass(''); }} className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-emerald-600 transition-all">
                    {Object.values(SessionType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              </div>
              <div className="relative">
                 <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={authorizedClasses.length === 0} className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-emerald-600 disabled:opacity-30 transition-all">
                    <option value="">-- PILIH KELAS --</option>
                    {authorizedClasses.map(c => (
                      <option key={c} value={c}>KELAS: {c}</option>
                    ))}
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              </div>
           </div>
        </div>

        {selectedClass && (
          <div className="animate-in slide-in-from-top-4 duration-500">
             <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm"><Info size={16}/></div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Jadwal Terdeteksi</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><BookOpen size={18}/></div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</p>
                            <p className="text-xs font-black text-emerald-800 uppercase">{currentSchedule?.subject || 'Bimbingan Kitab/Halaqah'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><User size={18}/></div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pengajar Sesuai Jadwal</p>
                            <p className="text-xs font-black text-emerald-800 uppercase">{currentSchedule?.teacherName || currentUser}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Clock size={18}/></div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu KBM</p>
                            <p className="text-xs font-black text-emerald-800 uppercase">{currentSchedule?.time || 'Sesuai Sesi'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Layers size={18}/></div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kelas & Sesi</p>
                            <p className="text-xs font-black text-emerald-800 uppercase">{selectedClass} | {selectedSession}</p>
                         </div>
                      </div>
                   </div>
                </div>
                {currentClassSession && (
                  <div className="w-full md:w-fit bg-emerald-600 text-white p-6 rounded-[2rem] shadow-xl text-center space-y-2">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Check-In Pukul</p>
                     <p className="text-3xl font-black tracking-tighter">{currentClassSession.checkInTime}</p>
                     <p className="text-[8px] font-bold uppercase tracking-widest">Sesi Sedang Berjalan</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {selectedClass ? (
          mode === 'Guru' ? (
            <div className="py-20 flex flex-col items-center">
               <div className="max-w-md w-full text-center space-y-10">
                  <div className={`w-44 h-44 mx-auto rounded-[4rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${currentClassSession ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-50 text-slate-200 border-2 border-dashed'}`}>
                     {currentClassSession ? <CheckCircle size={100}/> : <Clock size={100}/>}
                  </div>
                  <div>
                     <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{selectedSession}</h3>
                     <p className="text-sm font-black text-emerald-600 mt-2 uppercase">UNIT KELAS {selectedClass}</p>
                  </div>
                  {currentClassSession ? (
                    <button onClick={() => onTeacherCheckOut(currentClassSession.id)} className="w-full bg-red-600 text-white font-black py-8 rounded-[3rem] shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"><LogOut size={28}/> SELESAI MENGAJAR ({currentTime})</button>
                  ) : (
                    <button onClick={handleTeacherCheckIn} className="w-full bg-emerald-600 text-white font-black py-8 rounded-[3rem] shadow-[0_20px_50px_rgba(5,150,105,0.3)] hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"><UserCheck size={28}/> KONFIRMASI HADIR ({currentTime})</button>
                  )}
               </div>
            </div>
          ) : (
            <div className="space-y-10">
               <div className="bg-white rounded-[3.5rem] border-2 border-slate-50 shadow-2xl overflow-hidden">
                  <table className="w-full text-sm">
                     <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                           <th className="px-10 py-8 text-left">Identitas Santri</th>
                           <th className="px-10 py-8">Kehadiran ({selectedSession})</th>
                           <th className="px-10 py-8 text-left">Catatan Khusus</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(s => {
                          const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-10 py-8">
                                  <p className="font-black text-slate-800 text-base">{s.name}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Formal: {s.formalClass} • NIS: {s.nis}</p>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="flex justify-center gap-2">
                                     {Object.values(AttendanceStatus).map(st => (
                                       <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: st }})} className={`w-10 h-10 rounded-xl font-black text-[10px] border-2 transition-all ${curr.status === st ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>{st[0]}</button>
                                     ))}
                                  </div>
                               </td>
                               <td className="px-10 py-8"><input type="text" value={curr.note} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})} placeholder="Catatan..." className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-xs font-bold outline-none"/></td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
               <button onClick={submitSantriAttendance} className="w-full bg-emerald-700 text-white font-black py-7 rounded-[3rem] shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.2em]"><Save size={24}/> SIMPAN SELURUH DATA ABSENSI</button>
            </div>
          )
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 opacity-30">
             <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-[2.5rem] flex items-center justify-center"><LayoutGrid size={48}/></div>
             <div>
                <h3 className="text-xl font-black text-slate-800 uppercase">Menunggu Pemilihan Kelas</h3>
                <p className="text-xs font-bold text-slate-400 max-w-xs mt-2">Silakan pilih jenis sesi dan kelas di bagian atas untuk memulai presensi.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;