
import React, { useState, useMemo, useRef } from 'react';
import { ReportItem, UserRole, ViolationCategory, Student, TemplateItem, Schedule } from '../../types.ts';
import { 
  Search, ShieldAlert, Trophy, History, PlusCircle, Send, ChevronRight, Clock as ClockIcon, 
  AlertTriangle, User, FileText, CheckCircle, Filter, Edit, Award, ArrowLeft, UserCheck, X, Camera, Image as ImageIcon,
  ImagePlus, Loader2
} from 'lucide-react';
import { isTeacherMatch } from './nameMatchers.ts';

interface ReportsProps {
  type: 'Violation' | 'Achievement';
  onSave: (report: ReportItem) => void;
  role: UserRole;
  currentUser: string;
  students: Student[];
  allReports: ReportItem[];
  templates: TemplateItem[];
  schedules: Schedule[]; 
}

const Reports: React.FC<ReportsProps> = ({ type, onSave, role, currentUser, students, allReports, templates, schedules }) => {
  const [viewMode, setViewMode] = useState<'input' | 'history'>('input');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [category, setCategory] = useState<ViolationCategory>(ViolationCategory.IBADAH);
  const [selectedRule, setSelectedRule] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [points, setPoints] = useState(0);
  const [actionNote, setActionNote] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH;
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';
  
  const myManagedClasses = useMemo(() => {
    if (isAdminOrPengasuh || isGenderRestricted) return []; 
    return Array.from(new Set(
      schedules
        .filter(s => isTeacherMatch(currentUser, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName))
        .map(s => s.class)
    ));
  }, [schedules, currentUser, isAdminOrPengasuh, isGenderRestricted]);

  const isClassRestricted = (role === UserRole.GURU || role === UserRole.MUSYRIF) && !isAdminOrPengasuh;

  const filteredStudents = useMemo(() => 
    students.filter(s => {
      const matchGender = !isGenderRestricted || s.gender === targetGender;
      const matchClass = !isClassRestricted || myManagedClasses.includes(s.formalClass);
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis && s.nis.includes(searchTerm));
      return matchGender && matchClass && matchSearch;
    })
  , [students, searchTerm, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const historyReports = useMemo(() => {
    return allReports.filter(r => {
      if (r.type !== type) return false;
      const s = students.find(std => std.id === r.studentId);
      if (!s) return false;
      if (isAdminOrPengasuh) return true;
      if (isGenderRestricted) return s.gender === targetGender;
      if (isClassRestricted) return myManagedClasses.includes(s.formalClass);
      return r.reporter === currentUser;
    });
  }, [allReports, type, currentUser, students, isGenderRestricted, targetGender, isAdminOrPengasuh, isClassRestricted, myManagedClasses]);

  const startCamera = async () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    try {
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
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
      alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      setShowCamera(false);
      setIsCameraLoading(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0, width, height);
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCapturedPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { alert("Pilih santri."); return; }
    
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudent.id,
      type,
      category,
      description: selectedRule === 'lainnya' ? incidentDescription : selectedRule,
      points: points || (templates.find(t => t.label === selectedRule)?.points || 0),
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reporter: currentUser,
      status: actionNote.trim() ? 'Ditindak' : 'Belum Ditindak',
      actionNote: actionNote.trim() || undefined,
      photoUrl: capturedPhoto || undefined
    });

    alert("Laporan berhasil terkirim!");
    setCapturedPhoto(null);
    setSelectedStudent(null);
    setSearchTerm('');
    setIncidentDescription('');
    setSelectedRule('');
    setPoints(0);
    setActionNote('');
    setViewMode('history');
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit mx-auto shadow-inner mb-10">
         <button onClick={() => setViewMode('input')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${viewMode === 'input' ? 'bg-white shadow-lg' : 'text-slate-400'}`}>Form Input</button>
         <button onClick={() => setViewMode('history')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${viewMode === 'history' ? 'bg-white shadow-lg' : 'text-slate-400'}`}>Daftar Laporan</button>
      </div>

      {viewMode === 'input' ? (
        <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-12">
           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Cari Santri</label>
                 <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22}/>
                    <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }} placeholder="Ketik nama atau NIS..." className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-[2rem] outline-none font-black text-sm shadow-inner" />
                    {searchTerm && !selectedStudent && (
                      <div className="absolute z-50 w-full mt-3 bg-white border rounded-[2rem] shadow-2xl max-h-[300px] overflow-y-auto">
                        {filteredStudents.map(s => (
                          <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setSearchTerm(s.name); }} className="w-full text-left px-10 py-5 hover:bg-emerald-50 border-b flex justify-between">
                            <span className="font-black text-slate-800 uppercase">{s.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{s.formalClass}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
              </div>

              {selectedStudent && (
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in zoom-in-95">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Santri Terpilih:</p>
                    <h4 className="text-xl font-black text-emerald-950 uppercase">{selectedStudent.name}</h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">{selectedStudent.formalClass} • {selectedStudent.gender}</p>
                 </div>
              )}

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Detail Laporan</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={category} onChange={e => setCategory(e.target.value as ViolationCategory)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none">
                       {Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={selectedRule} onChange={e => setSelectedRule(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none">
                       <option value="">-- PILIH JENIS {type === 'Violation' ? 'PELANGGARAN' : 'PRESTASI'} --</option>
                       {templates.filter(t => t.category === category).map(t => <option key={t.label} value={t.label}>{t.label} ({t.points} PT)</option>)}
                       <option value="lainnya">LAIN-LAIN (MANUAL)</option>
                    </select>
                 </div>
                 
                 {(selectedRule === 'lainnya' || selectedRule === '') && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                       <textarea value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} placeholder="Tulis deskripsi kejadian secara detail..." className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-sm shadow-inner min-h-[120px] border-2 border-transparent focus:border-emerald-600" />
                       <div className="flex items-center gap-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poin:</label>
                          <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-32 p-4 bg-slate-50 rounded-2xl outline-none font-black text-sm shadow-inner" />
                       </div>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Lampiran Foto (Opsional)</label>
                 <div className="flex flex-wrap gap-4">
                    {capturedPhoto ? (
                       <div className="relative w-full md:w-48 aspect-video rounded-[2rem] overflow-hidden border-2 border-emerald-500 shadow-xl group">
                          <img src={capturedPhoto} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><X size={16}/></button>
                       </div>
                    ) : (
                       <div className="flex gap-4 w-full">
                          <button type="button" onClick={startCamera} className="flex-1 flex flex-col items-center justify-center gap-3 py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all">
                             <Camera size={32}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Kamera</span>
                          </button>
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-3 py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all">
                             <ImageIcon size={32}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Galeri</span>
                             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                          </button>
                       </div>
                    )}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. Keterangan Penindakan (Opsional)</label>
                 <textarea 
                    value={actionNote} 
                    onChange={e => setActionNote(e.target.value)} 
                    placeholder="Isi jika laporan ini langsung ditindak (Status akan otomatis menjadi 'Telah Ditindak')..." 
                    className="w-full p-6 bg-slate-50 rounded-3xl outline-none font-bold text-sm shadow-inner min-h-[100px] border-2 border-transparent focus:border-blue-600 transition-all" 
                 />
                 <p className="text-[9px] font-bold text-slate-400 uppercase italic">* Jika dikosongkan, status laporan adalah 'Belum Ditindak' dan akan diproses oleh Idaroh.</p>
              </div>

              <button type="submit" disabled={!selectedStudent} className="w-full py-7 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase text-[12px] shadow-2xl hover:bg-emerald-900 active:scale-95 transition-all disabled:opacity-30">Kirim Laporan</button>
           </form>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[4rem] border shadow-2xl space-y-8 min-h-[500px]">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-3"><History size={20} className="text-emerald-700"/> Riwayat {type === 'Violation' ? 'Pelanggaran' : 'Prestasi'}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total: {historyReports.length} Laporan</p>
           </div>
           <div className="space-y-4">
              {historyReports.map(r => (
                <div key={r.id} className="p-8 bg-slate-50 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                   <div className="flex items-center gap-6 flex-1 w-full">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${type === 'Violation' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {students.find(s=>s.id===r.studentId)?.name[0]}
                      </div>
                      <div className="min-w-0">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{students.find(s=>s.id===r.studentId)?.name}</h4>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{r.category} • {r.date}</p>
                         <p className="text-[10px] text-slate-600 mt-3 font-medium line-clamp-2 italic">"{r.description}"</p>
                         {r.actionNote && <p className="text-[9px] font-bold text-blue-600 mt-2 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={12}/> {r.actionNote}</p>}
                      </div>
                   </div>
                   <div className="flex items-center gap-6 w-full md:w-auto shrink-0">
                      <div className="text-right">
                         <span className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${type === 'Violation' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {type === 'Violation' ? '-' : '+'}{r.points} PT
                         </span>
                         <p className={`text-[8px] font-black uppercase mt-2 tracking-widest ${r.status === 'Ditindak' ? 'text-blue-500' : 'text-orange-500'}`}>{r.status}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-200 group-hover:text-emerald-600 transition-all"/>
                   </div>
                </div>
              ))}
              {historyReports.length === 0 && (
                 <div className="py-32 text-center opacity-20 flex flex-col items-center gap-4">
                    <FileText size={64}/>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">Tidak Ada Laporan</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] overflow-hidden w-full max-w-lg shadow-2xl space-y-8 p-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Kamera Bukti</h3>
                 <button onClick={stopCamera} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"><X/></button>
              </div>
              <div className="relative aspect-[4/3] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-inner flex items-center justify-center">
                 {isCameraLoading && <div className="flex flex-col items-center gap-4 text-emerald-400 font-black uppercase text-[10px] tracking-widest"><Loader2 className="animate-spin" size={32}/> Menyiapkan Kamera...</div>}
                 <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraLoading ? 'hidden' : 'block'}`} />
              </div>
              <button onClick={takePhoto} disabled={isCameraLoading} className="w-full py-6 bg-emerald-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 shadow-xl hover:bg-emerald-900 active:scale-95 transition-all disabled:opacity-30"><Camera size={24}/> Ambil Foto</button>
              <canvas ref={canvasRef} className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
