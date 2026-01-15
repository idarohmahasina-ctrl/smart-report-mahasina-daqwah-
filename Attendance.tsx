
import React, { useState, useMemo } from 'react';
import { AttendanceStatus, Student, UserRole, Schedule, AppData } from './types.ts';
import { UserCheck, CheckCircle, Search, Save, X, Edit3, PlusCircle, Calendar, UserPlus, Ban } from 'lucide-react';
import { isTeacherMatch } from './views/utils/nameMatchers.ts';

const Attendance: React.FC<AppData & { role: UserRole, currentUser: string, onSave: any }> = (data) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const schedules = data.schedules || [];
  const students = data.students || [];
  const config = data.academicConfig;

  const isGenderRestricted = data.role === UserRole.SANTRI_OFFICER_PUTRA || data.role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = data.role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const isHoliday = (cls: string, sess: string) => {
    if (config?.excludedClasses?.[cls]) return true;
    if (config?.excludedSessions?.[sess]) return true;
    if (config?.sessionClassExclusions?.[sess]?.[cls]) return true;
    return false;
  };

  const mySchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchTeacher = isTeacherMatch(data.currentUser, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName);
      const matchGender = !isGenderRestricted || s.gender === targetGender;
      return matchTeacher && matchGender;
    });
  }, [schedules, data.currentUser, isGenderRestricted, targetGender]);

  const targetStudents = useMemo(() => {
    if (!selectedSchedule) return [];
    return students
      .filter(s => {
        const matchGender = !isGenderRestricted || s.gender === targetGender;
        const matchClass = selectedSchedule.sessionType === 'Madrasah' 
          ? s.formalClass === selectedSchedule.class 
          : s.sessionClasses?.[selectedSchedule.sessionType] === selectedSchedule.class;
        return matchGender && matchClass;
      })
      .filter(s => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedSchedule, students, searchTerm, isGenderRestricted, targetGender]);

  const handleSave = () => {
    const records = targetStudents.map(s => ({
      id: `att-${Date.now()}-${s.id}`,
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      studentId: s.id,
      status: tempRecords[s.id]?.status || AttendanceStatus.H,
      note: tempRecords[s.id]?.note || '',
      recordedBy: data.currentUser,
      class: selectedSchedule?.class || 'Umum',
      sessionType: selectedSchedule?.sessionType || 'Madrasah'
    }));
    data.onSave(records);
    alert("Absensi KBM Berhasil Disimpan!");
    setSelectedSchedule(null);
    setTempRecords({});
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
      {!selectedSchedule ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Jadwal Absensi KBM</h3>
             <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
               {isGenderRestricted ? `Hanya Menampilkan Jadwal Santri ${targetGender}` : 'Menampilkan Jadwal Anda (Termasuk Walas/Asisten)'}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySchedules.map(sch => {
              const holiday = isHoliday(sch.class, sch.sessionType);
              return (
                <button 
                  key={sch.id} 
                  disabled={holiday}
                  onClick={() => setSelectedSchedule(sch)} 
                  className={`p-8 bg-white border-2 rounded-[3rem] text-left transition-all group relative overflow-hidden ${holiday ? 'opacity-50 border-orange-100 bg-orange-50/30 cursor-not-allowed' : 'border-transparent hover:border-emerald-600 hover:shadow-xl'}`}
                >
                   {holiday && (
                     <div className="absolute top-4 right-4 flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                        <Ban size={10}/> Libur
                     </div>
                   )}
                   <div className="flex items-center gap-2">
                     <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${holiday ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>{sch.sessionType}</span>
                   </div>
                   <h4 className={`text-lg font-black uppercase mt-4 ${holiday ? 'text-slate-400' : 'text-slate-800'}`}>{sch.subject}</h4>
                   <div className="mt-6 flex justify-between">
                      <p className={`text-xs font-black ${holiday ? 'text-slate-400' : 'text-slate-700'}`}>Kelas: {sch.class}</p>
                      <p className={`text-xs font-black ${holiday ? 'text-slate-400' : 'text-slate-700'}`}>{sch.time}</p>
                   </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden">
           <div className="p-10 bg-[#064e3b] text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase">{selectedSchedule.subject} - {selectedSchedule.class}</h3>
              <button onClick={() => setSelectedSchedule(null)} className="p-4 bg-white/10 rounded-2xl"><X/></button>
           </div>
           
           <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
              {targetStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs">{s.name[0]}</div>
                      <p className="text-sm font-black uppercase">{s.name}</p>
                   </div>
                   <div className="flex gap-2">
                      {['H', 'S', 'I', 'T', 'A'].map(l => {
                        const sStatus = l === 'H' ? AttendanceStatus.H : l === 'S' ? AttendanceStatus.S : l === 'I' ? AttendanceStatus.I : l === 'T' ? AttendanceStatus.T : AttendanceStatus.A;
                        return (
                          <button 
                            key={l} 
                            onClick={() => setTempRecords({...tempRecords, [s.id]: { status: sStatus, note: '' }})} 
                            className={`w-10 h-10 rounded-xl text-[10px] font-black ${ (tempRecords[s.id]?.status || AttendanceStatus.H) === sStatus ? 'bg-[#064e3b] text-white' : 'bg-white text-slate-300' }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                   </div>
                </div>
              ))}
           </div>

           <div className="p-10 border-t">
              <button onClick={handleSave} className="w-full py-6 bg-[#064e3b] text-white rounded-3xl font-black uppercase text-[12px] shadow-xl">Simpan Absensi KBM</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
