
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/utils/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './Attendance.tsx';
import TeacherAttendanceView from './views/TeacherAttendance.tsx';
import Reports from './views/utils/Reports.tsx';
import Information from './views/utils/Information.tsx';
import Settings from './views/Settings.tsx';
import ControlPanel from './views/ControlPanel.tsx';
import RekapLaporan from './views/RekapLaporan.tsx';
import PrayerAttendance from './views/utils/PrayerAttendance.tsx';
import { UserProfile, AppData, UserRole, TeacherAttendance, AcademicConfig, TemplateItem } from './types.ts';
import { 
  saveAppData, getActiveSession, subscribeToAppData, setActiveSession 
} from './services/dataService.ts';
import { ShieldAlert, UserCheck } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(getActiveSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const unsubscribe = subscribeToAppData((data) => {
      if (data) setAppData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [loading]);

  const handleLogout = () => {
    setActiveSession(null);
    setProfile(null);
    window.location.reload();
  };

  const defaultAcademicConfig: AcademicConfig = { 
    schoolYear: '2024/2025', 
    semester: 'II (Genap)', 
    isHoliday: false, 
    excludedClasses: {},
    excludedSessions: {} 
  };

  const currentAppData: AppData = {
    students: appData?.students || [],
    teachers: appData?.teachers || [],
    schedules: appData?.schedules || [],
    attendance: appData?.attendance || [],
    teacherAttendance: appData?.teacherAttendance || [],
    reports: appData?.reports || [],
    prayerAttendance: appData?.prayerAttendance || [],
    orsam: appData?.orsam || [],
    orklas: appData?.orklas || [],
    violationTemplates: appData?.violationTemplates || [],
    achievementTemplates: appData?.achievementTemplates || [],
    extraDataLists: appData?.extraDataLists || [],
    announcements: appData?.announcements || [],
    academicConfig: appData?.academicConfig || defaultAcademicConfig
  };

  if (loading && !appData) return (
    <div className="h-screen bg-[#064e3b] flex flex-col items-center justify-center text-white space-y-6">
      <div className="w-16 h-16 border-4 border-emerald-400 border-t-white rounded-full animate-spin" />
      <p className="font-black uppercase tracking-[0.5em] text-[10px]">Mahasina Cloud Sync...</p>
    </div>
  );

  if (!profile) return <Registration onComplete={(p) => setProfile(p)} />;

  if (profile.isBlocked) return (
    <div className="h-screen bg-red-950 flex flex-col items-center justify-center text-white p-10 text-center space-y-6">
       <ShieldAlert size={80} className="text-red-500 animate-bounce" />
       <h1 className="text-2xl font-black uppercase tracking-tight">Akses Anda Diblokir</h1>
       <p className="text-sm font-medium opacity-60 max-w-md">Akun Anda telah dinonaktifkan oleh Admin Idaroh Mahasina.</p>
       <button onClick={handleLogout} className="px-8 py-4 bg-white text-red-950 rounded-2xl font-black text-xs uppercase tracking-widest">Logout</button>
    </div>
  );

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      role={profile.role}
      userName={profile.fullName}
      userEmail={profile.email}
      onLogout={handleLogout}
      academicConfig={currentAppData.academicConfig}
    >
      {activeTab === 'dashboard' && <Dashboard {...currentAppData} profile={profile} />}
      
      {activeTab === 'absen-guru' && (
        <TeacherAttendanceView 
          data={currentAppData} 
          profile={profile} 
          onSave={(record: TeacherAttendance) => {
            saveAppData({ teacherAttendance: [...(currentAppData.teacherAttendance || []), record] });
          }} 
        />
      )}

      {activeTab === 'absen-kbm' && <Attendance {...currentAppData} role={profile.role} currentUser={profile.fullName} onSave={(recs:any) => saveAppData({ attendance: [...currentAppData.attendance, ...recs] })} />}
      
      {activeTab === 'absen-sholat' && (
        <PrayerAttendance 
          students={currentAppData.students} 
          allPrayerRecords={currentAppData.prayerAttendance} 
          currentUser={profile.fullName} 
          onSave={recs => saveAppData({ prayerAttendance: [...(currentAppData.prayerAttendance || []), ...recs] })} 
        />
      )}

      {activeTab === 'input-pelanggaran' && (
        <Reports 
          type="Violation" 
          role={profile.role} 
          currentUser={profile.fullName} 
          students={currentAppData.students} 
          allReports={currentAppData.reports} 
          templates={currentAppData.violationTemplates} 
          schedules={currentAppData.schedules}
          onSave={rep => saveAppData({ reports: [rep, ...(currentAppData.reports || [])] })} 
        />
      )}
      
      {activeTab === 'input-prestasi' && (
        <Reports 
          type="Achievement" 
          role={profile.role} 
          currentUser={profile.fullName} 
          students={currentAppData.students} 
          allReports={currentAppData.reports} 
          templates={currentAppData.achievementTemplates} 
          schedules={currentAppData.schedules}
          onSave={rep => saveAppData({ reports: [rep, ...(currentAppData.reports || [])] })} 
        />
      )}

      {activeTab === 'rekap-laporan' && <RekapLaporan data={currentAppData} profile={profile} />}

      {activeTab === 'informasi' && <Information role={profile.role} userEmail={profile.email} data={currentAppData} onUpdateData={(type, newData) => {
         const update: any = {};
         if (type === 'Siswa') update.students = newData;
         if (type === 'Guru') update.teachers = newData;
         if (type === 'Jadwal') update.schedules = newData;
         if (type === 'ORSAM') update.orsam = newData;
         if (type === 'ORKLAS') update.orklas = newData;
         if (type === 'Peraturan') {
            update.violationTemplates = newData.filter((n: any) => n.type === 'Pelanggaran').map(({type, ...rest}) => rest);
            update.achievementTemplates = newData.filter((n: any) => n.type === 'Prestasi').map(({type, ...rest}) => rest);
         }
         saveAppData(update);
      }} />}
      
      {activeTab === 'panel-kontrol' && <ControlPanel data={currentAppData} actions={{
         deleteAttendance: id => saveAppData({ attendance: currentAppData.attendance.filter(a => a.id !== id) }),
         deletePrayer: id => saveAppData({ prayerAttendance: currentAppData.prayerAttendance.filter(p => p.id !== id) }),
         deleteReport: id => saveAppData({ reports: currentAppData.reports.filter(r => r.id !== id) }),
         deleteTeacherAttendance: id => saveAppData({ teacherAttendance: currentAppData.teacherAttendance.filter(ta => ta.id !== id) }),
         updateAttendance: updated => saveAppData({ attendance: currentAppData.attendance.map(a => a.id === updated.id ? updated : a) }),
         updatePrayer: updated => saveAppData({ prayerAttendance: currentAppData.prayerAttendance.map(p => p.id === updated.id ? updated : p) }),
         updateReport: updated => saveAppData({ reports: currentAppData.reports.map(r => r.id === updated.id ? updated : r) }),
         updateTeacherAttendance: updated => saveAppData({ teacherAttendance: currentAppData.teacherAttendance.map(ta => ta.id === updated.id ? updated : ta) })
      }} />}

      {activeTab === 'pengaturan' && <Settings userEmail={profile.email} academicConfig={currentAppData.academicConfig} onUpdateAcademic={c => saveAppData({ academicConfig: c })} students={currentAppData.students} availableClasses={[]} />}
    </Layout>
  );
};

export default App;
