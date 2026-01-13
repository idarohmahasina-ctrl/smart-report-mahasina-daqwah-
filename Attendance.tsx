
import React, { useState, useMemo } from 'react';
import { AttendanceStatus, Student, UserRole, Schedule, AppData } from './types.ts';
import { UserCheck, CheckCircle, Search, Save, X, Edit3, PlusCircle, Calendar } from 'lucide-react';
import { isTeacherMatch } from './views/utils/nameMatchers.ts';

const Attendance: React.FC<AppData & { role: UserRole, currentUser: string, onSave: any }> = (data) => {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [tempRecords, setTempRecords] = useState<Record<string, { status: AttendanceStatus, note: string }>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const schedules = data.schedules || [];
  const students = data.students || [];

  // FILTER OTOMATIS: Hanya ambil jadwal yang sesuai dengan nama guru yang login
  const mySchedules = useMemo(() => {
    return schedules.filter(s => isTeacherMatch(data.currentUser, s.teacherName));
  }, [schedules, data.currentUser]);

  const targetStudents = useMemo(() => {
    if (!selectedSchedule) return [];
    return students
      .filter(s => {
        // Jika sesi Madrasah, cek formalClass. Jika sesi lain, cek sessionClasses
        if (selectedSchedule.sessionType === 'Madrasah') {
          return s.formalClass === selectedSchedule.class;
        } else {
          return s.sessionClasses?.[selectedSchedule.sessionType] === selectedSchedule.class;
        }
      })
      .filter(s => (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedSchedule, students, searchTerm]);

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
    alert("Absensi Berhasil Disimpan!");
    setSelectedSchedule(null);
    setTempRecords({});
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20">
      {!selectedSchedule ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Jadwal Mengajar Anda</h3>
             <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Pilih kelas untuk memulai absensi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySchedules.length > 0 ? mySchedules.map(sch => (
              <button 
                key={sch.id} 
                onClick={() => setSelectedSchedule(sch)} 
                className="p-8 bg-white border-2 border-transparent rounded-[3rem] text-left hover:border-emerald-600 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar size={80} />
                 </div>
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">{sch.sessionType}</span>
                 <h4 className="text-lg font-black uppercase mt-4 text-slate-800 group-hover:text-emerald-700 transition-colors">{sch.subject}</h4>
                 <div className="mt-6 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Kelas</p>
                       <p className="text-xs font-black text-slate-700">{sch.class}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Waktu</p>
                       <p className="text-xs font-black text-slate-700">{sch.time}</p>
                    </div>
                 </div>
              </button>
            )) : (
              <div className="col-span-full py-20 bg-white rounded-[4rem] border border-dashed border-slate-300 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300"><Calendar size={32}/></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada jadwal ditemukan untuk nama: {data.currentUser}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="p-10 bg-[#064e3b] text-white flex justify-between items-center">
              <div>
                 <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{selectedSchedule.subject}</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">{selectedSchedule.sessionType}</span>
                 </div>
                 <p className="text-[10px] font-bold text-emerald-300 uppercase mt-2 tracking-widest">Unit: {selectedSchedule.class} • {selectedSchedule.time}</p>
              </div>
              <button onClick={() => { setSelectedSchedule(null); setTempRecords({}); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X/></button>
           </div>
           
           <div className="p-6 bg-slate-50 border-b border-slate-100">
              <div className="relative max-w-md mx-auto">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                 <input 
                   type="text" 
                   placeholder="Cari nama santri..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl outline-none text-xs font-bold border border-slate-200 focus:border-emerald-600 shadow-sm"
                 />
              </div>
           </div>

           <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
              {targetStudents.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 gap-6">
                   <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs shadow-inner text-slate-400 group-hover:text-emerald-700 transition-colors">{s.name ? s.name[0] : '?'}</div>
                      <div>
                         <p className="text-sm font-black uppercase text-slate-800 leading-none">{s.name}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{s.nis} • {s.gender}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      {[
                        { s: AttendanceStatus.H, l: 'H' }, 
                        { s: AttendanceStatus.S, l: 'S' }, 
                        { s: AttendanceStatus.I, l: 'I' }, 
                        { s: AttendanceStatus.T, l: 'T' }, 
                        { s: AttendanceStatus.A, l: 'A' }
                      ].map(opt => (
                        <button 
                          key={opt.l} 
                          onClick={() => setTempRecords({...tempRecords, [s.id]: { status: opt.s, note: '' }})} 
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${ (tempRecords[s.id]?.status || AttendanceStatus.H) === opt.s ? 'bg-[#064e3b] text-white shadow-lg' : 'bg-white text-slate-300 hover:bg-emerald-50' }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                   </div>
                </div>
              ))}
              {targetStudents.length === 0 && (
                 <div className="text-center py-20 opacity-30">
                    <Search size={40} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase mt-4">Santri tidak ditemukan</p>
                 </div>
              )}
           </div>

           <div className="p-10 border-t bg-slate-50/50">
              <button onClick={handleSave} className="w-full py-6 bg-[#064e3b] text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[12px] shadow-xl hover:bg-emerald-900 active:scale-95 transition-all">Selesaikan & Simpan Absensi</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
