
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
    schoolYear: '2025/2026', semester: 'II (Genap)', isHoliday: false, sessionHolidays: {}
  });

  const [loading, setLoading] = useState(true);

  const loadLocalState = useCallback(() => {
    const data = getAppData();
    setAttendance(data.attendance || []);
    setPrayerAttendance(data.prayerAttendance || []);
    setReports(data.reports || []);
    setTeacherAttendance(data.teacherAttendance || []);
    setStudents(data.students || []);
    setTeachers(data.teachers || []);
    setSchedules(data.schedules || []);
    setOrsam(data.orsam || []);
    setOrklas(data.orklas || []);
    setExtraDataLists(data.extraDataLists || []);
    setViolationTemplates(data.violationTemplates || PREDEFINED_VIOLATIONS);
    setAchievementTemplates(data.achievementTemplates || PREDEFINED_ACHIEVEMENTS);
    setAnnouncements(data.announcements || []);
    setAcademicConfig(data.academicConfig);
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
    
    loadLocalState();
    setLoading(false);

    // SILENT AUTO-PULL (Tarik data otomatis dari ustadz lain setiap 20 detik)
    const silentPullInterval = setInterval(() => {
      const token = localStorage.getItem('mahasina_cloud_token');
      if (token) {
        pullFromGDrive(token).then(success => {
          if (success) loadLocalState(); // Refresh UI jika ada data baru masuk
        });
      }
    }, 20000);

    return () => clearInterval(silentPullInterval);
  }, [loadLocalState]);

  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    const updated = [...attendance, ...newRecords];
    setAttendance(updated);
    saveAppData({ attendance: updated }); // Akan otomatis Push ke Drive
  };

  const handleSaveReport = (newReport: ReportItem) => {
    const updated = [newReport, ...reports];
    setReports(updated);
    saveAppData({ reports: updated }); // Akan otomatis Push ke Drive
  };

  const updateMasterData = (type: string, data: any[]) => {
    const update: Partial<AppData> = {};
    if (type === 'Siswa') { setStudents(data); update.students = data; }
    if (type === 'Guru') { setTeachers(data); update.teachers = data; }
    if (type === 'Jadwal') { setSchedules(data); update.schedules = data; }
    saveAppData(update);
  };

  const handleLogout = () => {
    clearAppData();
    setProfile(null);
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-white font-black uppercase tracking-widest">Mengkoneksikan...</div>;
  if (!profile) return <Registration onComplete={(p) => setProfile(p)} />;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      role={profile.role}
      userName={profile.fullName}
      userEmail={profile.email}
      onLogout={handleLogout}
      academicConfig={academicConfig}
    >
      {activeTab === 'dashboard' && <Dashboard attendance={attendance} reports={reports} profile={profile} students={students} teacherAttendance={teacherAttendance} schedules={schedules} academicConfig={academicConfig} />}
      {activeTab === 'absen-santri' && <Attendance mode="Santri" onSave={handleSaveAttendance} onTeacherCheckIn={() => {}} role={profile.role} currentUser={profile.fullName} students={students} teacherAttendance={teacherAttendance} schedules={schedules} academicConfig={academicConfig} />}
      {activeTab === 'absen-sholat' && <PrayerAttendance students={students} onSave={(recs) => { setPrayerAttendance([...prayerAttendance, ...recs]); saveAppData({ prayerAttendance: [...prayerAttendance, ...recs] }); }} allPrayerRecords={prayerAttendance} currentUser={profile.fullName} />}
      {activeTab === 'pelanggaran' && <Reports type="Violation" onSave={handleSaveReport} role={profile.role} currentUser={profile.fullName} students={students} allReports={reports} templates={violationTemplates} />}
      {activeTab === 'informasi' && <Information role={profile.role} userEmail={profile.email} data={{ students, teachers, schedules, orsam, orklas, extraDataLists, violationTemplates, achievementTemplates, announcements }} onUpdateData={updateMasterData} />}
      {activeTab === 'pengaturan' && <Settings userEmail={profile.email} academicConfig={academicConfig} onUpdateAcademic={() => {}} availableClasses={[]} />}
    </Layout>
  );
};

export default App;
