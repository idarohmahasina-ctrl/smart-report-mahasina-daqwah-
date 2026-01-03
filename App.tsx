
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './views/Attendance.tsx';
import Reports from './views/Reports.tsx';
import Information from './views/Information.tsx';
import Settings from './views/Settings.tsx';
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
  AcademicConfig
} from './types.ts';
import { 
  getAppData, 
  saveAppData, 
  clearAppData, 
  AppData, 
  getSyncStatus, 
  getUsers, 
  syncWithGDrive,
  getActiveSession,
  setActiveSession
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
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [orsam, setOrsam] = useState<OrganizationMember[]>([]);
  const [orklas, setOrklas] = useState<OrganizationMember[]>([]);
  const [violationTemplates, setViolationTemplates] = useState<TemplateItem[]>([]);
  const [achievementTemplates, setAchievementTemplates] = useState<TemplateItem[]>([]);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig>({
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false
  });

  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const availableClasses = useMemo(() => {
    if (students && students.length > 0) {
      const uniqueClasses = Array.from(new Set<string>(students.map(s => s.formalClass)))
        .filter(cls => cls && cls.trim() !== '')
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      return uniqueClasses.length > 0 ? uniqueClasses : DEFAULT_CLASSES;
    }
    return DEFAULT_CLASSES;
  }, [students]);

  useEffect(() => {
    const activeUser = getActiveSession();
    const data = getAppData();
    
    if (activeUser) {
      const allUsers = getUsers();
      const latestUser = allUsers.find(u => u.email.toLowerCase() === activeUser.email.toLowerCase()) || activeUser;
      setProfile(latestUser);
    }

    setAttendance(data.attendance || []);
    setReports(data.reports || []);
    setTeacherAttendance(data.teacherAttendance || []);
    
    setStudents(data.students.length > 0 ? data.students : MOCK_STUDENTS);
    setTeachers(data.teachers.length > 0 ? data.teachers : MOCK_TEACHERS);
    setSchedules(data.schedules.length > 0 ? data.schedules : MOCK_SCHEDULE);
    setOrsam(data.orsam.length > 0 ? data.orsam : MOCK_ORSAM);
    setOrklas(data.orklas.length > 0 ? data.orklas : MOCK_ORKLAS);
    setViolationTemplates(data.violationTemplates?.length > 0 ? data.violationTemplates : PREDEFINED_VIOLATIONS);
    setAchievementTemplates(data.achievementTemplates?.length > 0 ? data.achievementTemplates : PREDEFINED_ACHIEVEMENTS);
    setAcademicConfig(data.academicConfig);
    
    setLoading(false);
  }, []);

  const triggerAutoSync = useCallback(async () => {
    const status = getSyncStatus();
    const cloudConnected = localStorage.getItem('mahasina_cloud_connected') === 'true';
    const token = localStorage.getItem('mahasina_cloud_token');

    if (cloudConnected && token && status.isNewLocal) {
      setSyncState('syncing');
      try {
        const success = await syncWithGDrive(token);
        if (success) {
          setSyncState('success');
          setTimeout(() => setSyncState('idle'), 3000);
        } else {
          setSyncState('error');
          setTimeout(() => setSyncState('idle'), 5000);
        }
      } catch (e) {
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 5000);
      }
    }
  }, []);

  const handleRegistrationComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    triggerAutoSync();
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
    triggerAutoSync();
  };

  const handleTeacherCheckIn = (record: TeacherAttendance) => {
    const updated = [...teacherAttendance, record];
    setTeacherAttendance(updated);
    saveAppData({ teacherAttendance: updated });
    triggerAutoSync();
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
    triggerAutoSync();
  };

  const handleDeleteTeacherAttendance = (id: string) => {
    const updated = teacherAttendance.filter(a => a.id !== id);
    setTeacherAttendance(updated);
    saveAppData({ teacherAttendance: updated });
    triggerAutoSync();
  };

  const updateMasterData = (type: string, data: any[]) => {
    const update: Partial<AppData> = {};
    if (type === 'Siswa') { setStudents(data); update.students = data; }
    if (type === 'Guru') { setTeachers(data); update.teachers = data; }
    if (type === 'Jadwal') { setSchedules(data); update.schedules = data; }
    if (type === 'ORSAM') { setOrsam(data); update.orsam = data; }
    if (type === 'ORKLAS') { setOrklas(data); update.orklas = data; }
    if (type === 'Violations') { setViolationTemplates(data); update.violationTemplates = data; }
    if (type === 'Achievements') { setAchievementTemplates(data); update.achievementTemplates = data; }
    saveAppData(update);
    triggerAutoSync();
  };

  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    const updated = [...attendance, ...newRecords];
    setAttendance(updated);
    saveAppData({ attendance: updated });
    triggerAutoSync();
  };

  const handleDeleteAttendance = (id: string) => {
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated);
    saveAppData({ attendance: updated });
    triggerAutoSync();
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
    triggerAutoSync();
  };

  const handleDeleteReport = (id: string) => {
    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    saveAppData({ reports: updated });
    triggerAutoSync();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-950 text-white p-6 text-center">
        <img src={APP_LOGO} className="w-24 h-24 animate-pulse mb-6 bg-white p-2 rounded-full shadow-2xl" alt="Loading" />
        <p className="text-xl font-black tracking-tighter uppercase leading-none">Smart Report<br/>Mahasina</p>
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
            academicConfig={academicConfig} // Ditambahkan
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
              violationTemplates, 
              achievementTemplates 
            }}
            onUpdateData={updateMasterData}
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
      {syncState !== 'idle' && (
        <div className={`fixed bottom-8 left-8 lg:left-80 z-[2000] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-6 transition-all duration-500 border-2 ${
          syncState === 'syncing' ? 'bg-white border-emerald-500 text-emerald-800' : 
          syncState === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
        }`}>
          {syncState === 'syncing' && <RefreshCw size={18} className="animate-spin" />}
          {syncState === 'success' && <CheckCircle size={18} />}
          {syncState === 'error' && <AlertCircle size={18} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {syncState === 'syncing' ? 'Sinkronisasi Data...' : 
             syncState === 'success' ? 'Update Berhasil' : 'Koneksi Terputus'}
          </span>
        </div>
      )}
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
