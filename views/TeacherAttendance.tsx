
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Schedule, TeacherAttendance, AppData, UserProfile, UserRole, AttendanceStatus } from '../types.ts';
import { Camera, CheckCircle, Clock, Sparkles, X, MonitorCheck, Zap, Calendar, UserPlus, GraduationCap, Loader2, ChevronRight, History, Download, Eye, Ban, Search } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [visiblePhotoId, setVisiblePhotoId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter untuk Tab Cek Jadwal
  const [schDayFilter, setSchDayFilter] = useState('Semua');

  const todayDay = useMemo(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('id-ID'), []);
  const isIdaroh = profile.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const mySchedulesToday = useMemo(() => {
    return data.schedules.filter(s => 
      s.day === todayDay && (isIdaroh || isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName))
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [data.schedules, profile.fullName, todayDay, isIdaroh]);

  const allMySchedules = useMemo(() => {
    return data.schedules.filter(s => 
      (isIdaroh || isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName))
    ).filter(s => schDayFilter === 'Semua' || s.day === schDayFilter)
    .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time));
  }, [data.schedules, profile.fullName, isIdaroh, schDayFilter]);

  const teacherLogHistory = useMemo(() => {
    const list = data.teacherAttendance || [];
    if (isIdaroh) return [...list].sort((a,b) => b.date.localeCompare(a.date));
    return list.filter(ta => ta.teacherEmail === profile.email).sort((a,b) => b.date.localeCompare(a.date));
  }, [data.teacherAttendance, profile.email, isIdaroh]);

  const startCamera = async () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setIsCameraLoading(false); };
      }
    } catch (err) { alert("Akses kamera ditolak."); setShowCamera(false); }
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
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleCheckIn = (sch: Schedule) => {
    if (!capturedPhoto) { alert("Wajib lampirkan foto."); return; }
    const record: TeacherAttendance = {
      id: `ta-${Date.now()}`,
      date: todayDateStr,
      teacherEmail: isIdaroh ? `idaroh-${Date.now()}@mahasina.com` : profile.email,
      teacherName: isIdaroh ? sch.teacherName : profile.fullName,
      subject: sch.subject,
      class: sch.class,
      sessionType: sch.sessionType,
      startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      photoUrl: capturedPhoto,
      summary: `Presensi digital ${sch.sessionType}`
    };
    onSave(record);
    alert("Berhasil!");
    setCapturedPhoto(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 pb-20 max-w-6xl mx-auto px-2">
      <div className="flex bg-white p-2 rounded-[2rem] shadow-sm border overflow-x-auto no-scrollbar gap-2">
         {[
           { id: 'absen', label: 'Absen Hari Ini', icon: <MonitorCheck size={18}/> },
           { id: 'jadwal', label: 'Cek Jadwal', icon: <Calendar size={18}/> },
           { id: 'histori', label: 'Histori Saya', icon: <History size={18}/> },
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-4 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      {activeSubTab === 'absen' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jadwal Aktif ({todayDay})</h3>
              {isIdaroh && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">IDAROH MODE</span>}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mySchedulesToday.map(sch => {
                const isDone = data.teacherAttendance.some(ta => ta.date === todayDateStr && ta.subject === sch.subject && ta.class === sch.class && isTeacherMatch(profile.fullName, ta.teacherName));
                return (
                  <div key={sch.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between gap-6 hover:border-emerald-500 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                           <CheckCircle size={28}/>
                        </div>
                        <div className="min-w-0 flex-1">
                           <h4 className="text-lg font-black uppercase text-slate-800 truncate">{sch.subject}</h4>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">Unit {sch.class} • {sch.time}</p>
                        </div>
                     </div>
                     {!isDone ? (
                       <div className="space-y-3">
                          {capturedPhoto ? (
                            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl">
                               <img src={capturedPhoto} className="w-full h-full object-cover" />
                               <button onClick={() => setCapturedPhoto(null)} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl"><X size={14}/></button>
                            </div>
                          ) : (
                            <button onClick={startCamera} className="w-full py-4 bg-emerald-950 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2"><Camera size={16}/> Ambil Foto Bukti</button>
                          )}
                          <button disabled={!capturedPhoto} onClick={() => handleCheckIn(sch)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase disabled:opacity-30">Konfirmasi Hadir</button>
                       </div>
                     ) : (
                       <div className="py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
                          <CheckCircle size={16}/> Selesai Absen
                       </div>
                     )}
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {activeSubTab === 'jadwal' && (
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 shrink-0">
                 <Calendar className="text-emerald-600"/>
                 <h3 className="text-sm font-black uppercase text-slate-800">Cek Jadwal Mingguan</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
                 {['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                   <button key={day} onClick={() => setSchDayFilter(day)} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${schDayFilter === day ? 'bg-emerald-900 text-white' : 'bg-slate-50 text-slate-400 border-transparent'}`}>
                      {day}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMySchedules.map(sch => (
                <div key={sch.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:border-blue-500 transition-all">
                   <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase leading-none">{sch.subject}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{sch.day} • {sch.time}</p>
                      <p className="text-[9px] font-black text-blue-600 mt-1 uppercase">Unit {sch.class}</p>
                   </div>
                   <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-500 transition-all"/>
                </div>
              ))}
              {allMySchedules.length === 0 && (
                <div className="lg:col-span-3 py-20 text-center opacity-30 italic text-slate-400 uppercase text-[10px] font-black tracking-widest">Jadwal tidak ditemukan</div>
              )}
           </div>
        </div>
      )}

      {activeSubTab === 'histori' && (
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm overflow-hidden">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b-2 border-slate-50">
                       <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Mapel / Unit</th>
                       <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Waktu</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400">Bukti</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {teacherLogHistory.map(ta => (
                      <tr key={ta.id}>
                         <td className="py-5">
                            <p className="text-[11px] font-black text-slate-800 uppercase">{ta.subject}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Unit {ta.class}</p>
                         </td>
                         <td className="py-5">
                            <p className="text-[10px] font-black text-slate-700">{ta.date}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{ta.startTime}</p>
                         </td>
                         <td className="py-5 text-center">
                            <button onClick={() => setVisiblePhotoId(ta.id)} className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-emerald-600"><Eye size={16}/></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-8 space-y-6">
              <h3 className="text-sm font-black uppercase text-slate-800">Ambil Foto Presensi</h3>
              <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden">
                 {isCameraLoading && <div className="flex flex-col items-center justify-center h-full text-white"><Loader2 className="animate-spin mb-2"/> Menyiapkan Lensa...</div>}
                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
              </div>
              <button onClick={takePhoto} className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px]">Ambil Foto</button>
              <button onClick={stopCamera} className="w-full py-3 text-slate-400 font-bold uppercase text-[9px]">Batal</button>
           </div>
        </div>
      )}

      {visiblePhotoId && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-10" onClick={() => setVisiblePhotoId(null)}>
           <img src={teacherLogHistory.find(ta => ta.id === visiblePhotoId)?.photoUrl} className="max-w-full max-h-full rounded-3xl shadow-2xl animate-in zoom-in-95" />
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceView;
