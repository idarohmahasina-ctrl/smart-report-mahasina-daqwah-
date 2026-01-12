
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceStatus, AttendanceRecord, UserRole, Student, TeacherAttendance, Schedule, AcademicConfig
} from '../types';
import { 
  Clock, UserCheck, CheckCircle, Save, Search, BookOpen, ChevronRight, Calendar, UserPlus, X, Lock, ListFilter, Sparkles
} from 'lucide-react';

interface AttendanceProps {
  mode: 'Guru' | 'Santri';
  onSave: (records: AttendanceRecord[]) => void;
  onTeacherCheckIn: (record: TeacherAttendance) => void;
  role: UserRole;
  currentUser: string;
  students: Student[];
  teacherAttendance: TeacherAttendance[];
  schedules: Schedule[];
  academicConfig: AcademicConfig;
}

const Attendance: React.FC<AttendanceProps> = ({ 
  mode, onSave, onTeacherCheckIn, role, currentUser, students, teacherAttendance, schedules, academicConfig
}) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  
  const [manualSession, setManualSession] = useState('MQ (Majlis Quran)');
  const [manualClass, setManualClass] = useState('');

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const isPetugas = role === UserRole.SANTRI_OFFICER || role === UserRole.IDAROH;

  // AI ASISTENSI JADWAL
  const currentScheduleRecommendation = useMemo(() => {
    // Filter jadwal ustadz yang paling dekat dengan jam sekarang
    const mySchedules = schedules.filter(s => 
      s.day.toLowerCase() === todayDay.toLowerCase() && 
      s.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim()
    );
    return mySchedules[0] || null;
  }, [schedules, currentUser, todayDay]);

  const allAvailableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.formalClass))).sort();
  }, [students]);

  const attendanceList = useMemo(() => {
    const targetClass = isPetugas ? manualClass : selectedSchedule?.class;
    if (!targetClass) return [];
    return students.filter(s => s.formalClass === targetClass);
  }, [isPetugas, manualClass, selectedSchedule, students]);

  const handleSave = () => {
    const records: AttendanceRecord[] = attendanceList.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      date: now.toLocaleDateString('id-ID'),
      recordedTime: nowTimeStr,
      studentId: s.id,
      status: tempRecords[s.id]?.status || AttendanceStatus.H,
      note: tempRecords[s.id]?.note || '',
      recordedBy: currentUser,
      class: isPetugas ? manualClass : selectedSchedule!.class,
      sessionType: isPetugas ? manualSession : selectedSchedule!.sessionType,
      subject: isPetugas ? manualSession : selectedSchedule!.subject
    }));

    onSave(records);
    alert("Berhasil disimpan!");
    setSelectedSchedule(null);
    setManualClass('');
    setTempRecords({});
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto animate-in fade-in duration-700">
      
      {/* SMART AI NOTIFICATION FOR GURU */}
      {!isPetugas && currentScheduleRecommendation && !selectedSchedule && (
        <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group animate-bounce">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Sparkles size={24}/></div>
              <div>
                 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Asisten Jadwal</p>
                 <h4 className="text-sm font-black text-slate-800 uppercase mt-1">Ustadz/ah, anda ada jadwal di kelas {currentScheduleRecommendation.class} sekarang.</h4>
              </div>
           </div>
           <button onClick={() => setSelectedSchedule(currentScheduleRecommendation)} className="px-6 py-3 bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Absen Sekarang</button>
        </div>
      )}

      {isPetugas && !manualClass && (
        <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ListFilter size={24}/></div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Input Absensi Sesi Umum</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Jenis Sesi</label>
                 <select value={manualSession} onChange={e => setManualSession(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs border-2 border-transparent focus:border-blue-600 appearance-none shadow-inner">
                    <option>MQ (Majlis Quran)</option>
                    <option>Tahfidzul Ayat</option>
                    <option>Dzikir Pagi/Petang</option>
                    <option>Majlis Malam</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Kelas</label>
                 <select value={manualClass} onChange={e => setManualClass(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs border-2 border-transparent focus:border-blue-600 appearance-none shadow-inner">
                    <option value="">-- PILIH UNIT --</option>
                    {allAvailableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
           </div>
        </div>
      )}

      {/* VIEW JADWAL GURU */}
      {!isPetugas && !selectedSchedule && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {schedules.filter(s => s.day === todayDay && s.teacherName.includes(currentUser)).map(sch => (
              <button key={sch.id} onClick={() => setSelectedSchedule(sch)} className="p-8 bg-white border border-slate-100 rounded-[3rem] text-left hover:border-emerald-600 transition-all shadow-sm hover:shadow-xl group">
                 <div className="flex justify-between mb-6">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">{sch.time}</span>
                    <BookOpen size={24} className="text-slate-200 group-hover:text-emerald-600 transition-colors"/>
                 </div>
                 <h4 className="text-lg font-black text-slate-800 uppercase leading-none">{sch.subject}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">UNIT: {sch.class} • {sch.sessionType}</p>
              </button>
           ))}
        </div>
      )}

      {/* FORM INPUT SANTRI */}
      {(selectedSchedule || (isPetugas && manualClass)) && (
        <div className="space-y-6 animate-in zoom-in-95">
           <div className="bg-white p-8 rounded-[3rem] border shadow-2xl flex justify-between items-center sticky top-4 z-40">
              <div>
                 <h3 className="text-lg font-black text-slate-800 uppercase leading-none">{isPetugas ? manualSession : selectedSchedule!.subject}</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">KELAS: {isPetugas ? manualClass : selectedSchedule!.class}</p>
              </div>
              <button onClick={() => { setSelectedSchedule(null); setManualClass(''); }} className="p-4 bg-slate-100 text-slate-400 rounded-2xl"><X size={20}/></button>
           </div>
           
           <div className="bg-white rounded-[4rem] border shadow-sm divide-y divide-slate-50">
              {attendanceList.map(s => (
                <div key={s.id} className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs">{s.name[0]}</div>
                      <div>
                         <p className="text-sm font-black text-slate-800 uppercase leading-none">{s.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{s.nis}</p>
                      </div>
                   </div>
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['H', 'S', 'I', 'T', 'A'].map(st => (
                         <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { status: (st==='H'?'Hadir':st==='S'?'Sakit':st==='I'?'Izin':st==='T'?'Terlambat':'Alpha') as any, note: '' }})} className={`w-10 h-10 rounded-lg text-[10px] font-black transition-all ${ (tempRecords[s.id]?.status?.[0] || 'H') === st ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-400' }`}>{st}</button>
                      ))}
                   </div>
                </div>
              ))}
           </div>

           <button onClick={handleSave} className="w-full py-6 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl hover:bg-emerald-900 transition-all">
              Simpan Data Absensi
           </button>
        </div>
      )}
    </div>
  );
};

export default Attendance;
