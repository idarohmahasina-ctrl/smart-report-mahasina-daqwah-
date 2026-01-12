
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/utils/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './Attendance.tsx';
import Reports from './views/utils/Reports.tsx';
import Information from './views/utils/Information.tsx';
import Settings from './views/Settings.tsx';
import PrayerAttendance from './views/utils/PrayerAttendance.tsx';
import ControlPanel from './views/ControlPanel.tsx';
import { 
  UserProfile, AttendanceRecord, ReportItem, Student, Teacher, Schedule, 
  OrganizationMember, TeacherAttendance, TemplateItem, AcademicConfig, 
  PrayerRecord, Announcement 
} from './types.ts';
import { 
  getAppData, saveAppData, clearAppData, AppData,
  pullFromGDrive, getActiveSession, 
  setActiveSession, setTeamDatabaseId, getTeamDatabaseId 
} from './services/dataService.ts';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appData, setAppData] = useState<AppData>(getAppData());
  const [loading, setLoading] = useState(true);

  const refreshUI = useCallback(() => {
    const data = getAppData();
    setAppData(data);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId && joinId !== "null") {
      setTeamDatabaseId(joinId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const activeUser = getActiveSession();
    if (activeUser) {
      setProfile(activeUser);
      refreshUI();
    }
    setLoading(false);

    const syncInterval = setInterval(() => {
      const token = localStorage.getItem('mahasina_cloud_token');
      if (token && getTeamDatabaseId()) {
        pullFromGDrive(token).then(hasNewData => {
          if (hasNewData) refreshUI();
        });
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [refreshUI]);

  const handleLogout = () => {
    clearAppData();
    setProfile(null);
    window.location.reload();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#064e3b] flex flex-col items-center justify-center text-white space-y-6">
      <div className="w-16 h-16 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
      <p className="font-black uppercase tracking-[0.4em] text-[10px]">Smart Report Mahasina</p>
    </div>
  );

  if (!profile) return <Registration onComplete={(p) => { setProfile(p); refreshUI(); }} />;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      role={profile.role}
      userName={profile.fullName}
      userEmail={profile.email}
      onLogout={handleLogout}
      academicConfig={appData.academicConfig}
    >
      <div className="animate-slide-up">
        {activeTab === 'dashboard' && <Dashboard {...appData} profile={profile} />}
        {activeTab === 'absen-santri' && <Attendance mode="Santri" role={profile.role} currentUser={profile.fullName} {...appData} onSave={recs => { saveAppData({ attendance: [...appData.attendance, ...recs] }); refreshUI(); }} onTeacherCheckIn={() => {}} />}
        {activeTab === 'absen-sholat' && <PrayerAttendance students={appData.students} allPrayerRecords={appData.prayerAttendance} currentUser={profile.fullName} onSave={recs => { saveAppData({ prayerAttendance: [...appData.prayerAttendance, ...recs] }); refreshUI(); }} />}
        {activeTab === 'pelanggaran' && <Reports type="Violation" role={profile.role} currentUser={profile.fullName} students={appData.students} allReports={appData.reports} templates={appData.violationTemplates} onSave={rep => { saveAppData({ reports: [rep, ...appData.reports] }); refreshUI(); }} />}
        {activeTab === 'prestasi' && <Reports type="Achievement" role={profile.role} currentUser={profile.fullName} students={appData.students} allReports={appData.reports} templates={appData.achievementTemplates} onSave={rep => { saveAppData({ reports: [rep, ...appData.reports] }); refreshUI(); }} />}
        {activeTab === 'informasi' && <Information role={profile.role} userEmail={profile.email} data={appData} onUpdateData={(t, d) => { const update: any = {}; if (t==='Siswa') update.students = d; if (t==='Guru') update.teachers = d; if (t==='Jadwal') update.schedules = d; saveAppData(update); refreshUI(); }} />}
        {activeTab === 'control-panel' && <ControlPanel data={appData} actions={{
          deleteAttendance: id => { if(confirm("Hapus data ini?")) { saveAppData({ attendance: appData.attendance.filter(a => a.id !== id) }); refreshUI(); } },
          deletePrayer: id => { if(confirm("Hapus data ini?")) { saveAppData({ prayerAttendance: appData.prayerAttendance.filter(p => p.id !== id) }); refreshUI(); } },
          deleteReport: id => { if(confirm("Hapus data ini?")) { saveAppData({ reports: appData.reports.filter(r => r.id !== id) }); refreshUI(); } }
        }} />}
        {activeTab === 'pengaturan' && <Settings userEmail={profile.email} academicConfig={appData.academicConfig} onUpdateAcademic={c => { saveAppData({ academicConfig: c }); refreshUI(); }} availableClasses={[]} />}
      </div>
    </Layout>
  );
};

export default App;
