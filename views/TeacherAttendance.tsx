
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Schedule, TeacherAttendance, AppData, UserProfile, UserRole 
} from '../types.ts';
import { 
  Camera, CheckCircle, Clock, AlertTriangle, Sparkles, X, 
  MonitorCheck, RefreshCw, Zap, Calendar, UserPlus
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const todayDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  const now = new Date();

  // MENDUKUNG GURU UTAMA MAUPUN ASISTEN
  const mySchedules = useMemo(() => {
    return data.schedules.filter(s => 
      s.day === todayDay && isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName)
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [data.schedules, profile.fullName, todayDay]);

  useEffect(() => {
    const fetchAiGreeting = async () => {
      if (!process.env.API_KEY || mySchedules.length === 0) {
        setAiGreeting(`Ahlan, ${profile.fullName}. Selamat berkhidmah di Mahasina hari ini.`);
        return;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const schedulesStr = mySchedules.map(s => `${s.subject} di kelas ${s.class}`).join(", ");
        
        const prompt = `Anda adalah asisten cerdas Pesantren Mahasina. 
        Pengajar: ${profile.fullName}. Jadwal hari ini (${todayDay}): ${schedulesStr}. 
        Sapa mereka dengan hangat dan sebutkan jadwalnya. Jika mereka adalah asisten di suatu kelas, beri semangat ekstra. Maks 3 kalimat.`;

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
  }, [mySchedules, profile.fullName, todayDay]);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Gagal mengakses kamera.");
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleCheckIn = (sch: Schedule) => {
    if (!capturedPhoto) { alert("Wajib lampirkan foto."); return; }

    const checkInTime = new Date();
    const amIAssistant = isTeacherMatch(profile.fullName, sch.assistantTeacherName || "");

    const record: TeacherAttendance = {
      id: `ta-${Date.now()}`,
      date: checkInTime.toLocaleDateString('id-ID'),
      teacherEmail: profile.email,
      teacherName: profile.fullName,
      subject: sch.subject,
      class: sch.class,
      startTime: checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      photoUrl: capturedPhoto,
      summary: `Hadir sebagai ${amIAssistant ? 'Asisten' : 'Guru Utama'} di kelas ${sch.class}`
    };

    onSave(record);
    alert(`Absen ${amIAssistant ? 'Asisten' : 'Guru'} Berhasil!`);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 pb-20 max-w-4xl mx-auto">
      <div className="bg-[#064e3b] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex gap-6 items-start">
           <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xl animate-pulse"><Sparkles size={28} /></div>
           <div className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Asisten Jadwal Mahasina</h2>
              <p className="text-lg font-medium italic leading-relaxed text-emerald-50">"{aiGreeting}"</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {mySchedules.length > 0 ? mySchedules.map(sch => {
          const status = checkScheduleStatus(sch.time);
          const isDone = data.teacherAttendance.some(ta => ta.date === now.toLocaleDateString('id-ID') && ta.subject === sch.subject && ta.class === sch.class && ta.teacherName === profile.fullName);
          const amIAssistant = isTeacherMatch(profile.fullName, sch.assistantTeacherName || "");

          return (
            <div key={sch.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 ${isDone ? 'opacity-60' : ''}`}>
               <div className="flex items-center gap-6 flex-1 w-full">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner ${amIAssistant ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                     {amIAssistant ? <UserPlus size={32}/> : <MonitorCheck size={32}/>}
                  </div>
                  <div>
                     <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{sch.subject}</h3>
                        {amIAssistant && <span className="px-2 py-0.5 bg-indigo-100 text-[9px] font-black text-indigo-600 rounded uppercase">Asisten</span>}
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">UNIT: {sch.class} • {sch.time}</p>
                     {!amIAssistant && sch.assistantTeacherName && (
                        <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Asisten: {sch.assistantTeacherName}</p>
                     )}
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

      {showCamera && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] overflow-hidden w-full max-w-lg space-y-6 p-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest">Absen Pengajar</h3>
                 <button onClick={stopCamera} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X/></button>
              </div>
              <div className="relative aspect-[4/3] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <button onClick={takePhoto} className="w-full py-5 bg-emerald-800 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3"><Camera size={20}/> Ambil Foto</button>
              <canvas ref={canvasRef} className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceView;
