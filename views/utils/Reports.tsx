
import React, { useState, useMemo, useRef } from 'react';
import { ReportItem, UserRole, ViolationCategory, Student, TemplateItem, Schedule } from '../../types.ts';
import { Search, History, Send, ChevronRight, X, Camera, RefreshCw, Loader2, History as HistoryIcon, FileText } from 'lucide-react';
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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH;
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

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    onSave({ id: Math.random().toString(36).substr(2, 9), studentId: selectedStudent.id, type, category, description: selectedRule === 'lainnya' ? incidentDescription : selectedRule, points: points || (templates.find(t => t.label === selectedRule)?.points || 0), date: new Date().toLocaleDateString('id-ID'), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), reporter: currentUser, status: actionNote.trim() ? 'Ditindak' : 'Belum Ditindak', actionNote: actionNote.trim() || undefined, photoUrl: capturedPhoto || undefined });
    alert("Laporan Berhasil!"); setCapturedPhoto(null); setSelectedStudent(null); setViewMode('history');
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit mx-auto shadow-inner mb-10">
         <button onClick={() => setViewMode('input')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase ${viewMode === 'input' ? 'bg-white shadow-lg' : 'text-slate-400'}`}>Form Input</button>
         <button onClick={() => setViewMode('history')} className={`px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase ${viewMode === 'history' ? 'bg-white shadow-lg' : 'text-slate-400'}`}>Riwayat</button>
      </div>

      {viewMode === 'input' ? (
        <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-12">
           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Cari Santri</label>
                 <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22}/><input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedStudent(null); }} placeholder="Ketik nama santri..." className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-[2rem] outline-none font-black text-sm shadow-inner" />
                 {searchTerm && !selectedStudent && (
                   <div className="absolute z-50 w-full mt-3 bg-white border rounded-[2rem] shadow-2xl max-h-[250px] overflow-y-auto no-scrollbar">{filteredStudents.map(s => (
                     <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setSearchTerm(s.name); }} className="w-full text-left px-10 py-5 hover:bg-emerald-50 border-b flex justify-between"><span className="font-black text-slate-800 uppercase">{s.name}</span><span className="text-[10px] font-bold text-slate-400 uppercase">{s.formalClass}</span></button>
                   ))}</div>
                 )}</div>
              </div>

              {selectedStudent && <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in zoom-in-95"><p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Santri Terpilih:</p><h4 className="text-xl font-black text-emerald-950 uppercase">{selectedStudent.name}</h4><p className="text-[10px] font-bold text-emerald-600 uppercase">Unit {selectedStudent.formalClass}</p></div>}

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Detail Laporan</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><select value={category} onChange={e => setCategory(e.target.value as ViolationCategory)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">{Object.values(ViolationCategory).map(c => <option key={c} value={c}>{c}</option>)}</select><select value={selectedRule} onChange={e => setSelectedRule(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-black text-xs uppercase shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer"><option value="">-- PILIH JENIS {type.toUpperCase()} --</option>{templates.filter(t => t.category === category).map(t => <option key={t.label} value={t.label}>{t.label} ({t.points} PT)</option>)}<option value="lainnya">LAIN-LAIN (MANUAL)</option></select></div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Lampiran Foto</label>
                 {capturedPhoto ? <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-emerald-500 shadow-xl"><img src={capturedPhoto} className="w-full h-full object-cover"/><button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-2xl"><X size={16}/></button></div> : <button type="button" onClick={startCamera} className="w-full py-10 bg-slate-50 border-2 border-dashed rounded-[3rem] text-slate-400 font-black uppercase text-[11px] flex flex-col items-center gap-3"><Camera size={32}/> Ambil Foto Bukti</button>}
              </div>

              <button type="submit" disabled={!selectedStudent} className="w-full py-7 bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase text-[12px] shadow-2xl disabled:opacity-30">Kirim Laporan</button>
           </form>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-[4rem] border shadow-sm space-y-6">
           <div className="flex items-center gap-4 px-4"><HistoryIcon size={24} className="text-emerald-700"/><h3 className="text-sm font-black uppercase text-slate-800">Riwayat Laporan {type}</h3></div>
           <div className="space-y-4">{historyReports.map(r => (
             <div key={r.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-transparent hover:border-emerald-500 transition-all group">
                <div className="flex items-center gap-5"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs shadow-inner text-slate-400">{students.find(s=>s.id===r.studentId)?.name[0]}</div><div><p className="text-[11px] font-black uppercase text-slate-800 leading-none">{students.find(s=>s.id===r.studentId)?.name}</p><p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{r.category} • {r.date}</p></div></div>
                <div className="text-right"><span className="px-3 py-1 bg-white border rounded-xl text-[10px] font-black text-emerald-700">{r.points} PT</span></div>
             </div>
           ))}</div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-10 space-y-8 animate-in zoom-in-95 shadow-2xl">
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase text-slate-800">Kamera Laporan</h3><button onClick={stopCamera} className="p-3 bg-slate-100 rounded-2xl"><X/></button></div>
              <div className="relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden">{isCameraLoading && <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-white"/></div>}<video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraLoading ? 'opacity-0' : 'opacity-100'}`}/></div>
              <div className="flex gap-4">
                 <button onClick={() => { setFacingMode(facingMode === 'user' ? 'environment' : 'user'); stopCamera(); setTimeout(startCamera, 100); }} className="flex-1 py-5 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black uppercase text-[9px] flex items-center justify-center gap-2"><RefreshCw size={18}/> Ganti Kamera</button>
                 <button onClick={takePhoto} className="flex-[2] py-5 bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase text-[11px]">Ambil Foto</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
