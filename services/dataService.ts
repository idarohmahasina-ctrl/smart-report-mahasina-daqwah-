
import { 
  UserProfile, AttendanceRecord, ReportItem, TeacherAttendance, Student,
  Teacher, Schedule, OrganizationMember, UserRole, TemplateItem, AcademicConfig,
  PrayerRecord, Announcement
} from '../types';
import { 
  MOCK_STUDENTS, MOCK_TEACHERS, MOCK_SCHEDULE, PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS,
  MOCK_ORSAM, MOCK_ORKLAS
} from '../constants';

const STORAGE_KEY = 'mahasina_report_v2';
const SYNC_KEY = 'mahasina_sync_meta';
const SESSION_KEY = 'mahasina_active_session';
const TEAM_DB_ID_KEY = 'mahasina_team_database_id';

export interface ExtraDataList {
  id: string;
  title: string;
  data: any[];
  uploadedAt: string;
}

export interface AppData {
  attendance: AttendanceRecord[];
  prayerAttendance: PrayerRecord[];
  teacherAttendance: TeacherAttendance[];
  reports: ReportItem[];
  students: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  orsam: OrganizationMember[];
  orklas: OrganizationMember[];
  announcements: Announcement[];
  academicConfig: AcademicConfig;
  extraDataLists: ExtraDataList[];
  violationTemplates: TemplateItem[];
  achievementTemplates: TemplateItem[];
  lastUpdate?: string;
}

const initialData: AppData = {
  attendance: [],
  prayerAttendance: [],
  teacherAttendance: [],
  reports: [],
  students: [],
  teachers: [],
  schedules: [],
  orsam: [],
  orklas: [],
  announcements: [],
  academicConfig: {
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false,
    sessionHolidays: {}
  },
  extraDataLists: [],
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
};

// Fungsi Baru: Normalisasi Nama (Hapus Gelar & Tanda Baca)
export const normalizeName = (name: string): string => {
  if (!name) return '';
  let clean = name.toLowerCase();
  
  // Daftar Gelar & Kata yang dibuang
  const titles = [
    'ustadzah', 'ustadz', 'ustd', 'ust', 'kyai', 'nyai', 'habib', 'syarifah',
    'h.', 'hj.', 'dra.', 'dr.', 'drs.', 'prof.',
    ', lc', ', m.pd', ', s.pd', ', s.t', ', s.h', ', m.a', ', m.ag', ', s.ag', ', m.si',
    ' lc', ' m.pd', ' s.pd', ' s.t', ' s.h', ' m.a', ' m.ag', ' s.ag', ' m.si', ' s.kom'
  ];

  titles.forEach(t => {
    clean = clean.split(t).join('');
  });

  // Hapus tanda baca sisa dan spasi berlebih
  return clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s\s+/g, ' ').trim();
};

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialData;
  }
};

export const saveAppData = (data: Partial<AppData>) => {
  const current = getAppData();
  const newData = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  localStorage.setItem(SYNC_KEY, JSON.stringify({ pending: true, timestamp: new Date().toISOString() }));
};

export const getTeachersFromSchedules = (schedules: Schedule[]): string[] => {
  const names = schedules.map(s => s.teacherName.trim()).filter(Boolean);
  return Array.from(new Set(names)).sort();
};

export const setTeamDatabaseId = (id: string) => localStorage.setItem(TEAM_DB_ID_KEY, id);
export const getTeamDatabaseId = () => localStorage.getItem(TEAM_DB_ID_KEY);

export const getActiveSession = (): UserProfile | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const setActiveSession = (u: UserProfile | null) => {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const getUsers = (): UserProfile[] => {
  const data = getAppData();
  const users: UserProfile[] = data.teachers.map(t => ({
    id: t.id,
    fullName: t.name,
    phone: t.phone,
    email: t.email,
    role: t.isWaliKelas ? UserRole.MUSYRIF : UserRole.GURU,
    classes: t.teachingClasses
  }));
  const adminEmail = 'idarohmahasina@gmail.com';
  if (!users.some(u => u.email.toLowerCase() === adminEmail)) {
    users.push({ id: 'u-admin', fullName: 'Admin Idaroh', phone: '-', email: adminEmail, role: UserRole.IDAROH, classes: [] });
  }
  return users;
};

export const clearAppData = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('mahasina_cloud_token');
  localStorage.removeItem('mahasina_cloud_connected');
};

export const getSyncStatus = () => {
  const s = localStorage.getItem(SYNC_KEY);
  return s ? JSON.parse(s) : { pending: false };
};

export const syncWithGDrive = async (token: string) => { return true; };
export const pullFromGDrive = async (token: string) => { return true; };
