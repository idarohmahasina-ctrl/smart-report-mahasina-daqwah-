
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
// Added School to the lucide-react imports
import { Clock, UserCheck, CheckCircle, LogOut, LayoutGrid, Layers, Save, Calendar, ChevronDown, Coffee, Moon, Stars, Info, BookOpen, User, School } from 'lucide-react';

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
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-white p-8 md:p-10 rounded-[3rem] border-2 border-slate-50 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-50">
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${mode === 'Guru' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                 {mode === 'Guru' ? <Clock size={24}/> : <UserCheck size={24}/>}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{mode === 'Guru' ? 'Presensi Pengajar' : 'Absensi Santri'}</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verifikasi Kehadiran {mode.toUpperCase()}</p>
              </div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="relative">
                 <select value={selectedSession} onChange={e => { setSelectedSession(e.target.value as any); setSelectedClass(''); }} className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-emerald-600 transition-all">
                    {Object.values(SessionType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              </div>
              <div className="relative">
                 <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={authorizedClasses.length === 0} className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:border-emerald-600 disabled:opacity-30 transition-all">
                    <option value="">-- PILIH KELAS --</option>
                    {authorizedClasses.map(c => <option key={c} value={c}>KELAS: {c}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              </div>
           </div>
        </div>

        {selectedClass && (
          <div className="animate-in slide-in-from-top-2 duration-400 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800"><Calendar size={12}/> {todayDate}</div>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800"><Clock size={12}/> {currentTime}</div>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sesi Kegiatan</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase"><Layers size={12}/> {selectedSession}</div>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kelas</p>
                {/* Fixed: School icon is now imported */}
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase"><School size={12} className="w-3 h-3"/> {selectedClass}</div>
             </div>
             <div className="space-y-1 col-span-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase truncate"><BookOpen size={12}/> {currentSchedule?.subject || 'Halaqah'}</div>
             </div>
             <div className="space-y-1 col-span-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pengajar</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase truncate"><User size={12}/> {currentSchedule?.teacherName || currentUser.split(' ')[0]}</div>
             </div>
          </div>
        )}

        {selectedClass ? (
          mode === 'Guru' ? (
            <div className="py-14 flex flex-col items-center">
               <div className="max-w-md w-full text-center space-y-8">
                  <div className={`w-32 h-32 mx-auto rounded-[2.5rem] flex items-center justify-center shadow-xl transition-all duration-700 ${currentClassSession ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-50 text-slate-200 border-2 border-dashed'}`}>
                     {currentClassSession ? <CheckCircle size={60}/> : <Clock size={60}/>}
                  </div>
                  {currentClassSession ? (
                    <button onClick={() => onTeacherCheckOut(currentClassSession.id)} className="w-full bg-red-600 text-white font-black py-6 rounded-[2rem] shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[10px]"><LogOut size={20}/> SELESAI MENGAJAR ({currentTime})</button>
                  ) : (
                    <button onClick={handleTeacherCheckIn} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[2rem] shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[10px]"><UserCheck size={20}/> KONFIRMASI HADIR ({currentTime})</button>
                  )}
               </div>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="bg-white rounded-[2rem] border-2 border-slate-50 shadow-lg overflow-hidden">
                  <table className="w-full text-sm">
                     <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr>
                           <th className="px-8 py-6 text-left">Santri</th>
                           <th className="px-8 py-6 text-center">Kehadiran</th>
                           <th className="px-8 py-6 text-left">Catatan</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(s => {
                          const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <p className="font-black text-slate-800 text-sm">{s.name}</p>
                                  <p className="text-[8px] font-black text-slate-400 uppercase">NIS: {s.nis}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex justify-center gap-1.5">
                                     {Object.values(AttendanceStatus).map(st => (
                                       <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: st }})} className={`w-8 h-8 rounded-lg font-black text-[9px] border-2 transition-all ${curr.status === st ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-300'}`}>{st[0]}</button>
                                     ))}
                                  </div>
                               </td>
                               <td className="px-8 py-6"><input type="text" value={curr.note} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})} placeholder="..." className="w-full px-4 py-2 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-xl text-[10px] font-bold outline-none"/></td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
               <button onClick={submitSantriAttendance} className="w-full bg-emerald-700 text-white font-black py-6 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]"><Save size={20}/> SIMPAN ABSENSI</button>
            </div>
          )
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
             <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-[2rem] flex items-center justify-center"><LayoutGrid size={40}/></div>
             <div>
                <h3 className="text-sm font-black text-slate-800 uppercase">Pilih Sesi & Kelas</h3>
                <p className="text-[10px] font-bold text-slate-400 max-w-xs mt-1">Gunakan filter di atas untuk mulai mencatat kehadiran.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
