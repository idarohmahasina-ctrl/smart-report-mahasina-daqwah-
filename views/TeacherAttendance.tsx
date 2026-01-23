
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Schedule, TeacherAttendance, AppData, UserProfile, UserRole, AttendanceStatus } from '../types.ts';
import { Camera, CheckCircle, Clock, Sparkles, X, MonitorCheck, Zap, Calendar, UserPlus, GraduationCap, Loader2, ChevronRight, History, Download, Eye, Ban, Search, Filter, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { isTeacherMatch } from './utils/nameMatchers.ts';
import { downloadCSV } from './utils/csvExport.ts';

interface Props {
  data: AppData;
  profile: UserProfile;
  onSave: (record: TeacherAttendance) => void;
}

const TeacherAttendanceView: React.FC<Props> = ({ data, profile, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'absen' | 'jadwal' | 'histori'>('absen');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [visiblePhotoId, setVisiblePhotoId] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState('');
  
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

  const teacherLogHistory = useMemo(() => {
    const list = data.teacherAttendance || [];
    if (isIdaroh) return [...list].sort((a,b) => b.date.localeCompare(a.date));
    return list.filter(ta => ta.teacherEmail === profile.email).sort((a,b) => b.date.localeCompare(a.date));
  }, [data.teacherAttendance, profile.email, isIdaroh]);

  const startCamera = () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setIsCameraLoading(false); };
        }
      })
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
    if (!capturedPhoto) { alert("Wajib melampirkan foto bukti."); return; }
    const record: TeacherAttendance = { id: `ta-${Date.now()}`, date: todayDateStr, teacherEmail: isIdaroh ? `idaroh-${Date.now()}@mahasina.com` : profile.email, teacherName: isIdaroh ? sch.teacherName : profile.fullName, subject: sch.subject, class: sch.class, sessionType: sch.sessionType, status, startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), photoUrl: capturedPhoto, summary: summaryText || `Laporan presensi ${status}` };
    onSave(record);
    alert(`Laporan ${status} Berhasil Dikirim!`);
    setCapturedPhoto(null);
    setSummaryText('');
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
                   <div className="flex items-center gap-5"><div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${existingLog ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>{existingLog ? <CheckCircle size={32}/> : <Clock size={32}/>}</div><div><h4 className="text-xl font-black uppercase text-slate-800 truncate">{sch.subject}</h4><p className="text-[10px] font-bold text-slate-400 mt-2">UNIT {sch.class} • {sch.time}</p></div></div>
                   {existingLog && !isIdaroh ? (
                     <div className="py-5 bg-emerald-50 text-emerald-700 rounded-[2rem] text-[11px] font-black uppercase text-center flex items-center justify-center gap-3"><CheckCircle size={20}/> Sudah Dilaporkan ({existingLog.status})</div>
                   ) : (
                     <div className="space-y-6">
                        {capturedPhoto ? <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-emerald-500 shadow-xl"><img src={capturedPhoto} className="w-full h-full object-cover"/><button onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-2xl"><X size={16}/></button></div> : <button onClick={startCamera} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 shadow-xl"><Camera size={20}/> Lampirkan Foto Bukti</button>}
                        <div className="grid grid-cols-3 gap-3"><button disabled={!capturedPhoto} onClick={() => handleCheckIn(sch, AttendanceStatus.H)} className="py-5 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase">Hadir</button><button disabled={!capturedPhoto} onClick={() => handleCheckIn(sch, AttendanceStatus.S)} className="py-5 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase">Sakit</button><button disabled={!capturedPhoto} onClick={() => handleCheckIn(sch, AttendanceStatus.I)} className="py-5 bg-amber-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase">Izin</button></div>
                     </div>
                   )}
                </div>
              );
           })}
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase text-slate-800">Kamera Presensi</h3><button onClick={stopCamera} className="p-3 bg-slate-100 rounded-2xl"><X/></button></div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden">{isCameraLoading && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-white"/></div>}<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/></div>
              <div className="flex gap-4">
                 <button onClick={() => { setFacingMode(facingMode === 'user' ? 'environment' : 'user'); stopCamera(); setTimeout(startCamera, 100); }} className="flex-1 py-5 bg-slate-50 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] flex items-center justify-center gap-2"><RefreshCw size={18}/> Ganti Kamera</button>
                 <button onClick={takePhoto} className="flex-[2] py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase text-[12px] shadow-xl">Ambil Foto</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceView;
