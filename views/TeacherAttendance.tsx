
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Schedule, TeacherAttendance, AppData, UserProfile, UserRole, AttendanceStatus, AttendanceRecord } from '../types.ts';
import { Camera, CheckCircle, Clock, Sparkles, X, MonitorCheck, Zap, Calendar, UserPlus, GraduationCap, Loader2, ChevronRight, History, Download, Eye, Ban, Search, Filter, AlertCircle, Info, RefreshCw, Coffee, ChevronDown } from 'lucide-react';
import { isTeacherMatch } from './utils/nameMatchers.ts';
import { downloadCSV } from './utils/csvExport.ts';

interface Props {
  data: AppData;
  profile: UserProfile;
  onSave: (teacherRecord: TeacherAttendance, kbmHolidayRecord?: AttendanceRecord) => void;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const TeacherAttendanceView: React.FC<Props> = ({ data, profile, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'absen' | 'jadwal' | 'histori'>('absen');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>(new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()));
  const [showHolidayDialog, setShowHolidayDialog] = useState<Schedule | null>(null);
  const [holidayNote, setHolidayNote] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normalizeDay = (day: string) => day.toLowerCase().replace(/['`]/g, '').trim();
  const todayDay = useMemo(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('id-ID'), []);
  const isIdaroh = profile.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const mySchedulesToday = useMemo(() => {
    return data.schedules.filter(s => {
      const matchDay = normalizeDay(s.day) === normalizeDay(todayDay) || (normalizeDay(todayDay) === 'minggu' && normalizeDay(s.day) === 'ahad');
      return matchDay && (isIdaroh || isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName));
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [data.schedules, profile.fullName, todayDay, isIdaroh]);

  const filteredJadwal = useMemo(() => {
    return data.schedules.filter(s => {
      const isAllDays = selectedDayFilter === 'Semua Hari';
      const matchDay = isAllDays || normalizeDay(s.day) === normalizeDay(selectedDayFilter) || (normalizeDay(selectedDayFilter) === 'minggu' && normalizeDay(s.day) === 'ahad');
      return matchDay && (isIdaroh || isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName));
    }).sort((a, b) => {
      if (selectedDayFilter === 'Semua Hari') {
        const dayOrder = DAYS.indexOf(a.day);
        const nextDayOrder = DAYS.indexOf(b.day);
        if (dayOrder !== nextDayOrder) return dayOrder - nextDayOrder;
      }
      return a.time.localeCompare(b.time);
    });
  }, [data.schedules, profile.fullName, selectedDayFilter, isIdaroh]);

  const startCamera = () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
      .then(stream => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setIsCameraLoading(false); }; } })
      .catch(() => { alert("Akses kamera ditolak."); setShowCamera(false); });
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleCheckIn = (sch: Schedule, status: AttendanceStatus) => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const record: TeacherAttendance = { 
        id: `ta-${Date.now()}`, 
        date: todayDateStr, 
        teacherEmail: profile.email, 
        teacherName: profile.fullName, // Selalu merekam nama orang yang login
        subject: sch.subject, 
        class: sch.class, 
        sessionType: sch.sessionType, 
        status, 
        startTime: timestamp, 
        photoUrl: capturedPhoto || "", 
        summary: summaryText || `Laporan presensi ${status} oleh ${profile.fullName}` 
    };
    onSave(record);
    alert(`Laporan ${status} Berhasil Dikirim!`);
    setCapturedPhoto(null);
    setSummaryText('');
  };

  const handleLiburkanSesi = () => {
    if (!showHolidayDialog || !holidayNote.trim()) { alert("Mohon isi alasan meliburkan sesi ini."); return; }
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const teacherRecord: TeacherAttendance = {
      id: `ta-hol-${Date.now()}`,
      date: todayDateStr,
      teacherEmail: profile.email,
      teacherName: profile.fullName,
      subject: showHolidayDialog.subject,
      class: showHolidayDialog.class,
      sessionType: showHolidayDialog.sessionType,
      status: AttendanceStatus.LIBUR,
      startTime: timestamp,
      photoUrl: "",
      summary: `Diliburkan oleh: ${profile.fullName}. Alasan: ${holidayNote}`
    };

    const kbmRecord: AttendanceRecord = {
      id: `att-hol-${Date.now()}`,
      date: todayDateStr,
      time: timestamp,
      studentId: "CLASS_WIDE_HOLIDAY",
      status: AttendanceStatus.LIBUR,
      note: holidayNote,
      recordedBy: profile.fullName, // Audit: Siapa yang meliburkan kelas
      class: showHolidayDialog.class,
      sessionType: showHolidayDialog.sessionType
    };

    onSave(teacherRecord, kbmRecord);
    alert(`Sesi ${showHolidayDialog.subject} telah ditandai sebagai LIBUR.`);
    setShowHolidayDialog(null);
    setHolidayNote('');
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto px-2">
      <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border overflow-x-auto no-scrollbar gap-2">
         {[{ id: 'absen', label: 'Absen Hari Ini', icon: <MonitorCheck size={18}/> }, { id: 'jadwal', label: 'Cek Jadwal', icon: <Calendar size={18}/> }, { id: 'histori', label: 'Histori Laporan', icon: <History size={18}/> }].map(tab => (
           <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeSubTab === tab.id ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{tab.icon} {tab.label}</button>
         ))}
      </div>

      {activeSubTab === 'absen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {mySchedulesToday.map(sch => {
              const existingLog = data.teacherAttendance.find(ta => ta.date === todayDateStr && ta.subject === sch.subject && ta.class === sch.class && (isIdaroh || isTeacherMatch(profile.fullName, ta.teacherName)));
              return (
                <div key={sch.id} className="bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${existingLog ? (existingLog.status === AttendanceStatus.LIBUR ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-50 text-slate-300'}`}>
                          {existingLog ? (existingLog.status === AttendanceStatus.LIBUR ? <Coffee size={32}/> : <CheckCircle size={32}/>) : <Clock size={32}/>}
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase text-slate-800 truncate max-w-[180px]">{sch.subject}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">KELAS {sch.class} • {sch.time}</p>
                        </div>
                      </div>
                      {!existingLog && (
                        <button onClick={() => setShowHolidayDialog(sch)} className="p-4 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                           <Coffee size={20}/>
                        </button>
                      )}
                   </div>
                   
                   {existingLog ? (
                     <div className={`py-5 rounded-[2rem] text-[11px] font-black uppercase text-center flex items-center justify-center gap-3 ${existingLog.status === AttendanceStatus.LIBUR ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {existingLog.status === AttendanceStatus.LIBUR ? <Coffee size={20}/> : <CheckCircle size={20}/>}
                        Sudah Dilaporkan ({existingLog.status})
                     </div>
                   ) : (
                     <div className="space-y-6">
                        {capturedPhoto ? (
                            <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-emerald-500 shadow-xl">
                                <img src={capturedPhoto} className="w-full h-full object-cover"/>
                                <button onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-2xl"><X size={16}/></button>
                            </div>
                        ) : (
                            <button onClick={startCamera} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all">
                                <Camera size={20}/> Lampirkan Foto (Audit Visual)
                            </button>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleCheckIn(sch, AttendanceStatus.H)} className="py-5 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700">Hadir</button>
                            <button onClick={() => handleCheckIn(sch, AttendanceStatus.S)} className="py-5 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase shadow-lg hover:bg-blue-700">Sakit</button>
                            <button onClick={() => handleCheckIn(sch, AttendanceStatus.I)} className="py-5 bg-amber-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase shadow-lg hover:bg-amber-700">Izin</button>
                        </div>
                     </div>
                   )}
                </div>
              );
           })}
        </div>
      )}

      {activeSubTab === 'jadwal' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center"><Filter size={20}/></div>
                 <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">Audit Jadwal</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Plotting KBM untuk verifikasi lapangan</p>
                 </div>
              </div>
              <div className="relative w-full sm:w-64">
                <select value={selectedDayFilter} onChange={e => setSelectedDayFilter(e.target.value)} className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest shadow-inner appearance-none cursor-pointer transition-all">
                  <option value="Semua Hari">Semua Hari</option>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJadwal.map(sch => (
                <div key={sch.id} className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6 group hover:border-emerald-600 transition-all">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-black uppercase">{sch.sessionType}</span>
                        {selectedDayFilter === 'Semua Hari' && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase">{sch.day}</span>}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-emerald-500">{sch.time}</span>
                   </div>
                   <div>
                      <h4 className="text-lg font-black uppercase text-slate-800 leading-tight">{sch.subject}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">KELAS {sch.class}</p>
                   </div>
                   <div className="pt-6 border-t border-slate-50 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><UserPlus size={12}/> {sch.teacherName}</p>
                      {sch.assistantTeacherName && <p className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-2"><GraduationCap size={12}/> Asisten: {sch.assistantTeacherName}</p>}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Holiday Dialog */}
      {showHolidayDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tight text-orange-600">Audit Libur KBM</h3><button onClick={() => setShowHolidayDialog(null)} className="p-3 bg-slate-100 rounded-xl text-slate-400"><X/></button></div>
              <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 text-orange-800">
                 <Coffee size={24}/>
                 <p className="text-[10px] font-bold uppercase leading-relaxed">Pencatatan libur ini akan direkam atas nama: <span className="font-black">"{profile.fullName}"</span></p>
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Meliburkan (Wajib)</label>
                 <textarea value={holidayNote} onChange={e => setHolidayNote(e.target.value)} placeholder="Contoh: Ustadz Izin, Ada Acara Pesantren, dll..." className="w-full p-5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm min-h-[120px] shadow-inner focus:border-orange-500 transition-all"/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowHolidayDialog(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px]">Batal</button>
                 <button onClick={handleLiburkanSesi} className="flex-1 py-5 bg-orange-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl">Ya, Liburkan</button>
              </div>
           </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Kamera Presensi Audit</h3><button onClick={stopCamera} className="p-3 bg-slate-100 rounded-2xl text-slate-400"><X/></button></div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden">
                {isCameraLoading && <div className="flex flex-col items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mb-4" size={32}/></div>}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraLoading ? 'opacity-0' : 'opacity-100'}`}/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { setFacingMode(facingMode === 'user' ? 'environment' : 'user'); stopCamera(); setTimeout(startCamera, 100); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] flex items-center justify-center gap-2">
                    <RefreshCw size={16}/> Ganti Kamera
                 </button>
                 <button onClick={takePhoto} className="flex-[2] py-5 bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-xl">Ambil Foto</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceView;
