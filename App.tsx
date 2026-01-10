
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './views/Attendance.tsx';
import Reports from './views/Reports.tsx';
import Information from './views/Information.tsx';
import Settings from './views/Settings.tsx';
import PrayerAttendance from './views/PrayerAttendance.tsx';
import { 
  UserProfile, AttendanceRecord, ReportItem, Student, Teacher, Schedule, 
  OrganizationMember, TeacherAttendance, TemplateItem, AcademicConfig, 
  PrayerRecord, Announcement 
} from './types.ts';
import { 
  getAppData, saveAppData, clearAppData, AppData,
  pullFromGDrive, getActiveSession, 
  setActiveSession, ExtraDataList, setTeamDatabaseId 
} from './services/dataService.ts';
import { 
  PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS
} from './constants.tsx';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State Data Master & Transaksi
  const [appData, setAppData] = useState<AppData>(getAppData());

  const [loading, setLoading] = useState(true);

  // Fungsi tunggal untuk memuat data dari Local Storage ke State React
  const refreshUI = useCallback(() => {
    const data = getAppData();
    setAppData(data);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId) {
      setTeamDatabaseId(joinId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const activeUser = getActiveSession();
    if (activeUser) setProfile(activeUser);
    
    refreshUI();
    setLoading(false);

    // SILENT AUTO-PULL: Cek data baru setiap 15 detik
    const silentPullInterval = setInterval(() => {
      const token = localStorage.getItem('mahasina_cloud_token');
      if (token) {
        pullFromGDrive(token).then(hasChanges => {
          if (hasChanges) {
            refreshUI(); // Data master (santri dll) akan otomatis ter-update di layar
          }
        });
      }
    }, 15000);

    return () => clearInterval(silentPullInterval);
  }, [refreshUI]);

  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    const updated = [...appData.attendance, ...newRecords];
    saveAppData({ attendance: updated });
    refreshUI();
  };

  const handleSaveReport = (newReport: ReportItem) => {
    const updated = [newReport, ...appData.reports];
    saveAppData({ reports: updated });
    refreshUI();
  };

  const updateMasterData = (type: string, data: any[]) => {
    const update: Partial<AppData> = {};
    if (type === 'Siswa') update.students = data;
    if (type === 'Guru') update.teachers = data;
    if (type === 'Jadwal') update.schedules = data;
    
    saveAppData(update); // Simpan & Push ke Drive
    refreshUI(); // Update tampilan saat itu juga
    alert(`${type} berhasil diupload dan sedang dikirim ke Cloud...`);
  };

  const handleLogout = () => {
    clearAppData();
    setProfile(null);
    window.location.reload();
  };

  if (loading) return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center text-white font-black uppercase tracking-[0.3em]">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-white rounded-full animate-spin mb-6" />
      Memuat Data...
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
      academicConfig={appData.academicConfig}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          attendance={appData.attendance} 
          reports={appData.reports} 
          profile={profile} 
          students={appData.students} 
          teacherAttendance={appData.teacherAttendance} 
          schedules={appData.schedules} 
          academicConfig={appData.academicConfig} 
        />
      )}
      {activeTab === 'absen-santri' && (
        <Attendance 
          mode="Santri" 
          onSave={handleSaveAttendance} 
          onTeacherCheckIn={() => {}} 
          role={profile.role} 
          currentUser={profile.fullName} 
          students={appData.students} 
          teacherAttendance={appData.teacherAttendance} 
          schedules={appData.schedules} 
          academicConfig={appData.academicConfig} 
        />
      )}
      {activeTab === 'absen-sholat' && (
        <PrayerAttendance 
          students={appData.students} 
          onSave={(recs) => { 
            const updated = [...appData.prayerAttendance, ...recs];
            saveAppData({ prayerAttendance: updated }); 
            refreshUI();
          }} 
          allPrayerRecords={appData.prayerAttendance} 
          currentUser={profile.fullName} 
        />
      )}
      {activeTab === 'pelanggaran' && (
        <Reports 
          type="Violation" 
          onSave={handleSaveReport} 
          role={profile.role} 
          currentUser={profile.fullName} 
          students={appData.students} 
          allReports={appData.reports} 
          templates={appData.violationTemplates} 
        />
      )}
      {activeTab === 'prestasi' && (
        <Reports 
          type="Achievement" 
          onSave={handleSaveReport} 
          role={profile.role} 
          currentUser={profile.fullName} 
          students={appData.students} 
          allReports={appData.reports} 
          templates={appData.achievementTemplates} 
        />
      )}
      {activeTab === 'informasi' && (
        <Information 
          role={profile.role} 
          userEmail={profile.email} 
          data={appData} 
          onUpdateData={updateMasterData} 
        />
      )}
      {activeTab === 'pengaturan' && (
        <Settings 
          userEmail={profile.email} 
          academicConfig={appData.academicConfig} 
          onUpdateAcademic={(conf) => { saveAppData({ academicConfig: conf }); refreshUI(); }} 
          availableClasses={[]} 
        />
      )}
    </Layout>
  );
};

export default App;
