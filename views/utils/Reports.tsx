
import React, { useState, useMemo, useRef } from 'react';
import { ReportItem, UserRole, ViolationCategory, Student, TemplateItem, Schedule } from '../../types.ts';
import { Search, History, Send, ChevronRight, X, Camera, RefreshCw, Loader2, History as HistoryIcon, FileText, Image as ImageIcon, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [manualDescription, setManualDescription] = useState('');
  const [points, setPoints] = useState(0);
  const [actionNote, setActionNote] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const filteredStudents = useMemo(() => students.filter(s => {
    const matchGender = !isGenderRestricted || s.gender === targetGender;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis && s.nis.includes(searchTerm));
    return matchGender && matchSearch;
  }), [students, searchTerm, isGenderRestricted, targetGender]);

  const historyReports = useMemo(() => allReports.filter(r => r.type === type), [allReports, type]);

  const startCamera = async () => {
    setShowCamera(true);
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCapturedPhoto(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const finalDescription = selectedRule === 'lainnya' ? manualDescription : selectedRule;
    if (!finalDescription) { alert("Mohon isi deskripsi laporan."); return; }

    onSave({ 
      id: Math.random().toString(36).substr(2, 9), 
      studentId: selectedStudent.id, 
      type, 
      category, 
      description: finalDescription, 
      points: points || (templates.find(t => t.label === selectedRule)?.points || 0), 
      date: new Date().toLocaleDateString('id-ID'), 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 
      reporter: currentUser, 
      status: actionNote.trim() ? 'Ditindak' : 'Belum Ditindak', 
      actionNote: actionNote.trim() || undefined, 
      photoUrl: capturedPhoto || undefined 
    });

    alert("Laporan Berhasil Terkirim!"); 
    setCapturedPhoto(null); 
    setSelectedStudent(null); 
    setManualDescription('');
    setSelectedRule('');
    setActionNote('');
    setViewMode('history');
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2">
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit mx-auto shadow-inner mb-10">
         <button onClick={() => setViewMode('input')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'input' ? 'bg-white text-emerald-950 shadow-lg' : 'text-slate-400'}`}>Form Input</button>
         <button onClick={() => setViewMode('history')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white text-emerald-950 shadow-lg' : 'text-slate-400'}`}>Riwayat Laporan</button>
      </div>

      {viewMode === 'input' ? (
        <div className="bg-white p-8 md:p-12 rounded-[4rem] border shadow-sm space-y-12 animate-in slide-in-from-bottom-4">
           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Pilih Objek Santri</label>
                 <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22}/>
                    <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }} placeholder="Ketik nama santri..." className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-[2rem] outline-none font-black text-sm shadow-inner border-2 border-transparent focus:border-emerald-600 transition-all" />
                    {searchTerm && !selectedStudent && (
                      <div className="absolute z-50 w-full mt-3 bg-white border rounded-[2rem] shadow-2xl max-h-[300px] overflow-y-auto no-scrollbar border-slate-100">
                        {filteredStudents.map(s => (
                          <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setSearchTerm(s.name); }} className="w-full text-left px-10 py-6 hover:bg-emerald-50 border-b border-slate-50 flex justify-between items-center transition-colors">
                             <div>
                                <p className="font-black text-slate-800 uppercase text-[12px]">{s.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">NIS: {s.nis || '-'}</p>
                             </div>
                             <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase">Kelas {s.formalClass}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
              </div>

              {selectedStudent && (
                <div className="p-8 bg-emerald-950 text-white rounded-[2.5rem] border border-emerald-800 animate-in zoom-in-95 shadow-xl flex justify-between items-center">
                   <div>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 opacity-70">Santri Terpilih:</p>
                      <h4 className="text-xl font-black uppercase tracking-tight">{selectedStudent.name}</h4>
                      <p className="text-[10px] font-bold text-emerald-200 uppercase mt-1">Unit {selectedStudent.formalClass} • {selectedStudent.gender}</p>
                   </div>
                   <button type="button" onClick={() => { setSelectedStudent(null); setSearchTerm(''); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20}/></button>
                </div>
              )}

              <div className="space-y-6">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Detail Laporan & Kategori</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={category} onChange={e => setCategory(e.target.value as ViolationCategory)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">
                      {Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={selectedRule} onChange={e => setSelectedRule(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">
                      <option value="">-- PILIH JENIS {type === 'Violation' ? 'PELANGGARAN' : 'PRESTASI'} --</option>
                      {templates.filter(t => t.category === category).map(t => <option key={t.label} value={t.label}>{t.label} ({t.points} Poin)</option>)}
                      <option value="lainnya">LAIN-LAIN (INPUT MANUAL)</option>
                    </select>
                 </div>

                 {selectedRule === 'lainnya' && (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Tuliskan Nama Laporan Manual</label>
                      <textarea required value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="Contoh: Terlambat masuk asrama karena membantu orang tua..." className="w-full p-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2rem] outline-none font-bold text-sm min-h-[120px] focus:border-emerald-600 transition-all shadow-inner" />
                      <div className="flex items-center gap-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bobot Poin Manual:</label>
                        <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="w-24 p-3 bg-slate-50 border rounded-xl font-black text-center" />
                      </div>
                   </div>
                 )}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Tindakan Langsung (Opsional)</label>
                    {actionNote.trim() && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg animate-pulse">Otomatis Ditindak</span>}
                 </div>
                 <textarea 
                   value={actionNote} 
                   onChange={e => setActionNote(e.target.value)} 
                   placeholder="Tuliskan tindakan yang diambil jika ada (Misal: Sudah dinasehati, HP disita, dsb). Jika diisi, status laporan otomatis 'SUDAH DITINDAK'." 
                   className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm min-h-[120px] shadow-inner transition-all"
                 />
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. Bukti Visual (Opsional)</label>
                 {capturedPhoto ? (
                   <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-emerald-500 shadow-2xl group">
                      <img src={capturedPhoto} className="w-full h-full object-cover"/>
                      <button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 p-4 bg-red-600 text-white rounded-2xl shadow-xl active:scale-90 transition-all"><X size={20}/></button>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button type="button" onClick={startCamera} className="py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase text-[10px] flex flex-col items-center gap-4 hover:border-emerald-500 hover:text-emerald-600 transition-all">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border"><Camera size={24}/></div>
                         Ambil dari Kamera
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black uppercase text-[10px] flex flex-col items-center gap-4 hover:border-blue-500 hover:text-blue-600 transition-all">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border"><ImageIcon size={24}/></div>
                         Pilih dari Galeri
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                   </div>
                 )}
              </div>

              <button type="submit" disabled={!selectedStudent} className="w-full py-7 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-emerald-900 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3">
                 <Send size={20}/> Kirim Laporan Sekarang
              </button>
           </form>
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-[4rem] border shadow-sm space-y-8">
           <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center"><HistoryIcon size={24}/></div>
              <div>
                 <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Riwayat Laporan {type === 'Violation' ? 'Pelanggaran' : 'Prestasi'}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar laporan yang Anda kirimkan</p>
              </div>
           </div>
           <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
              {historyReports.length > 0 ? historyReports.map(r => (
                <div key={r.id} className="p-8 bg-slate-50 rounded-[3rem] flex flex-col sm:flex-row items-center justify-between border-2 border-transparent hover:border-emerald-500 transition-all gap-6">
                   <div className="flex items-center gap-6 flex-1 w-full">
                      <div className="w-14 h-14 bg-white rounded-[1.2rem] flex items-center justify-center font-black text-sm shadow-inner text-slate-400 border shrink-0">{students.find(s=>s.id===r.studentId)?.name?.[0]}</div>
                      <div className="min-w-0">
                         <div className="flex items-center gap-3 mb-1">
                            <p className="text-[13px] font-black uppercase text-slate-800 leading-tight truncate">{students.find(s=>s.id===r.studentId)?.name}</p>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${r.status === 'Ditindak' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{r.category} • {r.date}</p>
                         <p className="text-[10px] font-medium text-slate-600 mt-2 line-clamp-2 italic">"{r.description}"</p>
                         {r.actionNote && <p className="text-[9px] font-black text-emerald-600 mt-2 uppercase tracking-tight">Tindakan: {r.actionNote}</p>}
                      </div>
                   </div>
                   <div className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm ${type === 'Violation' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {r.points} Poin
                   </div>
                </div>
              )) : (
                <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                   <FileText size={64}/>
                   <p className="text-[12px] font-black uppercase tracking-[0.3em]">Belum ada histori laporan</p>
                </div>
              )}
           </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center"><Camera size={18}/></div>
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Kamera Bukti Laporan</h3>
                 </div>
                 <button onClick={stopCamera} className="p-3 bg-slate-100 rounded-2xl hover:text-red-600 transition-all"><X size={20}/></button>
              </div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner">
                {isCameraLoading && <div className="flex flex-col items-center justify-center h-full text-white/50 animate-pulse"><Loader2 className="animate-spin mb-4" size={32}/></div>}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraLoading ? 'opacity-0' : 'opacity-100'}`}/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { setFacingMode(facingMode === 'user' ? 'environment' : 'user'); stopCamera(); setTimeout(startCamera, 100); }} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                    <RefreshCw size={18}/> Ganti Kamera
                 </button>
                 <button onClick={takePhoto} className="flex-[2] py-5 bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all">Ambil Foto</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
