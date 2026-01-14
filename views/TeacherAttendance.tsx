
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Schedule, TeacherAttendance, AppData, UserProfile, UserRole, AttendanceStatus 
} from '../types.ts';
import { 
  Camera, CheckCircle, Clock, AlertTriangle, Sparkles, X, 
  MonitorCheck, RefreshCw, Zap, Calendar, UserPlus, GraduationCap, Loader2, ChevronRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { isTeacherMatch } from './utils/nameMatchers.ts';

interface Props {
  data: AppData;
  profile: UserProfile;
  onSave: (record: TeacherAttendance) => void;
}

const TeacherAttendanceView: React.FC<Props> = ({ data, profile, onSave }) => {
  const [aiGreeting, setAiGreeting] = useState<string>("Sedang menyiapkan asisten jadwal...");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const todayDay = useMemo(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('id-ID'), []);
  const now = new Date();

  const mySchedules = useMemo(() => {
    return data.schedules.filter(s => 
      s.day === todayDay && isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName)
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [data.schedules, profile.fullName, todayDay]);

  useEffect(() => {
    const fetchAiGreeting = async () => {
      if (!process.env.API_KEY) {
        setAiGreeting(`Ahlan, ${profile.fullName}. Selamat berkhidmah di Mahasina hari ini.`);
        return;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const reportedToday = data.attendance.filter(a => a.date === todayDateStr);
        const prompt = `Analisis singkat Pesantren Mahasina (${todayDateStr}):
        - Santri Hadir KBM: ${reportedToday.filter(a => a.status === AttendanceStatus.H).length}
        - Laporan Pelanggaran Hari Ini: ${data.reports.filter(r => r.date === todayDateStr && r.type === 'Violation').length}
        - Nama Ustadz/ah: ${profile.fullName}.
        Berikan 1 kalimat motivasi Islami singkat dan 1 pengingat tugas kehadiran. Maks 2 kalimat.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiGreeting(response.text || "Semoga harimu diberkahi Allah.");
      } catch (e) {
        setAiGreeting("Semoga hari ini penuh berkah dalam mengajar para santri.");
      }
    };
    fetchAiGreeting();
  }, [mySchedules, profile.fullName, todayDay, data.attendance, data.reports, todayDateStr]);

  const startCamera = async () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    try {
      const constraints = { 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsCameraLoading(false);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Gagal mengakses kamera.");
      setShowCamera(false);
      setIsCameraLoading(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleCheckIn = (sch: Schedule) => {
    if (!capturedPhoto) { alert("Wajib lampirkan foto."); return; }
    const checkInTime = new Date();
    const isAssistant = isTeacherMatch(profile.fullName, sch.assistantTeacherName || "");
    const isHomeroom = isTeacherMatch(profile.fullName, sch.homeroomTeacherName || "");
    let roleLabel = isHomeroom ? 'Wali Kelas' : (isAssistant ? 'Asisten' : 'Guru Utama');

    const record: TeacherAttendance = {
      id: `ta-${Date.now()}`,
      date: checkInTime.toLocaleDateString('id-ID'),
      teacherEmail: profile.email,
      teacherName: profile.fullName,
      subject: sch.subject,
      class: sch.class,
      startTime: checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      photoUrl: capturedPhoto,
      summary: `Hadir sebagai ${roleLabel} di kelas ${sch.class}`
    };
    onSave(record);
    alert(`Absen ${roleLabel} Berhasil!`);
    setCapturedPhoto(null);
  };

  const checkScheduleStatus = (timeRange: string) => {
    const [start] = timeRange.split(' - ');
    const [h, m] = start.split(':').map(Number);
    const schDate = new Date();
    schDate.setHours(h, m, 0, 0);
    const diff = (new Date().getTime() - schDate.getTime()) / (1000 * 60);
    if (diff > 120) return 'expired';
    if (diff < -60) return 'too-early';
    return 'ready';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 pb-20 max-w-6xl mx-auto">
      {/* Banner Analisis MahaAI (Pindah dari Dashboard) */}
      <div className="bg-[#064e3b] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex gap-6 items-start">
           <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xl animate-pulse"><Sparkles size={28} /></div>
           <div className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Analisis MahaAI Live</h2>
              <p className="text-lg font-medium italic leading-relaxed text-emerald-50">"{aiGreeting}"</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-4">Menu Absensi Anda</h3>
          {mySchedules.length > 0 ? mySchedules.map(sch => {
            const status = checkScheduleStatus(sch.time);
            const isDone = data.teacherAttendance.some(ta => ta.date === now.toLocaleDateString('id-ID') && ta.subject === sch.subject && ta.class === sch.class && ta.teacherName === profile.fullName);
            const isAssistant = isTeacherMatch(profile.fullName, sch.assistantTeacherName || "");
            const isHomeroom = isTeacherMatch(profile.fullName, sch.homeroomTeacherName || "");

            return (
              <div key={sch.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 ${isDone ? 'opacity-60' : ''}`}>
                 <div className="flex items-center gap-6 flex-1 w-full">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${isHomeroom ? 'bg-blue-50 text-blue-700' : isAssistant ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                       {isHomeroom ? <GraduationCap size={32}/> : isAssistant ? <UserPlus size={32}/> : <MonitorCheck size={32}/>}
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{sch.subject}</h3>
                          {isHomeroom && <span className="px-2 py-0.5 bg-blue-100 text-[9px] font-black text-blue-600 rounded uppercase">Walas</span>}
                          {isAssistant && !isHomeroom && <span className="px-2 py-0.5 bg-indigo-100 text-[9px] font-black text-indigo-600 rounded uppercase">Asisten</span>}
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">UNIT: {sch.class} • {sch.time}</p>
                    </div>
                 </div>

                 {isDone ? (
                   <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl"><CheckCircle size={16}/> Terabsen</div>
                 ) : status === 'ready' ? (
                   <div className="flex flex-col gap-3 w-full md:w-auto">
                      {capturedPhoto ? (
                        <div className="relative w-full md:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg">
                          <img src={capturedPhoto} className="w-full h-full object-cover" />
                          <button onClick={() => setCapturedPhoto(null)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg"><X size={14}/></button>
                        </div>
                      ) : (
                        <button onClick={startCamera} className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all"><Camera size={18}/> Foto Bukti</button>
                      )}
                      <button disabled={!capturedPhoto} onClick={() => handleCheckIn(sch)} className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all disabled:opacity-30"><Zap size={18}/> Konfirmasi</button>
                   </div>
                 ) : (
                   <div className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-6 py-3 rounded-xl">{status === 'too-early' ? 'Belum Waktunya' : 'Sesi Berakhir'}</div>
                 )}
              </div>
            );
          }) : (
            <div className="bg-white p-20 rounded-[4rem] text-center space-y-4 border border-dashed border-slate-300">
               <Calendar size={64} className="mx-auto text-slate-200" />
               <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Tidak ada jadwal untuk Anda hari ini</p>
            </div>
          )}
        </div>

        {/* Kolom Jadwal Mengajar (Pindah dari Dashboard) */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Clock size={18} className="text-emerald-600"/> Jadwal KBM Hari Ini</h3>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">{todayDay}</span>
           </div>
           <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {mySchedules.length > 0 ? mySchedules.map(sch => (
                <div key={sch.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer">
                   <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase truncate">{sch.subject}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">KELAS {sch.class} • {sch.time}</p>
                   </div>
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0"/>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30">
                   <Calendar size={32} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase mt-4">Jadwal tidak ditemukan</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] overflow-hidden w-full max-w-lg space-y-6 p-8 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest">Absen Pengajar</h3>
                 <button onClick={stopCamera} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all"><X/></button>
              </div>
              <div className="relative aspect-[4/3] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex items-center justify-center">
                 {isCameraLoading && <div className="flex flex-col items-center gap-4 text-emerald-400 font-black uppercase text-[10px] tracking-widest"><Loader2 className="animate-spin" size={32}/> Menyiapkan Kamera...</div>}
                 <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraLoading ? 'hidden' : 'block'}`} />
              </div>
              <button onClick={takePhoto} disabled={isCameraLoading} className="w-full py-5 bg-emerald-800 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"><Camera size={20}/> Ambil Foto</button>
              <canvas ref={canvasRef} className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceView;
