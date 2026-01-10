
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttendanceStatus, AttendanceRecord, UserRole, Student, TeacherAttendance, Schedule, SessionType, AcademicConfig
} from '../types';
import { 
  Clock, UserCheck, CheckCircle, Save, Search, BookOpen, Edit, Users, Filter, ChevronRight, Info, Calendar, AlertTriangle, Sparkles, BrainCircuit, ListTodo, History, Plus, UserPlus, Trash2, X, Lock
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
  const [activeView, setActiveView] = useState<'jadwal' | 'riwayat'>('jadwal');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [extraStudents, setExtraStudents] = useState<Student[]>([]);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraSearch, setExtraSearch] = useState('');

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();
  const nowTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Fungsi Cek Apakah Sekarang Jam Mengajar (Toleransi 15 Menit)
  const isTimeValid = (scheduleTime: string) => {
    try {
      const [start, end] = scheduleTime.split('-').map(t => t.trim());
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      
      const startTime = new Date();
      startTime.setHours(sH, sM - 15, 0); // 15 menit sebelum mulai
      
      const endTime = new Date();
      endTime.setHours(eH, eM, 0);

      return now >= startTime && now <= endTime;
    } catch {
      return true; // Fallback jika format waktu salah
    }
  };

  // 1. Ambil Jadwal Pribadi Guru
  const mySchedules = useMemo(() => {
    return schedules.filter(s => 
      s.day.toLowerCase() === todayDay.toLowerCase() && 
      s.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim()
    );
  }, [schedules, currentUser, todayDay]);

  // 2. Ambil Santri Otomatis Berdasarkan Jadwal Terpilih
  const baseStudents = useMemo(() => {
    if (!selectedSchedule) return [];
    return students.filter(s => {
      if (selectedSchedule.sessionType === 'Madrasah') {
        return s.formalClass === selectedSchedule.class;
      }
      const mapping = s.sessionClasses || {};
      const matchKey = Object.keys(mapping).find(k => k.toLowerCase() === selectedSchedule.sessionType.toLowerCase());
      return matchKey ? mapping[matchKey] === selectedSchedule.class : s.formalClass === selectedSchedule.class;
    });
  }, [selectedSchedule, students]);

  // Gabungkan santri asli + santri tambahan
  const currentAttendanceList = [...baseStudents, ...extraStudents];

  const handleStartAttendance = (sch: Schedule) => {
    if (!isTimeValid(sch.time)) {
      alert(`Maaf Ustadz/ah, pengisian absen untuk jadwal "${sch.subject}" hanya bisa dilakukan pada jam ${sch.time}.`);
      return;
    }
    
    // Auto Check-in Guru
    const isAlreadyChecked = teacherAttendance.some(t => t.timeScheduled === sch.time && t.date === now.toLocaleDateString('id-ID'));
    if (!isAlreadyChecked) {
      onTeacherCheckIn({
        id: `t-att-${Date.now()}`,
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
    }

    setSelectedSchedule(sch);
    setExtraStudents([]);
    setTempRecords({});
  };

  const handleSaveAttendance = () => {
    if (!selectedSchedule) return;
    
    const records: AttendanceRecord[] = currentAttendanceList.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      date: now.toLocaleDateString('id-ID'),
      recordedTime: nowTimeStr,
      studentId: s.id,
      status: tempRecords[s.id]?.status || AttendanceStatus.H,
      note: tempRecords[s.id]?.note || (extraStudents.some(es => es.id === s.id) ? 'Santri Tambahan/Titipan' : ''),
      recordedBy: currentUser,
      class: selectedSchedule.class,
      sessionType: selectedSchedule.sessionType,
      subject: selectedSchedule.subject
    }));

    onSave(records);
    alert(`Alhamdulillah, absen kelas ${selectedSchedule.class} (${selectedSchedule.subject}) berhasil disimpan.`);
    setSelectedSchedule(null);
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto animate-in fade-in duration-700">
      
      {/* Banner Identitas */}
      <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
              <UserCheck size={32} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">Portal Absensi Guru</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-3">Ahlan, Ustadz/ah {currentUser}</p>
            </div>
          </div>
          <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/5 text-center">
             <p className="text-[14px] font-black tracking-tighter">{nowTimeStr}</p>
             <p className="text-[8px] font-bold text-emerald-400 uppercase mt-1">{todayDay}, {now.toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      {!selectedSchedule ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Calendar size={24}/></div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Jadwal Mengajar Anda Hari Ini</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {mySchedules.map(sch => {
                   const isValid = isTimeValid(sch.time);
                   return (
                     <div key={sch.id} className={`p-8 rounded-[3rem] border-2 transition-all flex flex-col justify-between gap-6 relative overflow-hidden group ${isValid ? 'bg-white border-emerald-100 hover:border-emerald-600 hover:shadow-2xl' : 'bg-slate-50 border-transparent opacity-60'}`}>
                        {!isValid && <div className="absolute top-4 right-4 text-slate-300"><Lock size={18}/></div>}
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{sch.time}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{sch.sessionType}</span>
                           </div>
                           <h4 className="text-lg font-black text-slate-800 uppercase leading-tight">{sch.subject}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UNIT KELAS {sch.class} • {sch.gender}</p>
                        </div>
                        <button 
                          disabled={!isValid}
                          onClick={() => handleStartAttendance(sch)}
                          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isValid ? 'bg-emerald-800 text-white shadow-lg hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                           Mulai Absen Santri <ChevronRight size={16}/>
                        </button>
                     </div>
                   );
                 })}
                 {mySchedules.length === 0 && (
                   <div className="col-span-full py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-100 text-slate-200"><Calendar size={32}/></div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Tidak Ada Jadwal Mengajar Anda Hari Ini</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
           <div className="bg-white p-8 rounded-[3rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-30 backdrop-blur-md bg-white/90">
              <div className="flex items-center gap-5">
                 <button onClick={() => setSelectedSchedule(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"><X size={20}/></button>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedSchedule.subject}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesi {selectedSchedule.sessionType} • Unit {selectedSchedule.class}</p>
                 </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 <button onClick={() => setShowAddExtra(true)} className="flex-1 md:flex-none px-6 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100">
                    <UserPlus size={16}/> Tambah Santri Luar
                 </button>
                 <button onClick={handleSaveAttendance} className="flex-1 md:flex-none px-8 py-4 bg-emerald-800 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700">
                    <Save size={16}/> Simpan Absen
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                 {currentAttendanceList.map(s => {
                   const isExtra = extraStudents.some(es => es.id === s.id);
                   return (
                    <div key={s.id} className={`flex flex-col md:flex-row items-center justify-between p-8 hover:bg-slate-50/50 gap-6 transition-all ${isExtra ? 'bg-indigo-50/30' : ''}`}>
                       <div className="flex items-center gap-5 flex-1 w-full">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${isExtra ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s.name[0]}</div>
                          <div className="min-w-0">
                             <h4 className="text-sm font-black text-slate-800 uppercase leading-none truncate flex items-center gap-2">
                                {s.name} {isExtra && <span className="text-[7px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">SANTRI LUAR</span>}
                             </h4>
                             <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{s.nis} • {s.formalClass}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                             {[AttendanceStatus.H, AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].map(st => (
                                <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...(tempRecords[s.id] || {status: AttendanceStatus.H, note: ''}), status: st }})} className={`w-10 h-10 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${ (tempRecords[s.id]?.status || AttendanceStatus.H) === st ? (st === 'Hadir' ? 'bg-emerald-800 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') : 'text-slate-400 hover:text-slate-600'}`}>{st[0]}</button>
                             ))}
                          </div>
                          {isExtra ? (
                            <button onClick={() => setExtraStudents(extraStudents.filter(es => es.id !== s.id))} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                          ) : (
                            <input type="text" placeholder="Catatan..." value={tempRecords[s.id]?.note || ''} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...(tempRecords[s.id] || {status: AttendanceStatus.H, note: ''}), note: e.target.value }})} className="w-28 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none shadow-inner focus:bg-white focus:border-emerald-600 transition-all" />
                          )}
                       </div>
                    </div>
                   );
                 })}
                 {currentAttendanceList.length === 0 && (
                   <div className="py-32 text-center text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Daftar Santri Unit Ini Belum Ada</div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL TAMBAH SANTRI EKSTRA */}
      {showAddExtra && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-emerald-950/40 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cari Santri Luar</h3>
                 <button onClick={() => setShowAddExtra(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl"><X size={20}/></button>
              </div>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input type="text" value={extraSearch} onChange={e => setExtraSearch(e.target.value)} placeholder="Nama atau NISN..." className="w-full pl-12 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-xs shadow-inner" />
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                 {students
                   .filter(s => s.name.toLowerCase().includes(extraSearch.toLowerCase()) && !currentAttendanceList.some(cas => cas.id === s.id))
                   .slice(0, 10)
                   .map(s => (
                     <button key={s.id} onClick={() => { setExtraStudents([...extraStudents, s]); setShowAddExtra(false); setExtraSearch(''); }} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group hover:bg-indigo-600 hover:text-white transition-all">
                        <div className="text-left">
                           <p className="text-[11px] font-black uppercase">{s.name}</p>
                           <p className="text-[8px] font-bold opacity-60 uppercase mt-1">KELAS: {s.formalClass}</p>
                        </div>
                        <Plus size={18}/>
                     </button>
                 ))}
                 {extraSearch.length > 0 && students.filter(s => s.name.toLowerCase().includes(extraSearch.toLowerCase())).length === 0 && (
                   <p className="text-center text-[10px] text-slate-300 font-black uppercase py-10">Santri tidak ditemukan</p>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
