
import React, { useState, useMemo } from 'react';
import { 
  AttendanceRecord, PrayerRecord, TeacherAttendance, ReportItem, Student, 
  AttendanceStatus, PrayerStatus, UserRole
} from '../types.ts';
import { 
  ShieldCheck, Lock, Trash2, Edit3, Search, Filter, Database, 
  ChevronDown, X, Check, AlertTriangle, Download, FileText, UserCheck, Zap,
  AlertCircle, RefreshCcw, ShieldAlert, Camera, Sparkles, User
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { resetFirestoreData, getActiveSession, seedDemoData } from '../services/dataService.ts';
import { 
  DEMO_STUDENTS, DEMO_TEACHERS, DEMO_SCHEDULES, DEMO_ATTENDANCE, 
  DEMO_REPORTS, DEMO_TEACHER_ATTENDANCE, DEMO_PRAYER 
} from '../constants.tsx';

interface ControlPanelProps {
  data: {
    attendance: AttendanceRecord[];
    prayerAttendance: PrayerRecord[];
    teacherAttendance: TeacherAttendance[];
    reports: ReportItem[];
    students: Student[];
  };
  actions: {
    deleteAttendance: (id: string) => void;
    deletePrayer: (id: string) => void;
    deleteReport: (id: string) => void;
  };
}

const ControlPanel: React.FC<ControlPanelProps> = ({ data, actions }) => {
  const [activeModul, setActiveModul] = useState<'absen-santri' | 'absen-sholat' | 'laporan'>('absen-santri');
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const profile = getActiveSession();
  const isSuperAdmin = profile?.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';

  const filteredData = useMemo(() => {
    let list: any[] = [];
    if (activeModul === 'absen-santri') list = data.attendance || [];
    else if (activeModul === 'absen-sholat') list = data.prayerAttendance || [];
    else list = data.reports || [];

    return list.filter(item => {
      const studentName = data.students?.find(s => s.id === item.studentId)?.name || '';
      const reporterName = (item.recordedBy || item.reporter || '').toLowerCase();
      return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             reporterName.includes(searchTerm.toLowerCase());
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [activeModul, data, searchTerm]);

  const handleHardReset = async () => {
    if (!confirm("🚨 PERINGATAN KRITIS: Anda akan menghapus SELURUH database Mahasina di Cloud. Lanjutkan?")) return;
    const code = prompt("Ketik kata 'HAPUS' untuk mengkonfirmasi:");
    if (code !== 'HAPUS') return;

    setIsResetting(true);
    try {
      await resetFirestoreData();
      alert("Sistem berhasil di-reset.");
      window.location.reload();
    } catch (err) {
      alert("Gagal melakukan reset.");
    } finally { setIsResetting(false); }
  };

  const handleLoadDemo = async () => {
    if (!confirm("Aplikasi akan memuat data sampel (Santri, Guru, Jadwal & Laporan) untuk demonstrasi. Lanjutkan?")) return;
    
    setIsSeeding(true);
    try {
      const demoPayload = {
        students: DEMO_STUDENTS,
        teachers: DEMO_TEACHERS,
        schedules: DEMO_SCHEDULES,
        attendance: DEMO_ATTENDANCE,
        teacherAttendance: DEMO_TEACHER_ATTENDANCE,
        reports: DEMO_REPORTS,
        prayerAttendance: DEMO_PRAYER,
        orsam: [],
        orklas: [],
        violationTemplates: [],
        achievementTemplates: [],
        extraDataLists: [],
        announcements: [],
        academicConfig: { 
          schoolYear: '2024/2025', 
          semester: 'II (Genap)' as any, 
          isHoliday: false, 
          excludedClasses: {} 
        }
      };
      await seedDemoData(demoPayload);
      alert("Data demo berhasil dimuat! Silakan cek dashboard dan menu lainnya.");
      window.location.reload();
    } catch (err) {
      alert("Gagal memuat data demo.");
    } finally { setIsSeeding(false); }
  };

  // Hanya tampilkan kolom foto untuk modul Laporan
  const showPhotoColumn = activeModul === 'laporan';

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="bg-emerald-950 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border-b-4 border-emerald-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 backdrop-blur-md shadow-2xl shrink-0"><Database size={32} /></div>
              <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Panel Kontrol</h2>
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-4 flex items-center gap-2"><ShieldCheck size={12}/> Manajemen Data Terpusat</p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
              {[
                { id: 'absen-santri', label: 'Absen Santri' },
                { id: 'absen-sholat', label: 'Absen Sholat' },
                { id: 'laporan', label: 'Laporan VP' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveModul(tab.id as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeModul === tab.id ? 'bg-white text-emerald-950 shadow-xl' : 'text-white/60 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-xl space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative flex-1 w-full">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><Search size={22}/></span>
               <input type="text" placeholder={`Cari nama, keterangan, atau petugas...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[2rem] outline-none font-bold text-sm shadow-inner transition-all" />
            </div>
            <button onClick={() => downloadCSV(filteredData, `Master_Export_${activeModul}`)} className="px-8 py-5 bg-emerald-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-3 hover:bg-emerald-800 transition-all active:scale-95"><Download size={18}/> Ekspor CSV</button>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-50">
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Santri / Unit</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesi / Waktu</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Petugas</th>
                     <th className="pb-6 pr-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{showPhotoColumn ? 'Status / Bukti' : 'Status'}</th>
                     <th className="pb-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-6 pr-4">
                         <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{data.students?.find(s => s.id === item.studentId)?.name || 'Data Dihapus'}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">UNIT: {item.class}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <p className="text-[10px] font-bold text-slate-700">{item.sessionType || item.prayerTime || item.type}</p>
                         <p className="text-[8px] font-black text-slate-400 mt-1.5 uppercase">{item.date} • {item.time || item.recordedTime || item.timestamp}</p>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-2 text-emerald-700">
                            <User size={14} className="opacity-40" />
                            <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{item.recordedBy || item.reporter || 'Sistem'}</p>
                         </div>
                      </td>
                      <td className="py-6 pr-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'Hadir' || item.status === 'Berjama\'ah' || item.status === 'Ditindak' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{item.status || item.category || '-'}</span>
                            {showPhotoColumn && item.photoUrl && (
                               <div onClick={() => window.open(item.photoUrl)} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:scale-110 transition-transform shadow-sm">
                                  <img src={item.photoUrl} className="w-full h-full object-cover" />
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="py-6">
                         <div className="flex justify-center gap-3">
                            <button onClick={() => { if(confirm("Hapus data ini?")) { if(activeModul === 'absen-santri') actions.deleteAttendance(item.id); else if(activeModul === 'absen-sholat') actions.deletePrayer(item.id); else actions.deleteReport(item.id); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                         </div>
                    </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {filteredData.length === 0 && (
               <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">Belum Ada Data</div>
            )}
         </div>
      </div>

      {/* Admin Action Zone */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
           {/* Load Demo Data */}
           <div className="bg-emerald-50 border-2 border-emerald-100 p-10 rounded-[4rem] space-y-6">
              <div className="flex items-center gap-4 text-emerald-700">
                 <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><Sparkles size={28}/></div>
                 <h3 className="text-xl font-black uppercase tracking-tight">Eksplorasi Data Sampel</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                 Klik tombol di bawah untuk mengisi sistem dengan data simulasi santri, guru, jadwal, dan laporan yang sudah terisi.
              </p>
              <button 
                disabled={isSeeding}
                onClick={handleLoadDemo}
                className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSeeding ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18}/>}
                Muat Data Demo Pesantren
              </button>
           </div>

           {/* Factory Reset */}
           <div className="bg-red-50/50 rounded-[4rem] border-2 border-red-100 p-10 space-y-6">
              <div className="flex items-center gap-4 text-red-700">
                 <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600"><ShieldAlert size={28}/></div>
                 <h3 className="text-xl font-black uppercase tracking-tight">Reset Master Cloud</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                Menghapus semua data Master dan Transaksi permanen. Gunakan saat awal tahun ajaran baru.
              </p>
              <button 
                disabled={isResetting}
                onClick={handleHardReset}
                className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isResetting ? <RefreshCcw size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                Lakukan Factory Reset
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
