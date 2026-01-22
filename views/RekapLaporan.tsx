
import React, { useState, useMemo } from 'react';
import { 
  AppData, AttendanceStatus, Student, AttendanceRecord, 
  PrayerRecord, ReportItem, PrayerStatus, UserRole 
} from '../types.ts';
import { 
  Search, Download, Users, ClipboardCheck, Zap, 
  ShieldAlert, Trophy, Filter, User, FileSpreadsheet
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { isTeacherMatch, normalizeSessionName } from './utils/nameMatchers.ts';

interface RekapLaporanProps {
  data: AppData;
  profile: any;
}

const RekapLaporan: React.FC<RekapLaporanProps> = ({ data, profile }) => {
  const [activeMainTab, setActiveMainTab] = useState<'absen' | 'vp'>('absen');
  const [classFilter, setClassFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('Semua'); 
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const students = data.students || [];
  const schedules = data.schedules || [];

  // Discovery Dinamis
  const availableClasses = useMemo(() => {
    const cls = new Set<string>();
    students.forEach(s => { if (s.formalClass) cls.add(s.formalClass); });
    schedules.forEach(s => { if (s.class) cls.add(s.class); });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, schedules]);

  const availableSessions = useMemo(() => {
    const sess = new Set<string>();
    schedules.forEach(s => sess.add(normalizeSessionName(s.sessionType)));
    data.attendance.forEach(a => sess.add(normalizeSessionName(a.sessionType)));
    return Array.from(sess).sort();
  }, [schedules, data.attendance]);

  const rekapAbsenData = useMemo(() => {
    if (!classFilter) return [];
    return students
      .filter(s => {
        const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
        const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        return matchLvl && matchGdr && isStudentInClass;
      })
      .map(s => {
        const allAtt = data.attendance.filter(a => 
          a.studentId === s.id && 
          (sessionFilter === 'Semua' || normalizeSessionName(a.sessionType) === normalizeSessionName(sessionFilter))
        );
        const counts = { H: 0, S: 0, I: 0, T: 0, A: 0 };
        allAtt.forEach(a => {
          if (a.status === AttendanceStatus.H) counts.H++;
          else if (a.status === AttendanceStatus.S) counts.S++;
          else if (a.status === AttendanceStatus.I) counts.I++;
          else if (a.status === AttendanceStatus.T) counts.T++;
          else if (a.status === AttendanceStatus.A) counts.A++;
        });
        const total = counts.H + counts.S + counts.I + counts.T + counts.A;
        const pct = total > 0 ? Math.round((counts.H / total) * 100) : 0;
        return { "Nama Santri": s.name, "NIS": s.nis, "Hadir": counts.H, "Sakit": counts.S, "Izin": counts.I, "Telat": counts.T, "Alpha": counts.A, "Total": total, "Persen": `${pct}%` };
      })
      .filter(row => row["Nama Santri"].toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classFilter, sessionFilter, levelFilter, genderFilter, searchTerm, students, data]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 px-2">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        <button onClick={() => setActiveMainTab('absen')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeMainTab === 'absen' ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} ><ClipboardCheck size={18}/> Rekap Absensi</button>
        <button onClick={() => setActiveMainTab('vp')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeMainTab === 'vp' ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} ><ShieldAlert size={18}/> Rekap VP & Poin</button>
      </div>

      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Pilih Unit</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner border border-slate-100">
                 <option value="">-- PILIH UNIT --</option>
                 {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {activeMainTab === 'absen' && (
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Pilih Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none shadow-inner">
                   <option value="Semua">Semua Sesi</option>
                   {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
           )}
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cari Nama</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik nama..." className="w-full p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none shadow-inner border border-slate-100" />
           </div>
           <div className="flex items-end">
              <button onClick={() => downloadCSV(rekapAbsenData, `Rekap_${classFilter}`)} className="w-full px-6 py-3 bg-emerald-950 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2"><FileSpreadsheet size={14}/> Download .CSV</button>
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[4rem] border shadow-xl overflow-hidden min-h-[400px]">
         {!classFilter ? (
           <div className="flex flex-col items-center justify-center py-24 opacity-20">
              <Users size={64}/>
              <p className="text-[12px] font-black uppercase tracking-widest mt-4">Silakan Tentukan Unit Kelas</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b-2 border-slate-50">
                       <th className="pb-6 text-[9px] font-black uppercase text-slate-400">Nama Santri</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400">Hadir</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400">Sakit</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400">Izin</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400">Alpha</th>
                       <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-600">%</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {rekapAbsenData.map((row: any, idx) => (
                      <tr key={idx}>
                         <td className="py-5">
                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{row["Nama Santri"]}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1">{row["NIS"]}</p>
                         </td>
                         <td className="py-5 text-center text-[10px] font-black text-slate-600">{row["Hadir"]}</td>
                         <td className="py-5 text-center text-[10px] font-black text-blue-500">{row["Sakit"]}</td>
                         <td className="py-5 text-center text-[10px] font-black text-amber-500">{row["Izin"]}</td>
                         <td className="py-5 text-center text-[10px] font-black text-red-500">{row["Alpha"]}</td>
                         <td className="py-5 text-center"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black">{row["Persen"]}</span></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
};

export default RekapLaporan;
