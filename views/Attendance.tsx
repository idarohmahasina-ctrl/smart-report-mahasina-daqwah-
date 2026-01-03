
import React, { useState, useMemo } from 'react';
import { 
  AttendanceStatus, AttendanceRecord, UserRole, Student, TeacherAttendance, Schedule, SessionType, AcademicConfig
} from '../types';
import { 
  Clock, UserCheck, CheckCircle, Save, Search, BookOpen, Edit, Users, Filter, ChevronRight, Info, Calendar
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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionType>(SessionType.MADRASAH);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterLevel, setFilterLevel] = useState<'Semua' | 'MTs' | 'MA'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customSessionText, setCustomSessionText] = useState('');
  
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Data contoh untuk presentasi jika tidak ada jadwal
  const displaySchedules = useMemo(() => {
    const realSchedules = schedules.filter(s => 
      s.day.toLowerCase() === todayDay.toLowerCase() && 
      (role === UserRole.IDAROH || s.teacherName.toLowerCase().trim() === currentUser.toLowerCase().trim())
    );
    
    if (realSchedules.length > 0) return realSchedules;
    
    // Mock data if empty for preview/presentation
    return [
      { id: 'p1', class: '11 IPA', level: 'MA', gender: 'Putra', day: todayDay, time: '07:30 - 09:00', subject: 'Fisika Terapan', teacherName: currentUser, sessionType: SessionType.MADRASAH },
      { id: 'p2', class: '7A', level: 'MTs', gender: 'Putra', day: todayDay, time: '13:00 - 14:30', subject: 'Fiqih Ibadah', teacherName: currentUser, sessionType: SessionType.MADRASAH }
    ] as Schedule[];
  }, [schedules, currentUser, todayDay, role]);

  const activeTeacherAttendance = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    return teacherAttendance.filter(a => a.teacherName === currentUser && a.date === today);
  }, [teacherAttendance, currentUser]);

  const availableClassesForSantri = useMemo(() => {
    if (isCustomMode) return Array.from(new Set(students.map(s => s.formalClass))).sort();
    return Array.from(new Set(displaySchedules.map(s => s.class))).sort();
  }, [isCustomMode, displaySchedules, students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    let list = students.filter(s => s.formalClass === selectedClass || s.sessionClasses[selectedSession] === selectedClass);
    if (filterLevel !== 'Semua') list = list.filter(s => s.level === filterLevel);
    if (filterGender !== 'Semua') list = list.filter(s => s.gender === filterGender);
    return list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClass, selectedSession, searchTerm, filterLevel, filterGender]);

  const handleTeacherAction = (sch: Schedule) => {
    const now = new Date();
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
    alert(`Konfirmasi hadir untuk ${sch.subject} berhasil.`);
  };

  const submitSantriAttendance = () => {
    if (!selectedClass) { alert("Pilih kelas terlebih dahulu."); return; }
    const finalRecords: AttendanceRecord[] = filteredStudents.map(student => ({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('id-ID'),
      studentId: student.id,
      status: tempRecords[student.id]?.status || AttendanceStatus.H,
      note: tempRecords[student.id]?.note || '',
      recordedBy: currentUser,
      class: selectedClass,
      sessionType: selectedSession,
      subject: isCustomMode ? (customSessionText || 'Kegiatan Luar Jadwal') : selectedSubject
    }));
    onSave(finalRecords);
    alert("Data absensi santri berhasil disimpan ke sistem.");
    setTempRecords({});
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-emerald-950 p-8 rounded-[3rem] shadow-xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md">
              {mode === 'Guru' ? <Users size={32} /> : <UserCheck size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none">{mode === 'Guru' ? 'Absensi Kehadiran Guru' : 'Absensi Kehadiran Santri'}</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-3">{todayDay} • {nowTimeStr}</p>
            </div>
          </div>
          {mode === 'Santri' && (
            <button onClick={() => { setIsCustomMode(!isCustomMode); setSelectedClass(''); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCustomMode ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}>
              {isCustomMode ? 'Gunakan Jadwal' : 'Absen Bebas'}
            </button>
          )}
        </div>
      </div>

      {mode === 'Guru' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displaySchedules.map(sch => (
            <div key={sch.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 font-black border border-emerald-100">{sch.class}</div>
                  <div>
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">{sch.sessionType}</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase mt-1 leading-none">{sch.subject}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu Jadwal</p>
                  <p className="text-[10px] font-bold text-slate-700 mt-1">{sch.time}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Nama Guru:</span>
                  <span className="text-slate-700">{sch.teacherName}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Mulai Absen:</span>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Clock size={12}/> {nowTimeStr}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleTeacherAction(sch)}
                className="w-full py-4 bg-emerald-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-900 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle size={16}/> Konfirmasi Hadir
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesi / Unit</label>
                <select value={selectedSession} onChange={e => setSelectedSession(e.target.value as any)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-[11px] font-black uppercase outline-none shadow-inner appearance-none transition-all">
                  {Object.values(SessionType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Kelas</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-[11px] font-black uppercase outline-none shadow-inner appearance-none transition-all">
                  <option value="">-- PILIH KELAS --</option>
                  {availableClassesForSantri.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kegiatan / Mapel</label>
                {isCustomMode ? (
                  <input type="text" value={customSessionText} onChange={e => setCustomSessionText(e.target.value)} placeholder="Contoh: Majlis Sore" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-[11px] font-black uppercase outline-none shadow-inner transition-all" />
                ) : (
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl text-[11px] font-black uppercase outline-none shadow-inner appearance-none transition-all">
                    <option value="">-- PILIH MATA PELAJARAN --</option>
                    {displaySchedules.filter(s => s.class === selectedClass && s.sessionType === selectedSession).map(s => (
                      <option key={s.id} value={s.subject}>{s.subject}</option>
                    ))}
                  </select>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
             {!selectedClass ? (
               <div className="p-16 text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><Users size={40} className="text-slate-200"/></div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Silakan Pilih Kelas</h4>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Daftar santri akan muncul secara otomatis</p>
                  </div>
               </div>
             ) : (
               <div className="divide-y divide-slate-100">
                  <div className="p-6 bg-slate-50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
                       <input type="text" placeholder="Cari Nama Santri..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none shadow-sm focus:border-emerald-600" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                       <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase outline-none shadow-sm">
                          <option value="Semua">UNIT</option><option value="MTs">MTs</option><option value="MA">MA</option>
                       </select>
                       <select value={filterGender} onChange={e => setFilterGender(e.target.value as any)} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase outline-none shadow-sm">
                          <option value="Semua">GDR</option><option value="Putra">PA</option><option value="Putri">PI</option>
                       </select>
                    </div>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="py-24 text-center text-slate-300 font-black uppercase italic text-[11px] tracking-widest">Data Santri Tidak Tersedia Untuk Filter Ini</div>
                  ) : filteredStudents.map(s => {
                    const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                    return (
                      <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:px-10 hover:bg-slate-50 transition-all gap-6 group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">{s.name[0]}</div>
                           <div className="min-w-0">
                              <h4 className="text-[12px] font-black text-slate-800 uppercase leading-none truncate">{s.name}</h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{s.nis} • {s.level} • {s.gender}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl flex-1 sm:flex-none">
                              {[AttendanceStatus.H, AttendanceStatus.S, AttendanceStatus.I, AttendanceStatus.T, AttendanceStatus.A].map(st => (
                                <button key={st} onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: st }})} className={`w-10 h-10 rounded-xl font-black text-[11px] flex items-center justify-center transition-all ${curr.status === st ? (st === AttendanceStatus.H ? 'bg-emerald-700 text-white shadow-lg scale-110' : 'bg-red-600 text-white shadow-lg scale-110') : 'bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}>
                                  {st[0]}
                                </button>
                              ))}
                          </div>
                          <input type="text" placeholder="Ket..." value={curr.note} onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})} className="w-24 sm:w-32 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none shadow-inner focus:bg-white focus:border-emerald-600 transition-all" />
                        </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>
          {selectedClass && (
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siap Disimpan:</p>
                  <h5 className="text-xl font-black text-emerald-800 uppercase leading-none mt-2">{filteredStudents.length} Santri Terdata</h5>
               </div>
               <button onClick={submitSantriAttendance} className="w-full md:w-80 bg-emerald-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-800 active:scale-95 transition-all">
                  <Save size={20}/> Simpan Laporan Kehadiran
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
