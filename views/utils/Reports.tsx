
import React, { useState, useMemo, useRef } from 'react';
import { ReportItem, UserRole, ViolationCategory, Student, TemplateItem } from '../../types.ts';
import { 
  Search, ShieldAlert, Trophy, History, PlusCircle, Send, ChevronRight, Clock as ClockIcon, 
  AlertTriangle, User, FileText, CheckCircle, Filter, Edit, Award, ArrowLeft, UserCheck, X, Camera, Image as ImageIcon,
  ImagePlus, Loader2
} from 'lucide-react';

interface ReportsProps {
  type: 'Violation' | 'Achievement';
  onSave: (report: ReportItem) => void;
  role: UserRole;
  currentUser: string;
  students: Student[];
  allReports: ReportItem[];
  templates: TemplateItem[];
}

const Reports: React.FC<ReportsProps> = ({ type, onSave, role, currentUser, students, allReports, templates }) => {
  const [viewMode, setViewMode] = useState<'input' | 'history'>('input');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [category, setCategory] = useState<ViolationCategory>(ViolationCategory.IBADAH);
  const [selectedRule, setSelectedRule] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [points, setPoints] = useState(0);
  const [actionNote, setActionNote] = useState('');
  
  // Photo & Compression State
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.nis && s.nis.includes(searchTerm)) ||
      (s.formalClass && s.formalClass.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  , [students, searchTerm]);

  const categoryTemplates = useMemo(() => 
    templates.filter(t => t.category === category)
  , [templates, category]);

  /**
   * FUNGSI KOMPRESI GAMBAR (Penting untuk efisiensi memori)
   * Mengecilkan resolusi ke max 800px & kualitas 0.7 JPEG
   */
  const processAndCompressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Resolusi cukup untuk bukti, tidak membebani DB
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Output Base64 dengan kualitas 70%
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  // Kamera Logic
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
      setShowCamera(false);
    }
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        
        setIsProcessing(true);
        const compressed = await processAndCompressImage(dataUrl);
        setCapturedPhoto(compressed);
        setIsProcessing(false);
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

  // Galeri Logic
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Mohon pilih file gambar (JPG/PNG).");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await processAndCompressImage(base64);
      setCapturedPhoto(compressed);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
    // Reset value agar bisa pilih file yang sama lagi jika perlu
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { alert("Pilih santri terlebih dahulu."); return; }
    if (!selectedRule && !isCustom) { alert(`Pilih nama ${type === 'Violation' ? 'pelanggaran' : 'prestasi'}.`); return; }

    const finalDescription = isCustom ? incidentDescription : `${selectedRule}${incidentDescription ? `: ${incidentDescription}` : ''}`;
    const finalPoints = isCustom ? points : (templates.find(t => t.label === selectedRule)?.points || 0);
    const now = new Date();
    
    const reportStatus = actionNote.trim() ? 'Ditindak' : 'Belum Ditindak';

    onSave({
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudent.id,
      type,
      category,
      description: finalDescription,
      points: finalPoints,
      date: now.toLocaleDateString('id-ID'),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reporter: currentUser,
      status: reportStatus,
      actionNote: actionNote.trim() || undefined,
      photoUrl: capturedPhoto || undefined
    });

    alert(`Laporan ${type === 'Violation' ? 'Pelanggaran' : 'Prestasi'} berhasil terkirim!`);
    resetForm();
    setViewMode('history');
  };

  const resetForm = () => {
    setSelectedStudent(null); 
    setSearchTerm(''); 
    setActionNote(''); 
    setSelectedRule('');
    setIncidentDescription(''); 
    setIsCustom(false); 
    setPoints(0);
    setCapturedPhoto(null);
  };

  const isViolation = type === 'Violation';

  return (
    <div className="max-w-5xl mx-auto pb-24 relative overflow-hidden">
      
      {/* Hidden File Input untuk Galeri */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Navigasi Sub-Tab */}
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit mx-auto shadow-inner border border-slate-200 mb-10 sticky top-4 z-40 backdrop-blur-lg">
         <button 
           onClick={() => setViewMode('input')} 
           className={`flex items-center gap-3 px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'input' ? 'bg-white text-emerald-800 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <PlusCircle size={18}/> Form Input
         </button>
         <button 
           onClick={() => setViewMode('history')} 
           className={`flex items-center gap-3 px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white text-emerald-800 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <History size={18}/> Riwayat Laporan
         </button>
      </div>

      <div className="relative">
        <div className={`transition-all duration-700 ease-in-out ${viewMode === 'input' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute w-full top-0'}`}>
          <div className="space-y-8">
            <div className={`p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white ${isViolation ? 'bg-red-950 border-b-4 border-red-500' : 'bg-emerald-950 border-b-4 border-emerald-500'}`}>
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10 flex items-center gap-8">
                 <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 ${isViolation ? 'text-red-400 bg-red-900/40' : 'text-emerald-400 bg-emerald-900/40'}`}>
                    {isViolation ? <ShieldAlert size={40}/> : <Trophy size={40}/>}
                 </div>
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Smart Report {isViolation ? 'Pelanggaran' : 'Prestasi'}</h2>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mt-4">Silakan lengkapi data & lampiran foto</p>
                 </div>
              </div>
            </div>

            <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
               <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><User size={14}/> 1. Cari & Pilih Santri</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
                        <input 
                          type="text" 
                          value={searchTerm} 
                          onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }} 
                          placeholder="Ketik Nama, Kelas, atau NISN Santri..." 
                          className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-black text-sm transition-all shadow-inner" 
                        />
                        {searchTerm && !selectedStudent && (
                          <div className="absolute z-[2000] w-full mt-3 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl max-h-[350px] overflow-y-auto py-5 no-scrollbar border-t-8 border-emerald-600">
                            {filteredStudents.slice(0, 15).map(s => (
                              <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setSearchTerm(s.name); }} className="w-full text-left px-10 py-5 hover:bg-emerald-50 border-b border-slate-50 flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-white group-hover:text-emerald-700 transition-all">{s.name[0]}</div>
                                   <div>
                                      <p className="text-sm font-black text-slate-800 uppercase leading-none">{s.name}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">KELAS {s.formalClass} • NISN: {s.nis}</p>
                                   </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all"/>
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
                     {selectedStudent && (
                        <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in zoom-in-95">
                           <div className="flex items-center gap-5">
                             <UserCheck size={28} className="text-emerald-600 shrink-0"/>
                             <div>
                                <p className="text-sm font-black text-emerald-800 uppercase leading-none">{selectedStudent.name}</p>
                                <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1 tracking-widest">{selectedStudent.formalClass} • {selectedStudent.nis}</p>
                             </div>
                           </div>
                           <button type="button" onClick={() => {setSelectedStudent(null); setSearchTerm('');}} className="p-2 hover:bg-white rounded-full transition-colors text-emerald-700"><X size={20}/></button>
                        </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-100">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><Filter size={14}/> 2. Kategori Laporan</label>
                        <select value={category} onChange={e => {setCategory(e.target.value as any); setSelectedRule(''); setIsCustom(false);}} className="w-full px-8 py-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase border-2 border-transparent focus:border-emerald-600 appearance-none shadow-inner cursor-pointer">
                           {(Object.values(ViolationCategory) as string[]).filter(c => c !== ViolationCategory.LAINNYA).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><FileText size={14}/> 3. Nama Kejadian</label>
                        <select value={selectedRule} onChange={(e) => {
                           if (e.target.value === 'CUSTOM') { setIsCustom(true); setSelectedRule(''); setPoints(0); }
                           else { setIsCustom(false); setSelectedRule(e.target.value); setPoints(templates.find(t=>t.label===e.target.value)?.points || 0); }
                        }} className="w-full px-8 py-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase border-2 border-transparent focus:border-emerald-600 appearance-none shadow-inner cursor-pointer">
                           <option value="">-- PILIH DARI KATALOG --</option>
                           {categoryTemplates.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                           <option value="CUSTOM" className="text-amber-600 font-black">+ TULIS MANUAL</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><Award size={14}/> 4. Poin</label>
                        <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-sm shadow-inner" />
                     </div>
                     <div className="md:col-span-3 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><Edit size={14}/> 5. Keterangan Rinci</label>
                        <textarea value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} placeholder="Tuliskan detail kejadian..." className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-medium text-xs h-20 shadow-inner resize-none" />
                     </div>
                  </div>

                  {/* Foto Bukti dengan Support Galeri & Kompresi */}
                  <div className="space-y-4 pt-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><Camera size={14}/> 6. Lampiran Foto Bukti (Kompresi Otomatis)</label>
                     <div className="flex flex-col md:flex-row gap-6">
                        {capturedPhoto ? (
                           <div className="relative w-full md:w-64 aspect-video rounded-3xl overflow-hidden border-4 border-emerald-100 shadow-xl animate-in zoom-in-95">
                              <img src={capturedPhoto} className="w-full h-full object-cover" alt="Bukti" />
                              <button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-colors">
                                 <X size={16}/>
                              </button>
                           </div>
                        ) : (
                           <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                              <button 
                                type="button" 
                                onClick={startCamera} 
                                className={`aspect-video w-full md:w-40 rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-emerald-300 hover:text-emerald-400 transition-all bg-slate-50/50`}
                              >
                                 <Camera size={24}/>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-center">Kamera</span>
                              </button>
                              <button 
                                type="button" 
                                onClick={handleGalleryClick} 
                                className={`aspect-video w-full md:w-40 rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300 hover:border-blue-300 hover:text-blue-400 transition-all bg-slate-50/50`}
                              >
                                 <ImagePlus size={24}/>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-center">Galeri</span>
                              </button>
                           </div>
                        )}
                        <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center">
                           <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                              {isProcessing ? (
                                <span className="flex items-center gap-3 text-emerald-600 animate-pulse"><Loader2 className="animate-spin" size={14}/> SEDANG MENGOMPRES GAMBAR...</span>
                              ) : 'Foto akan dikompres otomatis ke resolusi optimal agar hemat ruang penyimpanan.'}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-3"><ShieldAlert size={14}/> 7. Keterangan Ditindak (Opsional)</label>
                     <input 
                       type="text" 
                       value={actionNote} 
                       onChange={e => setActionNote(e.target.value)} 
                       placeholder="Tindakan yang sudah diambil..." 
                       className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl outline-none font-black text-xs shadow-inner" 
                     />
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <button type="submit" disabled={isProcessing} className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl flex items-center justify-center gap-5 active:scale-95 transition-all ${isViolation ? 'bg-red-950 text-white hover:bg-red-800' : 'bg-emerald-950 text-white hover:bg-emerald-800'} disabled:opacity-50`}>
                      {isProcessing ? 'Tunggu Sebentar...' : <><Send size={24}/> Kirim Laporan</>}
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6">Input: {nowTimeStr} • {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
               </form>
            </div>
          </div>
        </div>

        {/* History Layer */}
        <div className={`transition-all duration-700 ease-in-out ${viewMode === 'history' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none absolute w-full top-0'}`}>
           <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-50 shadow-2xl space-y-10">
              <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Riwayat Laporan</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Daftar arsip laporan personal anda</p>
                 </div>
                 <div className="text-right">
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 uppercase tracking-widest">
                      {allReports.filter(r => r.reporter === currentUser && r.type === type).length} Total
                    </span>
                 </div>
              </div>
              
              <div className="space-y-5 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
                 {allReports.filter(r => r.reporter === currentUser && r.type === type).map(r => (
                   <div key={r.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 group transition-all">
                      <div className="flex items-center gap-6 flex-1 w-full">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${isViolation ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isViolation ? <AlertTriangle size={28}/> : <Trophy size={28}/>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 uppercase leading-none truncate">{students.find(s=>s.id===r.studentId)?.name || 'Santri'}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase truncate max-w-[320px]">{r.description}</p>
                            <div className="flex flex-col gap-1 mt-3">
                               <div className="flex items-center gap-4 text-[8px] font-black text-emerald-700 uppercase tracking-widest">
                                  <ClockIcon size={12}/> {r.date} • {r.time}
                               </div>
                               {r.actionNote && (
                                  <p className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 inline-block self-start mt-1">TINDAKAN: {r.actionNote}</p>
                               )}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                         {r.photoUrl && (
                            <div 
                              onClick={() => window.open(r.photoUrl)}
                              className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md cursor-zoom-in hover:scale-110 transition-transform"
                            >
                               <img src={r.photoUrl} className="w-full h-full object-cover" alt="Bukti" />
                            </div>
                         )}
                         <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-tighter">{r.points} PT</span>
                         <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest ${r.status === 'Ditindak' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-amber-100 text-amber-800'}`}>
                           {r.status === 'Ditindak' ? <CheckCircle size={14}/> : <ClockIcon size={14}/>} {r.status}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Kamera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-[3rem] overflow-hidden w-full max-w-lg space-y-6 p-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest">Kamera Bukti</h3>
                 <button onClick={stopCamera} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X/></button>
              </div>
              <div className="relative aspect-[4/3] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={takePhoto} 
                className={`w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${isViolation ? 'bg-red-800' : 'bg-emerald-800'}`}
              >
                <Camera size={20}/> Ambil Foto
              </button>
              <canvas ref={canvasRef} className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
