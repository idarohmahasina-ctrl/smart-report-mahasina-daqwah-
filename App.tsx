
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './views/Attendance.tsx';
import Reports from './views/Reports.tsx';
import Information from './views/Information.tsx';
import Settings from './views/Settings.tsx';
import PrayerAttendance from './views/PrayerAttendance.tsx';
import ControlPanel from './views/ControlPanel.tsx';
import { 
  UserProfile, 
  AttendanceRecord, 
  ReportItem,
  Student,
  Teacher,
  Schedule,
  OrganizationMember,
  TeacherAttendance,
  TemplateItem,
  AcademicConfig,
  PrayerRecord,
  Announcement
} from './types.ts';
import { 
  getAppData, 
  saveAppData, 
  clearAppData, 
  AppData, 
  getSyncStatus, 
  getUsers, 
  syncWithGDrive,
  pullFromGDrive,
  getActiveSession,
  setActiveSession,
  ExtraDataList,
  getTeamDatabaseId
} from './services/dataService.ts';
import { 
  APP_LOGO, 
  MOCK_STUDENTS, 
  MOCK_TEACHERS, 
  MOCK_SCHEDULE, 
  MOCK_ORSAM, 
  MOCK_ORKLAS, 
  PREDEFINED_VIOLATIONS, 
  PREDEFINED_ACHIEVEMENTS, 
  CLASSES as DEFAULT_CLASSES 
} from './constants.tsx';
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [prayerAttendance, setPrayerAttendance] = useState<PrayerRecord[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [orsam, setOrsam] = useState<OrganizationMember[]>([]);
  const [orklas, setOrklas] = useState<OrganizationMember[]>([]);
  const [extraDataLists, setExtraDataLists] = useState<ExtraDataList[]>([]);
  const [violationTemplates, setViolationTemplates] = useState<TemplateItem[]>([]);
  const [achievementTemplates, setAchievementTemplates] = useState<TemplateItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig>({
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false,
    sessionHolidays: {}
  });

  const [loading, setLoading] = useState(true);
  const [isSyncingInitial, setIsSyncingInitial] = useState(false);

  const loadLocalData = useCallback(() => {
    const data = getAppData();
    const isMockDisabled = localStorage.getItem('mahasina_mock_disabled') === 'true';
    const isFirstTime = !localStorage.getItem('mahasina_report_v2') && !isMockDisabled;

    setAttendance(data.attendance || []);
    setPrayerAttendance(data.prayerAttendance || []);
    setReports(data.reports || []);
    setTeacherAttendance(data.teacherAttendance || []);
    
    setStudents(data.students.length > 0 ? data.students : (isFirstTime ? MOCK_STUDENTS : []));
    setTeachers(data.teachers.length > 0 ? data.teachers : (isFirstTime ? MOCK_TEACHERS : []));
    setSchedules(data.schedules.length > 0 ? data.schedules : (isFirstTime ? MOCK_SCHEDULE : []));
    
    setOrsam(data.orsam.length > 0 ? data.orsam : (isFirstTime ? MOCK_ORSAM : []));
    setOrklas(data.orklas.length > 0 ? data.orklas : (isFirstTime ? MOCK_ORKLAS : []));
    
    setExtraDataLists(data.extraDataLists || []);
    setViolationTemplates(data.violationTemplates?.length > 0 ? data.violationTemplates : PREDEFINED_VIOLATIONS);
    setAchievementTemplates(data.achievementTemplates?.length > 0 ? data.achievementTemplates : PREDEFINED_ACHIEVEMENTS);
    setAnnouncements(data.announcements || []);
    setAcademicConfig(data.academicConfig);
  }, []);

  // AUTO-SYNC EFFECT: Tarik data otomatis saat app terbuka
  useEffect(() => {
    const autoPull = async () => {
      const token = localStorage.getItem('mahasina_cloud_token');
      const dbId = getTeamDatabaseId();
      if (token && dbId) {
        setIsSyncingInitial(true);
        const success = await pullFromGDrive(token);
        if (success) {
          loadLocalData();
        }
        setIsSyncingInitial(false);
      }
    };
    autoPull();
  }, [loadLocalData]);

  useEffect(() => {
    const activeUser = getActiveSession();
    if (activeUser) {
      const allUsers = getUsers();
      const latestUser = allUsers.find(u => u.email.toLowerCase() === activeUser.email.toLowerCase()) || activeUser;
      setProfile(latestUser);
    }
    loadLocalData();
    setLoading(false);
  }, [loadLocalData]);

  const updateMasterData = (type: string, data: any[]) => {
    const update: Partial<AppData> = {};
    if (type === 'Siswa') { setStudents(data); update.students = data; }
    if (type === 'Guru') { setTeachers(data); update.teachers = data; }
    if (type === 'Jadwal') { setSchedules(data); update.schedules = data; }
    if (type === 'ORSAM') { setOrsam(data); update.orsam = data; }
    if (type === 'ORKLAS') { setOrklas(data); update.orklas = data; }
    if (type === 'ExtraDataLists') { setExtraDataLists(data); update.extraDataLists = data; }
    if (type === 'Violations') { setViolationTemplates(data); update.violationTemplates = data; }
    if (type === 'Achievements') { setAchievementTemplates(data); update.achievementTemplates = data; }
    if (type === 'Announcements') { setAnnouncements(data); update.announcements = data; }
    
    localStorage.setItem('mahasina_mock_disabled', 'true');
    saveAppData(update);
  };

  const handleRegistrationComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    // Tidak perlu reload berat, biarkan effect autoPull bekerja
  };

  const handleLogout = () => {
    if (confirm("Keluar dari sistem? Anda wajib login ulang dengan email nanti.")) {
      clearAppData();
      setProfile(null);
      window.location.reload();
    }
  };

  const handleUpdateAcademic = (newConfig: AcademicConfig) => {
    setAcademicConfig(newConfig);
    saveAppData({ academicConfig: newConfig });
  };

  const handleTeacherCheckIn = (record: TeacherAttendance) => {
    const updated = [...teacherAttendance, record];
    setTeacherAttendance(updated);
    saveAppData({ teacherAttendance: updated });
  };

  const handleTeacherCheckOut = (attendanceId: string) => {
    const now = new Date();
    const updated = teacherAttendance.map(a => 
      a.id === attendanceId 
      ? { ...a, checkOutTime: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } 
      : a
    );
    setTeacherAttendance(updated);
    saveAppData({ teacherAttendance: updated });
  };

  const handleDeleteTeacherAttendance = (id: string) => {
    const updated = teacherAttendance.filter(a => a.id !== id);
    setTeacherAttendance(updated);
    saveAppData({ teacherAttendance: updated });
  };

  const handleResetMasterData = (type: string) => {
    let mockData: any[] = [];
    if (type === 'Siswa') mockData = MOCK_STUDENTS;
    if (type === 'Guru') mockData = MOCK_TEACHERS;
    if (type === 'Jadwal') mockData = MOCK_SCHEDULE;
    if (type === 'ORSAM') mockData = MOCK_ORSAM;
    if (type === 'ORKLAS') mockData = MOCK_ORKLAS;
    if (type === 'Peraturan') {
        updateMasterData('Violations', PREDEFINED_VIOLATIONS);
        updateMasterData('Achievements', PREDEFINED_ACHIEVEMENTS);
        return;
    }
    updateMasterData(type, mockData);
  };

  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    const updated = [...attendance, ...newRecords];
    setAttendance(updated);
    saveAppData({ attendance: updated });
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    const updated = attendance.map(a => a.id === record.id ? record : a);
    setAttendance(updated);
    saveAppData({ attendance: updated });
  };

  const handleSavePrayerAttendance = (newRecords: PrayerRecord[]) => {
    const updated = [...prayerAttendance, ...newRecords];
    setPrayerAttendance(updated);
    saveAppData({ prayerAttendance: updated });
  };

  const handleUpdatePrayerAttendance = (record: PrayerRecord) => {
    const updated = prayerAttendance.map(a => a.id === record.id ? record : a);
    setPrayerAttendance(updated);
    saveAppData({ prayerAttendance: updated });
  };

  const handleDeleteAttendance = (id: string) => {
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated);
    saveAppData({ attendance: updated });
  };

  const handleDeletePrayerRecord = (id: string) => {
    const updated = prayerAttendance.filter(a => a.id !== id);
    setPrayerAttendance(updated);
    saveAppData({ prayerAttendance: updated });
  };

  const handleSaveReport = (newReport: ReportItem) => {
    const existingIndex = reports.findIndex(r => r.id === newReport.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...reports];
      updated[existingIndex] = newReport;
    } else {
      updated = [newReport, ...reports];
    }
    setReports(updated);
    saveAppData({ reports: updated });
  };

  const handleDeleteReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    saveAppData({ reports: updated });
  };

  const availableClasses = useMemo(() => {
    if (students && students.length > 0) {
      const uniqueClasses = Array.from(new Set<string>(students.map(s => s.formalClass)))
        .filter(cls => cls && cls.trim() !== '')
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      return uniqueClasses.length > 0 ? uniqueClasses : DEFAULT_CLASSES;
    }
    return DEFAULT_CLASSES;
  }, [students]);

  if (loading || isSyncingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-950 text-white p-6 text-center">
        <div className="relative mb-8">
           <img src={APP_LOGO} className="w-24 h-24 animate-pulse bg-white p-2 rounded-full shadow-2xl" alt="Loading" />
           <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-black tracking-widest uppercase mb-2">Smart Report Mahasina</h2>
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] animate-bounce">
          {isSyncingInitial ? 'Menarik Data Terbaru Tim...' : 'Menyiapkan Dashboard...'}
        </p>
      </div>
    );
  }

  if (!profile) {
    return <Registration onComplete={handleRegistrationComplete} availableClasses={availableClasses} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            attendance={attendance} 
            reports={reports} 
            profile={profile} 
            students={students} 
            teacherAttendance={teacherAttendance}
            schedules={schedules}
            academicConfig={academicConfig}
            onDeleteReport={handleDeleteReport}
            onUpdateReport={handleSaveReport}
          />
        );
      case 'absen-guru':
        return (
          <Attendance 
            mode="Guru"
            onSave={handleSaveAttendance} 
            onTeacherCheckIn={handleTeacherCheckIn}
            onTeacherCheckOut={handleTeacherCheckOut}
            role={profile.role} 
            classes={profile.classes} 
            currentUser={profile.fullName}
            students={students}
            teacherAttendance={teacherAttendance}
            schedules={schedules}
            academicConfig={academicConfig}
          />
        );
      case 'absen-santri':
        return (
          <Attendance 
            mode="Santri"
            onSave={handleSaveAttendance} 
            onTeacherCheckIn={handleTeacherCheckIn}
            onTeacherCheckOut={handleTeacherCheckOut}
            role={profile.role} 
            classes={profile.classes} 
            currentUser={profile.fullName}
            students={students}
            teacherAttendance={teacherAttendance}
            schedules={schedules}
            academicConfig={academicConfig}
          />
        );
      case 'absen-sholat':
        return (
          <PrayerAttendance 
            students={students} 
            onSave={handleSavePrayerAttendance} 
            allPrayerRecords={prayerAttendance}
            currentUser={profile.fullName}
          />
        );
      case 'pelanggaran':
        return (
          <Reports 
            type="Violation" 
            onSave={handleSaveReport} 
            role={profile.role}
            currentUser={profile.fullName}
            students={students}
            allReports={reports}
            templates={violationTemplates}
          />
        );
      case 'prestasi':
        return (
          <Reports 
            type="Achievement" 
            onSave={handleSaveReport} 
            role={profile.role}
            currentUser={profile.fullName}
            students={students}
            allReports={reports}
            templates={achievementTemplates}
          />
        );
      case 'panel-kontrol':
        return (
          <ControlPanel 
            data={{
               attendance,
               prayerAttendance,
               teacherAttendance,
               reports,
               students
            }}
            actions={{
               deleteAttendance: handleDeleteAttendance,
               updateAttendance: handleUpdateAttendance,
               deletePrayer: handleDeletePrayerRecord,
               updatePrayer: handleUpdatePrayerAttendance,
               deleteTeacherAttendance: handleDeleteTeacherAttendance,
               deleteReport: handleDeleteReport,
               updateReport: handleSaveReport
            }}
            userEmail={profile.email}
          />
        );
      case 'informasi':
        return (
          <Information 
            role={profile.role} 
            userEmail={profile.email}
            data={{ 
              students, 
              teachers, 
              schedules, 
              orsam, 
              orklas, 
              extraDataLists,
              violationTemplates, 
              achievementTemplates,
              announcements
            }}
            onUpdateData={updateMasterData}
            onResetData={handleResetMasterData}
          />
        );
      case 'pengaturan':
        return (
          <Settings 
            userEmail={profile.email} 
            academicConfig={academicConfig} 
            onUpdateAcademic={handleUpdateAcademic}
            availableClasses={availableClasses}
          />
        );
      default:
        return <div>Tab not implemented yet</div>;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={profile.role}
        userName={profile.fullName}
        userEmail={profile.email}
        onLogout={handleLogout}
        academicConfig={academicConfig}
      >
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;
