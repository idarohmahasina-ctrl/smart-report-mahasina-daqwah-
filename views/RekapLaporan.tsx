
import React, { useState, useMemo } from 'react';
import { 
  AppData, AttendanceStatus, Student, UserRole, PrayerStatus 
} from '../types.ts';
import { 
  Search, Users, ClipboardCheck, ShieldAlert, Trophy, Filter, FileSpreadsheet, Zap
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { isTeacherMatch } from './utils/nameMatchers.ts';

interface RekapLaporanProps {
  data: AppData;
  profile: any;
}

const RekapLaporan: React.FC<RekapLaporanProps> = ({ data, profile }) => {
  const [activeTab, setActiveTab] = useState<'kbm' | 'pondok' | 'pelanggaran' | 'prestasi'>('kbm');
  const [classFilter, setClassFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('Semua'); 
  const [levelFilter, setLevelFilter] = useState('Semua');
  const [genderFilter, setGenderFilter] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const students = data.students || [];
  const role = profile?.role;

  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH;
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';
  
  const myManagedClasses = useMemo(() => {
    if (isAdminOrPengasuh || isGenderRestricted) return []; 
    return Array.from(new Set(
      data.schedules
        .filter(s => isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName, s.homeroomTeacherName))
        .map(s => s.class)
    ));
  }, [data.schedules, profile, isAdminOrPengasuh, isGenderRestricted]);

  const isClassRestricted = (role === UserRole.GURU || role === UserRole.MUSYRIF) && !isAdminOrPengasuh;

  const availableClasses = useMemo(() => {
    let cls = new Set<string>();
    students.forEach(s => {
      if (isGenderRestricted && s.gender !== targetGender) return;
      if (isClassRestricted && !myManagedClasses.includes(s.formalClass)) return;
      if (s.formalClass) cls.add(s.formalClass);
    });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const tableData = useMemo(() => {
    if (!classFilter) return [];
    return students
      .filter(s => {
        const matchRoleGender = !isGenderRestricted || s.gender === targetGender;
        const matchRoleClass = !isClassRestricted || myManagedClasses.includes(s.formalClass);
        const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
        const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
        return matchRoleGender && matchRoleClass && matchLvl && matchGdr && s.formalClass === classFilter;
      })
      .map(s => {
        if (activeTab === 'kbm' || activeTab === 'pondok') {
          const records = activeTab === 'kbm' ? data.attendance : data.prayerAttendance;
          const filtered = records.filter((a: any) => 
            a.studentId === s.id && 
            (sessionFilter === 'Semua' || a.sessionType === sessionFilter || a.prayerTime === sessionFilter)
          );
          const counts = { H: 0, S: 0, I: 0, T: 0, A: 0, U: 0 };
          filtered.forEach((a: any) => {
            const st = a.status;
            if (st === AttendanceStatus.H || st === PrayerStatus.JAMAAH) counts.H++;
            else if (st === AttendanceStatus.S || st === PrayerStatus.SAKIT) counts.S++;
            else if (st === AttendanceStatus.I || st === PrayerStatus.IZIN) counts.I++;
            else if (st === AttendanceStatus.T || st === PrayerStatus.TERLAMBAT) counts.T++;
            else if (st === AttendanceStatus.A || st === PrayerStatus.ALPHA) counts.A++;
            else if (st === PrayerStatus.UDZUR) counts.U++;
          });
          const total = counts.H + counts.S + counts.I + counts.T + counts.A + counts.U;
          const pct = total > 0 ? Math.round((counts.H / total) * 100) : 0;
          return { "Nama Santri": s.name, "NIS": s.nis, "Hadir": counts.H, "Sakit": counts.S, "Izin": counts.I, "Late": counts.T, "Alpha": counts.A, "Udzur": counts.U, "Total": total, "Persentase": `${pct}%` };
        } else {
          const type = activeTab === 'pelanggaran' ? 'Violation' : 'Achievement';
          const myReports = data.reports.filter(r => r.studentId === s.id && r.type === type);
          return { "Nama Santri": s.name, "NIS": s.nis, "Gender": s.gender, "Total Kasus": myReports.length, "Total Poin": myReports.reduce((acc, curr) => acc + curr.points, 0) };
        }
      })
      .filter(row => row["Nama Santri"].toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a["Nama Santri"].localeCompare(b["Nama Santri"]));
  }, [classFilter, sessionFilter, levelFilter, genderFilter, searchTerm, students, data, activeTab, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const handleDownload = () => {
    downloadCSV(tableData, `Rekap_${activeTab}_${classFilter}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex gap-2 border border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'kbm', label: 'Absen KBM', icon: <ClipboardCheck size={18}/> },
          { id: 'pondok', label: 'Absen Pondok', icon: <Zap size={18}/> },
          { id: 'pelanggaran', label: 'Pelanggaran', icon: <ShieldAlert size={18}/> },
          { id: 'prestasi', label: 'Prestasi', icon: <Trophy size={18}/> },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as any); setSessionFilter('Semua'); }} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-sm space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Pilih Unit Kelas</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">
                 <option value="">-- PILIH KELAS --</option>
                 {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {(activeTab === 'kbm' || activeTab === 'pondok') && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner appearance-none cursor-pointer">
                   <option value="Semua">Semua Sesi</option>
                   {activeTab === 'kbm' ? 
                     ['Madrasah', 'Hadis-Aswaja', 'Kitab Kuning', 'Al-Quran'].map(s => <option key={s} value={s}>{s}</option>) :
                     ['Subuh', 'Dhuha', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Lalaran', 'Khataman', 'Senam'].map(s => <option key={s} value={s}>{s}</option>)
                   }
                </select>
             </div>
           )}
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner cursor-pointer">
                 <option value="Semua">Semua</option>
                 <option value="MTs">MTs</option>
                 <option value="MA">MA</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gender</label>
              <select disabled={isGenderRestricted} value={isGenderRestricted ? targetGender : genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner disabled:opacity-50">
                 <option value="Semua">Semua</option>
                 <option value="Putra">Putra</option>
                 <option value="Putri">Putri</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cari Nama</label>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                 <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Ketik nama..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none text-[10px] font-bold shadow-inner" />
              </div>
           </div>
        </div>
        {classFilter && (
           <div className="flex justify-end pt-4 border-t border-slate-50">
              <button onClick={handleDownload} className="px-8 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                 <FileSpreadsheet size={18}/> Unduh (.CSV)
              </button>
           </div>
        )}
      </div>

      <div className="bg-white p-10 rounded-[4.5rem] border border-slate-50 shadow-xl overflow-hidden min-h-[400px]">
         {!classFilter ? (
           <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-20">
              <Users size={64}/>
              <p className="text-[11px] font-black uppercase tracking-[0.3em]">Silakan Pilih Kelas Terlebih Dahulu</p>
           </div>
         ) : (
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b-2 border-slate-50">
                       <th className="pb-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Santri</th>
                       {activeTab === 'kbm' || activeTab === 'pondok' ? (
                         <>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Hadir</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Sakit</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Izin</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Alpha</th>
                           {activeTab === 'pondok' && <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Udzur</th>}
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-600 tracking-widest">% Hadir</th>
                         </>
                       ) : (
                         <>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-red-500 tracking-widest">Total Kasus</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-600 tracking-widest">Total Poin</th>
                         </>
                       )}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {tableData.map((row: any, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                         <td className="py-6">
                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{row["Nama Santri"]}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{row["NIS"]}</p>
                         </td>
                         {activeTab === 'kbm' || activeTab === 'pondok' ? (
                           <>
                             <td className="py-6 text-center text-[10px] font-black text-slate-600">{row["Hadir"]}</td>
                             <td className="py-6 text-center text-[10px] font-black text-blue-500">{row["Sakit"]}</td>
                             <td className="py-6 text-center text-[10px] font-black text-amber-500">{row["Izin"]}</td>
                             <td className="py-6 text-center text-[10px] font-black text-red-500">{row["Alpha"]}</td>
                             {activeTab === 'pondok' && <td className="py-6 text-center text-[10px] font-black text-indigo-500">{row["Udzur"]}</td>}
                             <td className="py-6 text-center">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${row["Persentase"] === '0%' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700'}`}>
                                   {row["Persentase"]}
                                </span>
                             </td>
                           </>
                         ) : (
                           <>
                             <td className="py-6 text-center text-[10px] font-black">{row["Total Kasus"]}</td>
                             <td className="py-6 text-center text-[10px] font-black text-emerald-700">{row["Total Poin"]}</td>
                           </>
                         )}
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
