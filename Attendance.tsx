
import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceStatus, Student, UserRole, Schedule, AppData } from './types.ts';
import { UserCheck, CheckCircle, Search, Save, X, Edit3, PlusCircle, Calendar, UserPlus, Ban, Users } from 'lucide-react';
import { isTeacherMatch, normalizeSessionName, normalizeClassName } from './views/utils/nameMatchers.ts';

const Attendance: React.FC<AppData & { role: UserRole, currentUser: string, onSave: any, userEmail?: string }> = (data) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const schedules = data.schedules || [];
  const students = data.students || [];
  const config = data.academicConfig;

  const isIdaroh = data.role === UserRole.IDAROH || data.role === UserRole.PENGASUH || data.userEmail?.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isGenderRestricted = !isIdaroh && (data.role === UserRole.SANTRI_OFFICER_PUTRA || data.role === UserRole.SANTRI_OFFICER_PUTRI);
  const targetGender = data.role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const isHoliday = (cls: string, sess: string) => {
    if (config?.excludedClasses?.[cls]) return true;
    if (config?.excludedSessions?.[sess]) return true;
    if (config?.sessionClassExclusions?.[sess]?.[cls]) return true;
    return false;
  };

  const mySchedules = useMemo(() => {
    return schedules.filter(s => {
      // Idaroh Mode: 24 jam akses penuh
      const matchTeacher = isIdaroh || isTeacherMatch(data.currentUser, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName);
      const matchGender = isIdaroh || !isGenderRestricted || s.gender === targetGender;
      return matchTeacher && matchGender;
    }).sort((a,b) => a.time.localeCompare(b.time));
  }, [schedules, data.currentUser, isGenderRestricted, targetGender, isIdaroh]);

  const targetStudents = useMemo(() => {
    if (!selectedSchedule) return [];
    
    const scheduleSess = normalizeSessionName(selectedSchedule.sessionType);
    const scheduleClsNormalized = normalizeClassName(selectedSchedule.class);
    
    return students
      .filter(s => {
        const matchGender = isIdaroh || !isGenderRestricted || s.gender === targetGender;
        let matchClass = false;
        
        // Match Kelas berdasarkan Sesi Dinamis dari Excel
        const sessionInStudent = Object.entries(s.sessionClasses || {}).find(([sessKey]) => 
          normalizeSessionName(sessKey) === scheduleSess
        );

        if (sessionInStudent) {
          // Jika ada plotting di sesi khusus
          matchClass = normalizeClassName(sessionInStudent[1] as string) === scheduleClsNormalized;
        } else {
          // Default cek formal class
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
    if (!selectedSchedule) return;
    if (targetStudents.length === 0) return;

    const records = targetStudents.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      studentId: s.id,
      status: tempRecords[s.id]?.status || AttendanceStatus.H,
      note: tempRecords[s.id]?.note || '',
      recordedBy: data.currentUser,
      class: selectedSchedule.class,
      sessionType: selectedSchedule.sessionType
    }));
    data.onSave(records);
    alert(`Laporan Absensi ${selectedSchedule.subject} Tersimpan!`);
    setSelectedSchedule(null);
    setTempRecords({});
    setSearchTerm('');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20 px-2">
      {!selectedSchedule ? (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Pilih Jadwal KBM Aktif</h3>
             <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
               Daftar ini menyesuaikan dengan file Master Jadwal yang Anda impor.
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {mySchedules.map(sch => {
              const holiday = isHoliday(sch.class, sch.sessionType);
              return (
                <button 
                  key={sch.id} 
                  disabled={holiday}
                  onClick={() => setSelectedSchedule(sch)} 
                  className={`p-6 sm:p-8 bg-white border-2 rounded-[2.5rem] text-left transition-all group relative overflow-hidden ${holiday ? 'opacity-50 border-orange-100 bg-orange-50/30 cursor-not-allowed' : 'border-transparent hover:border-emerald-600 hover:shadow-xl'}`}
                >
                   <div className="flex items-center justify-between gap-2">
                     <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase truncate ${holiday ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>{sch.sessionType}</span>
                     {isIdaroh && <span className="text-[7px] font-black text-blue-500 uppercase shrink-0 border border-blue-100 px-2 py-0.5 rounded-full bg-blue-50">Master Admin</span>}
                   </div>
                   <h4 className={`text-base sm:text-lg font-black uppercase mt-4 line-clamp-1 ${holiday ? 'text-slate-400' : 'text-slate-800'}`}>{sch.subject}</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 truncate">PENA: {sch.teacherName}</p>
                   <div className="mt-6 flex justify-between items-center border-t border-slate-50 pt-4">
                      <p className={`text-[10px] font-black ${holiday ? 'text-slate-400' : 'text-slate-700'}`}>UNIT: {sch.class}</p>
                      <p className={`text-[10px] font-black ${holiday ? 'text-slate-400' : 'text-slate-700'}`}>{sch.time}</p>
                   </div>
                </button>
              );
            })}
            {mySchedules.length === 0 && (
              <div className="lg:col-span-3 py-24 text-center opacity-30 flex flex-col items-center gap-4">
                 <Calendar size={64} className="text-slate-300"/>
                 <div className="space-y-1">
                    <p className="font-black uppercase text-[12px] tracking-widest">Jadwal Kosong</p>
                    <p className="text-[10px] italic">Pastikan data Jadwal di menu Informasi sudah terisi.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] border shadow-2xl overflow-hidden max-w-4xl mx-auto">
           <div className="p-6 sm:p-10 bg-[#064e3b] text-white flex justify-between items-center relative">
              <div className="min-w-0 flex-1 relative z-10">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight truncate">{selectedSchedule.subject}</h3>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-2">UNIT {selectedSchedule.class} • {selectedSchedule.sessionType}</p>
              </div>
              <button onClick={() => setSelectedSchedule(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all shrink-0"><X/></button>
           </div>
           
           <div className="p-5 border-b bg-slate-50 flex items-center gap-4">
              <Search className="text-slate-400 shrink-0" size={18}/>
              <input type="text" placeholder="Cari nama santri..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none font-bold text-sm" />
           </div>

           <div className="p-4 sm:p-8 space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar">
              {targetStudents.map(s => {
                const curr = tempRecords[s.id] || { status: AttendanceStatus.H, note: '' };
                return (
                  <div key={s.id} className="flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-500 transition-all gap-4">
                     <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${curr.status === AttendanceStatus.H ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{s.name[0]}</div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[12px] sm:text-[14px] font-black uppercase truncate">{s.name}</p>
                           <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">{s.nis || '-'}</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                          {['H', 'S', 'I', 'T', 'A'].map(l => {
                            const status = l === 'H' ? AttendanceStatus.H : l === 'S' ? AttendanceStatus.S : l === 'I' ? AttendanceStatus.I : l === 'T' ? AttendanceStatus.T : AttendanceStatus.A;
                            const isActive = curr.status === status;
                            return (
                              <button 
                                key={l} 
                                onClick={() => setTempRecords({...tempRecords, [s.id]: { ...curr, status: status }})} 
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[10px] font-black transition-all ${isActive ? (status === AttendanceStatus.H ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {l}
                              </button>
                            );
                          })}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Ket..." 
                          value={curr.note}
                          onChange={e => setTempRecords({...tempRecords, [s.id]: { ...curr, note: e.target.value }})}
                          className="flex-1 min-w-[80px] px-3 py-3 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none"
                        />
                     </div>
                  </div>
                );
              })}
              {targetStudents.length === 0 && (
                <div className="py-24 text-center opacity-20">
                   <Users size={48} className="mx-auto"/>
                   <p className="mt-4 font-black uppercase text-[10px]">Santri tidak terdeteksi di Unit ini</p>
                </div>
              )}
           </div>

           <div className="p-6 sm:p-10 border-t bg-slate-50">
              <button disabled={targetStudents.length === 0} onClick={handleSave} className="w-full py-6 bg-emerald-950 text-white rounded-[2rem] font-black uppercase text-[12px] shadow-xl hover:bg-emerald-900 transition-all flex items-center justify-center gap-3">
                <CheckCircle size={18}/> Kirim Laporan Absensi
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
