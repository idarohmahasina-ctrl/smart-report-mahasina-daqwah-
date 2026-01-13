
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
import { UserProfile, AppData, UserRole, TeacherAttendance } from './types.ts';
import { 
  saveAppData, getActiveSession, subscribeToAppData, setActiveSession 
} from './services/dataService.ts';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(getActiveSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout as fallback for infinite loading during slow sync
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

  const currentAppData: AppData = appData || {
    students: [],
    teachers: [],
    schedules: [],
    attendance: [],
    teacherAttendance: [],
    reports: [],
    prayerAttendance: [],
    orsam: [],
    orklas: [],
    violationTemplates: [],
    achievementTemplates: [],
    extraDataLists: [],
    announcements: [],
    academicConfig: { schoolYear: '2024/2025', semester: 'II (Genap)', isHoliday: false, excludedClasses: {} }
  };

  if (loading && !appData) return (
    <div className="h-screen bg-[#064e3b] flex flex-col items-center justify-center text-white space-y-6">
      <div className="w-16 h-16 border-4 border-emerald-400 border-t-white rounded-full animate-spin" />
      <p className="font-black uppercase tracking-[0.5em] text-[10px]">Mahasina Cloud Sync...</p>
    </div>
  );

  if (!profile) return <Registration onComplete={(p) => setProfile(p)} />;

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

      {activeTab === 'absen-santri' && <Attendance {...currentAppData} role={profile.role} currentUser={profile.fullName} onSave={(recs:any) => saveAppData({ attendance: [...currentAppData.attendance, ...recs] })} />}
      
      {activeTab === 'input-pelanggaran' && <Reports type="Violation" role={profile.role} currentUser={profile.fullName} students={currentAppData.students} allReports={currentAppData.reports} templates={currentAppData.violationTemplates} onSave={rep => saveAppData({ reports: [rep, ...currentAppData.reports] })} />}
      
      {activeTab === 'input-prestasi' && <Reports type="Achievement" role={profile.role} currentUser={profile.fullName} students={currentAppData.students} allReports={currentAppData.reports} templates={currentAppData.achievementTemplates} onSave={rep => saveAppData({ reports: [rep, ...currentAppData.reports] })} />}

      {activeTab === 'informasi' && <Information role={profile.role} userEmail={profile.email} data={currentAppData} onUpdateData={(type, newData) => {
         const update: any = {};
         if (type === 'Siswa') update.students = newData;
         if (type === 'Guru') update.teachers = newData;
         if (type === 'Jadwal') update.schedules = newData;
         saveAppData(update);
      }} />}
      
      {activeTab === 'panel-kontrol' && <ControlPanel data={currentAppData} actions={{
         deleteAttendance: id => saveAppData({ attendance: currentAppData.attendance.filter(a => a.id !== id) }),
         deletePrayer: id => saveAppData({ prayerAttendance: currentAppData.prayerAttendance.filter(p => p.id !== id) }),
         deleteReport: id => saveAppData({ reports: currentAppData.reports.filter(r => r.id !== id) })
      }} />}

      {activeTab === 'pengaturan' && <Settings userEmail={profile.email} academicConfig={currentAppData.academicConfig} onUpdateAcademic={c => saveAppData({ academicConfig: c })} availableClasses={[]} />}
    </Layout>
  );
};

export default App;
