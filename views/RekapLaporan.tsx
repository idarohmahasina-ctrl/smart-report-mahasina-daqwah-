
import React, { useState, useMemo } from 'react';
import { 
  AppData, AttendanceStatus, Student, AttendanceRecord, 
  PrayerRecord, ReportItem, PrayerStatus, UserRole 
} from '../types.ts';
import { 
  Search, Download, Users, ClipboardCheck, Zap, 
  ShieldAlert, Trophy, Filter, User, FileSpreadsheet, ChevronRight, Award, History
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { isTeacherMatch, normalizeSessionName } from './utils/nameMatchers.ts';

interface RekapLaporanProps {
  data: AppData;
  profile: any;
}

const RekapLaporan: React.FC<RekapLaporanProps> = ({ data, profile }) => {
  const [activeMainTab, setActiveMainTab] = useState<'absen' | 'pelanggaran' | 'prestasi'>('absen');
  const [classFilter, setClassFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('Semua'); 
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const students = data.students || [];
  const schedules = data.schedules || [];
  const role = profile?.role;

  // LOGIKA HAK AKSES
  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH || profile.email.toLowerCase().trim() === 'idarohmahasina@gmail.com';
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';

  const availableClasses = useMemo(() => {
    let cls = new Set<string>();
    students.forEach(s => {
      if (isGenderRestricted && s.gender !== targetGender) return;
      if (s.formalClass) cls.add(s.formalClass);
      Object.values(s.sessionClasses || {}).forEach(c => { if(c) cls.add(c as string); });
    });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, isGenderRestricted, targetGender]);

  const availableSessions = useMemo(() => {
    const sess = new Set<string>();
    schedules.forEach(s => sess.add(normalizeSessionName(s.sessionType)));
    data.attendance.forEach(a => sess.add(normalizeSessionName(a.sessionType)));
    return Array.from(sess).sort();
  }, [schedules, data.attendance]);

  // DATA REKAP ABSENSI
  const rekapAbsenData = useMemo(() => {
    if (!classFilter) return [];
    return students
      .filter(s => {
        const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
        const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
        const matchGdrRole = !isGenderRestricted || s.gender === targetGender;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        return matchLvl && matchGdr && matchGdrRole && isStudentInClass;
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
        return { "Nama": s.name, "NIS": s.nis, "H": counts.H, "S": counts.S, "I": counts.I, "T": counts.T, "A": counts.A, "Total": total, "Persen": `${pct}%` };
      })
      .filter(row => row["Nama"].toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classFilter, sessionFilter, levelFilter, genderFilter, searchTerm, students, data, isGenderRestricted, targetGender]);

  // DATA REKAP PELANGGARAN
  const rekapViolationData = useMemo(() => {
    if (!classFilter) return [];
    return students
      .filter(s => {
        const matchGdrRole = !isGenderRestricted || s.gender === targetGender;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        return matchGdrRole && isStudentInClass;
      })
      .map(s => {
        const myViolations = (data.reports || []).filter(r => r.studentId === s.id && r.type === 'Violation');
        const points = myViolations.reduce((acc, curr) => acc + curr.points, 0);
        const handled = myViolations.filter(v => v.status === 'Ditindak').length;
        return { "Nama": s.name, "NIS": s.nis, "Total Kasus": myViolations.length, "Ditindak": handled, "Poin (-)": points, "Gender": s.gender };
      })
      .filter(row => row["Nama"].toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => b["Poin (-)"] - a["Poin (-)"]);
  }, [classFilter, students, data, isGenderRestricted, targetGender, searchTerm]);

  // DATA REKAP PRESTASI
  const rekapAchievementData = useMemo(() => {
    if (!classFilter) return [];
    return students
      .filter(s => {
        const matchGdrRole = !isGenderRestricted || s.gender === targetGender;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        return matchGdrRole && isStudentInClass;
      })
      .map(s => {
        const myAchievements = (data.reports || []).filter(r => r.studentId === s.id && r.type === 'Achievement');
        const points = myAchievements.reduce((acc, curr) => acc + curr.points, 0);
        return { "Nama": s.name, "NIS": s.nis, "Total Prestasi": myAchievements.length, "Poin Reward (+)": points, "Gender": s.gender };
      })
      .filter(row => row["Nama"].toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => b["Poin Reward (+)"] - a["Poin Reward (+)"]);
  }, [classFilter, students, data, isGenderRestricted, targetGender, searchTerm]);

  const handleDownload = () => {
    const filename = `Rekap_${activeMainTab.toUpperCase()}_${classFilter}`;
    const csvData = activeMainTab === 'absen' ? rekapAbsenData : activeMainTab === 'pelanggaran' ? rekapViolationData : rekapAchievementData;
    downloadCSV(csvData, filename);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 px-2">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex overflow-x-auto no-scrollbar gap-2 border border-slate-100">
        <button onClick={() => setActiveMainTab('absen')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeMainTab === 'absen' ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} ><ClipboardCheck size={18}/> Rekap Absensi</button>
        <button onClick={() => setActiveMainTab('pelanggaran')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeMainTab === 'pelanggaran' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} ><ShieldAlert size={18}/> Rekap Pelanggaran</button>
        <button onClick={() => setActiveMainTab('prestasi')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${activeMainTab === 'prestasi' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} ><Trophy size={18}/> Rekap Prestasi</button>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[4rem] border shadow-sm space-y-8 border-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Pilih Kelas</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border border-slate-100 appearance-none cursor-pointer">
                 <option value="">-- KELAS --</option>
                 {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {activeMainTab === 'absen' && (
             <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Pilih Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner appearance-none cursor-pointer">
                   <option value="Semua">Semua Sesi</option>
                   {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
           )}
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner">
                <option value="Semua">Semua</option><option value="MTs">MTs</option><option value="MA">MA</option>
              </select>
           </div>
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cari Nama</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik nama..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-[10px] font-bold outline-none shadow-inner border border-slate-100" />
              </div>
           </div>
           <div className="flex items-end">
              <button onClick={handleDownload} disabled={!classFilter} className="w-full px-6 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all disabled:opacity-30"><FileSpreadsheet size={16}/> Download .CSV</button>
           </div>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[4.5rem] border shadow-2xl overflow-hidden min-h-[500px] border-slate-50">
         {!classFilter ? (
           <div className="flex flex-col items-center justify-center py-32 opacity-20 space-y-6">
              <Users size={80}/>
              <p className="text-[14px] font-black uppercase tracking-[0.4em]">Silakan Tentukan Kelas Terlebih Dahulu</p>
           </div>
         ) : (
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b-2 border-slate-50">
                       <th className="pb-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Santri & NIS</th>
                       {activeMainTab === 'absen' ? (
                         <>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Hadir</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest text-blue-500">Sakit</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest text-amber-500">Izin</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest text-orange-500">Late</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest text-red-500">Alpha</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-emerald-600 tracking-widest">%</th>
                         </>
                       ) : activeMainTab === 'pelanggaran' ? (
                         <>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Kasus</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-emerald-600 tracking-widest">Ditindak</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-red-600 tracking-widest">Poin (-)</th>
                         </>
                       ) : (
                         <>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Prestasi</th>
                           <th className="pb-8 text-center text-[10px] font-black uppercase text-emerald-600 tracking-widest">Reward (+)</th>
                         </>
                       )}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(activeMainTab === 'absen' ? rekapAbsenData : activeMainTab === 'pelanggaran' ? rekapViolationData : rekapAchievementData).map((row: any, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                         <td className="py-7">
                            <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{row["Nama"]}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">NIS: {row["NIS"]}</p>
                         </td>
                         {activeMainTab === 'absen' ? (
                           <>
                             <td className="py-7 text-center text-[11px] font-black text-slate-600">{row["H"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-blue-500">{row["S"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-amber-500">{row["I"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-orange-500">{row["T"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-red-500">{row["A"]}</td>
                             <td className="py-7 text-center"><span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black shadow-sm">{row["Persen"]}</span></td>
                           </>
                         ) : activeMainTab === 'pelanggaran' ? (
                           <>
                             <td className="py-7 text-center text-[11px] font-black text-slate-700">{row["Total Kasus"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-emerald-600">{row["Ditindak"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-red-600 bg-red-50/50 rounded-xl">{row["Poin (-)"]}</td>
                           </>
                         ) : (
                           <>
                             <td className="py-7 text-center text-[11px] font-black text-slate-700">{row["Total Prestasi"]}</td>
                             <td className="py-7 text-center text-[11px] font-black text-emerald-600 bg-emerald-50/50 rounded-xl">{row["Poin Reward (+)"]}</td>
                           </>
                         )}
                      </tr>
                    ))}
                 </tbody>
              </table>
              {(activeMainTab === 'absen' ? rekapAbsenData : activeMainTab === 'pelanggaran' ? rekapViolationData : rekapAchievementData).length === 0 && (
                <div className="py-24 text-center text-slate-300 font-black uppercase italic tracking-widest text-[10px]">Data tidak tersedia untuk kriteria ini</div>
              )}
           </div>
         )}
      </div>
    </div>
  );
};

export default RekapLaporan;
