
import React, { useState, useMemo } from 'react';
import { 
  AppData, AttendanceStatus, Student, AttendanceRecord, 
  PrayerRecord, ReportItem, PrayerStatus, UserRole 
} from '../types.ts';
import { 
  Search, Download, Users, ClipboardCheck, Zap, 
  ShieldAlert, Trophy, Filter, User, Percent, Star
} from 'lucide-react';
import { downloadCSV } from './utils/csvExport.ts';
import { isTeacherMatch } from './utils/nameMatchers.ts';

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
  const role = profile?.role;

  // LOGIKA HAK AKSES
  const isAdminOrPengasuh = role === UserRole.IDAROH || role === UserRole.PENGASUH;
  const isGenderRestricted = role === UserRole.SANTRI_OFFICER_PUTRA || role === UserRole.SANTRI_OFFICER_PUTRI;
  const targetGender = role === UserRole.SANTRI_OFFICER_PUTRA ? 'Putra' : 'Putri';
  
  // Ambil daftar kelas binaan
  const myManagedClasses = useMemo(() => {
    if (isAdminOrPengasuh || isGenderRestricted) return []; 
    return Array.from(new Set(
      data.schedules
        .filter(s => isTeacherMatch(profile.fullName, s.teacherName, s.assistantTeacherName))
        .map(s => s.class)
    ));
  }, [data.schedules, profile, isAdminOrPengasuh, isGenderRestricted]);

  const isClassRestricted = (role === UserRole.GURU || role === UserRole.MUSYRIF) && !isAdminOrPengasuh;

  // Mendapatkan daftar unik kelas yang BOLEH dilihat oleh user
  const availableClasses = useMemo(() => {
    let cls = new Set<string>();
    students.forEach(s => {
      // Jika petugas santri, hanya masukkan kelas yang punya santri dengan gender tsb
      if (isGenderRestricted && s.gender !== targetGender) return;
      
      // Jika guru/musyrif, hanya masukkan kelas binaannya
      if (isClassRestricted && !myManagedClasses.includes(s.formalClass)) return;

      if (s.formalClass) cls.add(s.formalClass);
      Object.values(s.sessionClasses || {}).forEach(c => { if(c) cls.add(c as string); });
    });
    return Array.from(cls).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const availableSessions = useMemo(() => {
    const sess = new Set<string>(['Madrasah', 'Subuh', 'Dhuha', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Lalaran Ahad Malam']);
    students.forEach(s => {
      Object.keys(s.sessionClasses || {}).forEach(k => sess.add(k));
    });
    return Array.from(sess).sort();
  }, [students]);

  // LOGIKA REKAP ABSENSI
  const rekapAbsenData = useMemo(() => {
    if (!classFilter) return [];

    return students
      .filter(s => {
        // Filter Dasar (Peran & Role)
        const matchRoleGender = !isGenderRestricted || s.gender === targetGender;
        const matchRoleClass = !isClassRestricted || myManagedClasses.includes(s.formalClass);

        // Filter UI
        const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
        const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        
        return matchRoleGender && matchRoleClass && matchLvl && matchGdr && isStudentInClass;
      })
      .map(s => {
        const allAtt = [...(data.attendance || []), ...(data.prayerAttendance || [])].filter(a => 
          (a as any).studentId === s.id && 
          (sessionFilter === 'Semua' || (a as any).sessionType === sessionFilter || (a as any).prayerTime === sessionFilter)
        );

        const counts = { H: 0, S: 0, I: 0, T: 0, A: 0 };
        allAtt.forEach(a => {
          const st = (a as any).status;
          if (st === AttendanceStatus.H || st === "Berjama'ah") counts.H++;
          else if (st === AttendanceStatus.S || st === "Sakit") counts.S++;
          else if (st === AttendanceStatus.I || st === "Izin") counts.I++;
          else if (st === AttendanceStatus.T || st === "Terlambat") counts.T++;
          else if (st === AttendanceStatus.A || st === "Alpha") counts.A++;
        });

        const totalSesi = counts.H + counts.S + counts.I + counts.T + counts.A;
        const percentage = totalSesi > 0 ? Math.round((counts.H / totalSesi) * 100) : 0;

        return {
          id: s.id,
          name: s.name,
          nisn: s.nis,
          class: classFilter,
          ...counts,
          total: totalSesi,
          percentage: `${percentage}%`
        };
      })
      .filter(row => row.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classFilter, sessionFilter, levelFilter, genderFilter, searchTerm, students, data, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  // LOGIKA REKAP PELANGGARAN & PRESTASI
  const rekapVPData = useMemo(() => {
    if (!classFilter) return [];

    return students
      .filter(s => {
        const matchRoleGender = !isGenderRestricted || s.gender === targetGender;
        const matchRoleClass = !isClassRestricted || myManagedClasses.includes(s.formalClass);

        const matchLvl = levelFilter === 'Semua' || s.level === levelFilter;
        const matchGdr = genderFilter === 'Semua' || s.gender === genderFilter;
        const isStudentInClass = s.formalClass === classFilter || Object.values(s.sessionClasses || {}).includes(classFilter);
        return matchRoleGender && matchRoleClass && matchLvl && matchGdr && isStudentInClass;
      })
      .map(s => {
        const myReports = (data.reports || []).filter(r => r.studentId === s.id);
        const violations = myReports.filter(r => r.type === 'Violation');
        const achievements = myReports.filter(r => r.type === 'Achievement');

        return {
          id: s.id,
          name: s.name,
          nisn: s.nis,
          class: classFilter,
          totalViolation: violations.length,
          pointViolation: violations.reduce((acc, curr) => acc + curr.points, 0),
          totalAchievement: achievements.length,
          pointAchievement: achievements.reduce((acc, curr) => acc + curr.points, 0)
        };
      })
      .filter(row => row.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classFilter, levelFilter, genderFilter, searchTerm, students, data, isGenderRestricted, targetGender, isClassRestricted, myManagedClasses]);

  const handleDownload = () => {
    const fileName = activeMainTab === 'absen' ? `Rekap_Absensi_${classFilter}` : `Rekap_VP_${classFilter}`;
    const csvData = activeMainTab === 'absen' ? rekapAbsenData : rekapVPData;
    downloadCSV(csvData, fileName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm flex gap-2 border border-slate-100 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveMainTab('absen')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeMainTab === 'absen' ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} >
          <ClipboardCheck size={18}/> Rekap Absensi
        </button>
        <button onClick={() => setActiveMainTab('vp')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeMainTab === 'vp' ? 'bg-[#064e3b] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`} >
          <ShieldAlert size={18}/> Rekap Pelanggaran & Prestasi
        </button>
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-sm space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Unit Kelas</label>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner border-2 border-transparent focus:border-emerald-600 appearance-none cursor-pointer">
                 <option value="">-- PILIH KELAS --</option>
                 {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
           {activeMainTab === 'absen' && (
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Sesi Absensi</label>
                <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner appearance-none cursor-pointer">
                   <option value="Semua">Semua Sesi</option>
                   {availableSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
           )}
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tingkatan</label>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner appearance-none cursor-pointer">
                 <option value="Semua">Semua</option>
                 <option value="MTs">MTs</option>
                 <option value="MA">MA</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gender</label>
              <select disabled={isGenderRestricted} value={isGenderRestricted ? targetGender : genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none shadow-inner appearance-none cursor-pointer disabled:opacity-50">
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
              <button onClick={handleDownload} className="px-8 py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                 <Download size={18}/> Unduh Rekap (CSV)
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
                       {activeMainTab === 'absen' ? (
                         <>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Hadir</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Sakit</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Izin</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Late</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Alpha</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-600 tracking-widest">% Hadir</th>
                         </>
                       ) : (
                         <>
                           <th className="pb-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">NISN</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-red-400 tracking-widest">Pelanggaran</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-red-600 tracking-widest">Poin (-)</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-400 tracking-widest">Prestasi</th>
                           <th className="pb-6 text-center text-[9px] font-black uppercase text-emerald-600 tracking-widest">Poin (+)</th>
                         </>
                       )}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(activeMainTab === 'absen' ? rekapAbsenData : rekapVPData).map(row => (
                      <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                         <td className="py-6">
                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{row.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{row.class}</p>
                         </td>
                         {activeMainTab === 'absen' ? (
                           <>
                             <td className="py-6 text-center text-[10px] font-black text-slate-600">{(row as any).H}</td>
                             <td className="py-6 text-center text-[10px] font-black text-blue-500">{(row as any).S}</td>
                             <td className="py-6 text-center text-[10px] font-black text-amber-500">{(row as any).I}</td>
                             <td className="py-6 text-center text-[10px] font-black text-orange-500">{(row as any).T}</td>
                             <td className="py-6 text-center text-[10px] font-black text-red-500">{(row as any).A}</td>
                             <td className="py-6 text-center">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${(row as any).percentage === '0%' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700'}`}>
                                   {(row as any).percentage}
                                </span>
                             </td>
                           </>
                         ) : (
                           <>
                             <td className="py-6 text-[10px] font-black text-slate-400">{row.nisn}</td>
                             <td className="py-6 text-center text-[10px] font-black text-red-400">{(row as any).totalViolation}</td>
                             <td className="py-6 text-center text-[10px] font-black text-red-600">{(row as any).pointViolation}</td>
                             <td className="py-6 text-center text-[10px] font-black text-emerald-400">{(row as any).totalAchievement}</td>
                             <td className="py-6 text-center text-[10px] font-black text-emerald-600">{(row as any).pointAchievement}</td>
                           </>
                         )}
                      </tr>
                    ))}
                 </tbody>
              </table>
              {(activeMainTab === 'absen' ? rekapAbsenData : rekapVPData).length === 0 && (
                 <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-[0.3em] text-[10px]">Tidak ada data ditemukan</div>
              )}
           </div>
         )}
      </div>
    </div>
  );
};

export default RekapLaporan;
