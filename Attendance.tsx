
import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceStatus, Student, UserRole, Schedule, AppData, AttendanceRecord } from './types.ts';
import { UserCheck, CheckCircle, Search, Save, X, Edit3, PlusCircle, Calendar, UserPlus, Ban, Users, Clock, ArrowLeft } from 'lucide-react';
import { isTeacherMatch, normalizeSessionName, normalizeClassName } from './views/utils/nameMatchers.ts';

const Attendance: React.FC<AppData & { role: UserRole, currentUser: string, onSave: any, userEmail?: string }> = (data) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const schedules = data.schedules || [];
  const students = data.students || [];
  const todayDay = useMemo(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('id-ID'));

  const isIdaroh = data.role === UserRole.IDAROH || data.role === UserRole.PENGASUH || data.userEmail?.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isGenderRestricted = !isIdaroh && (data.role === UserRole.SANTRI_OFFICER_PUTRA || data.role === UserRole.SANTRI_OFFICER_PUTRI);
  const targetGender = data.role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const normalizeDay = (day: string) => day.toLowerCase().replace(/['`]/g, '').trim();

  const mySchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchDay = normalizeDay(s.day) === normalizeDay(todayDay) || 
                       (normalizeDay(todayDay) === 'minggu' && normalizeDay(s.day) === 'ahad');
      if (!matchDay) return false;

      const matchTeacher = isIdaroh || isTeacherMatch(data.currentUser, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName);
      const matchGender = isIdaroh || !isGenderRestricted || s.gender === targetGender;
      
      // Filter Selesai atau LIBUR
      const isDone = data.attendance.some(a => 
        a.date === todayDateStr && 
        a.class === s.class && 
        normalizeSessionName(a.sessionType) === normalizeSessionName(s.sessionType)
      );

      const isHoliday = data.teacherAttendance.some(ta =>
        ta.date === todayDateStr &&
        ta.class === s.class &&
        normalizeSessionName(ta.sessionType || "") === normalizeSessionName(s.sessionType) &&
        ta.status === AttendanceStatus.LIBUR
      );

      if ((isDone || isHoliday) && !isIdaroh) return false;

      return matchTeacher && matchGender;
    }).sort((a,b) => a.time.localeCompare(b.time));
  }, [schedules, data.currentUser, isGenderRestricted, targetGender, isIdaroh, todayDay, data.attendance, data.teacherAttendance, todayDateStr]);

  const targetStudents = useMemo(() => {
    if (!selectedSchedule) return [];
    
    const scheduleSess = normalizeSessionName(selectedSchedule.sessionType);
    const scheduleClsNormalized = normalizeClassName(selectedSchedule.class);
    
    return students
      .filter(s => {
        const matchGender = isIdaroh || !isGenderRestricted || s.gender === targetGender;
        let matchClass = false;
        
        const sessionInStudent = Object.entries(s.sessionClasses || {}).find(([sessKey]) => 
          normalizeSessionName(sessKey) === scheduleSess
        );

        if (sessionInStudent) {
          matchClass = normalizeClassName(sessionInStudent[1] as string) === scheduleClsNormalized;
        } else {
          matchClass = normalizeClassName(s.formalClass) === scheduleClsNormalized;
        }
        
        return matchGender && matchClass;
      })
      .filter(s => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedSchedule, students, searchTerm, isGenderRestricted, targetGender, isIdaroh]);

  useEffect(() => {
    if (selectedSchedule && targetStudents.length > 0) {
      const initial: Record<string, { status: AttendanceStatus, note: string }> = {};
      targetStudents.forEach(s => {
        initial[s.id] = { status: AttendanceStatus.H, note: '' };
      });
      setTempRecords(initial);
    }
  }, [selectedSchedule, targetStudents]);

  const handleSave = () => {
    if (!selectedSchedule || targetStudents.length === 0) return;

    const records = targetStudents.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      date: todayDateStr,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      studentId: s.id,
      status: tempRecords[s.id]?.status || AttendanceStatus.H,
      note: tempRecords[s.id]?.note || '',
      recordedBy: data.currentUser,
      class: selectedSchedule.class,
      sessionType: selectedSchedule.sessionType
    }));
    data.onSave(records);
    alert(`Laporan Absensi ${selectedSchedule.subject} Berhasil Dikirim!`);
    setSelectedSchedule(null);
    setTempRecords({});
    setSearchTerm('');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-24 px-2">
      {!selectedSchedule ? (
        <div className="space-y-6">
          <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Daftar Mengajar ({todayDay})</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Status: {mySchedules.length} Sesi Aktif</p>
             </div>
             {isIdaroh && <span className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase shadow-sm">Super Admin Access</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySchedules.map(sch => (
                <button 
                  key={sch.id} 
                  onClick={() => setSelectedSchedule(sch)} 
                  className="p-10 bg-white border-2 rounded-[3.5rem] text-left transition-all group border-transparent hover:border-emerald-600 hover:shadow-2xl"
                >
                   <div className="flex items-center justify-between gap-2">
                     <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase truncate bg-emerald-50 text-emerald-700">{sch.sessionType}</span>
                     <Clock size={16} className="text-slate-100 group-hover:text-emerald-500 transition-colors" />
                   </div>
                   <h4 className="text-xl font-black uppercase mt-6 line-clamp-1 text-slate-800">{sch.subject}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{sch.time}</p>
                   
                   <div className="mt-8 flex justify-between items-center border-t border-slate-50 pt-6">
                      <p className="text-[12px] font-black text-slate-800">KELAS: {sch.class}</p>
                      <PlusCircle size={20} className="text-slate-200 group-hover:text-emerald-600 transition-all" />
                   </div>
                </button>
            ))}
            {mySchedules.length === 0 && (
              <div className="lg:col-span-3 py-32 text-center opacity-30 flex flex-col items-center gap-6">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"><Calendar size={48} className="text-slate-400"/></div>
                 <div className="space-y-2">
                    <p className="font-black uppercase text-[12px] tracking-[0.3em]">Antrian Selesai</p>
                    <p className="text-[10px] italic">Tidak ada jadwal KBM atau sesi mungkin sedang libur.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden max-w-5xl mx-auto animate-in slide-in-from-bottom-10">
           <div className="p-10 bg-[#064e3b] text-white flex justify-between items-center relative overflow-hidden">
              <div className="min-w-0 flex-1 relative z-10">
                <div className="flex items-center gap-3">
                   <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ArrowLeft size={20}/></button>
                   <h3 className="text-2xl font-black uppercase tracking-tight truncate">{selectedSchedule.subject}</h3>
                </div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] mt-3 ml-11">KELAS {selectedSchedule.class} • {selectedSchedule.sessionType} • {targetStudents.length} SANTRI</p>
              </div>
              <button onClick={() => setSelectedSchedule(null)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all shrink-0"><X/></button>
           </div>
           
           <div className="p-8 border-b bg-slate-50 flex items-center gap-5">
              <Search className="text-slate-300 shrink-0" size={20}/>
              <input type="text" placeholder="Cari nama santri di kelas ini..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none font-black text-sm uppercase" />
           </div>

           <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar bg-slate-50/30">
              {targetStudents.map((s, idx) => {
                const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                return (
                  <div key={s.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-emerald-500 hover:shadow-xl transition-all gap-6">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-200 w-6 shrink-0">{idx + 1}.</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${curr.status === AttendanceStatus.H ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{s.name[0]}</div>
                        <div className="min-w-0">
                           <p className="text-[13px] font-black uppercase truncate text-slate-800">{s.name}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.nis || '-'}</p>
                        </div>
                     </div>

                     <div className="flex gap-4 items-center shrink-0">
                        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                          {['H', 'S', 'I', 'T', 'A'].map(l => {
                            const status = l === 'H' ? AttendanceStatus.H : l === 'S' ? AttendanceStatus.S : l === 'I' ? AttendanceStatus.I : l === 'T' ? AttendanceStatus.T : AttendanceStatus.A;
                            const isActive = curr.status === status;
                            return (
                              <button 
                                key={l} 
                                onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: status }})} 
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[9px] sm:text-[10px] font-black transition-all ${isActive ? (status === AttendanceStatus.H ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-red-600 text-white shadow-xl scale-110') : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {l}
                              </button>
                            );
                          })}
                        </div>
                     </div>
                  </div>
                );
              })}
              {targetStudents.length === 0 && (
                <div className="py-32 text-center opacity-10">
                   <Users size={80} className="mx-auto"/>
                   <p className="mt-6 font-black uppercase text-[12px] tracking-[0.5em]">Santri Tidak Ditemukan</p>
                </div>
              )}
           </div>

           <div className="p-10 border-t bg-white">
              <button disabled={targetStudents.length === 0} onClick={handleSave} className="w-full py-7 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30">
                <CheckCircle size={22}/> Kirim Laporan Absensi
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
