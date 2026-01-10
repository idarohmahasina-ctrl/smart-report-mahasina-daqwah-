
import { 
  UserProfile, AttendanceRecord, ReportItem, TeacherAttendance, Student,
  Teacher, Schedule, OrganizationMember, UserRole, TemplateItem, AcademicConfig,
  PrayerRecord, Announcement
} from '../types';
import { 
  PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS
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
  academicConfig: { schoolYear: '2025/2026', semester: 'II (Genap)', isHoliday: false, sessionHolidays: {} },
  extraDataLists: [],
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
};

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  try {
    return { ...initialData, ...JSON.parse(data) };
  } catch (e) {
    return initialData;
  }
};

// --- AUTO CLOUD ENGINE ---

export const pushToGDrive = async (token: string): Promise<boolean> => {
  try {
    const dbId = localStorage.getItem(TEAM_DB_ID_KEY);
    const localData = getAppData();
    if (!dbId || !token) return false;

    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${dbId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(localData)
    });

    if (response.ok) {
      localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: false, timestamp: new Date().toISOString() }));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const saveAppData = (data: Partial<AppData>) => {
  const current = getAppData();
  const newData = { ...current, ...data, lastUpdate: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: true, timestamp: new Date().toISOString() }));
  
  // TRIGGER AUTO PUSH: Jika ada token, langsung kirim
  const token = localStorage.getItem('mahasina_cloud_token');
  if (token) {
    pushToGDrive(token);
  }
};

const merge = (local: any[], remote: any[]) => {
  const map = new Map();
  [...(remote || []), ...(local || [])].forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const pullFromGDrive = async (token: string): Promise<boolean> => {
  try {
    const dbId = localStorage.getItem(TEAM_DB_ID_KEY);
    if (!dbId || !token) return false;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${dbId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return false;
    const remoteData: AppData = await response.json();
    const localData = getAppData();

    // Silent Merge: Hanya update jika ada data baru
    const mergedData: AppData = {
      ...remoteData,
      attendance: merge(localData.attendance, remoteData.attendance),
      prayerAttendance: merge(localData.prayerAttendance, remoteData.prayerAttendance),
      teacherAttendance: merge(localData.teacherAttendance, remoteData.teacherAttendance),
      reports: merge(localData.reports, remoteData.reports),
      lastUpdate: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
    localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: false, timestamp: new Date().toISOString() }));
    return true;
  } catch (e) {
    return false;
  }
};

export const clearAppData = () => {
  localStorage.clear();
  sessionStorage.clear();
};

export const getActiveSession = (): UserProfile | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const setActiveSession = (u: UserProfile | null) => {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const setTeamDatabaseId = (id: string) => localStorage.setItem(TEAM_DB_ID_KEY, id);
export const getTeamDatabaseId = () => localStorage.getItem(TEAM_DB_ID_KEY);
export const getSyncStatus = () => {
  const s = localStorage.getItem(SYNC_KEY);
  return s ? JSON.parse(s) : { isNewLocal: false, timestamp: '' };
};

export const getTeachersFromSchedules = (schedules: Schedule[]): string[] => {
  const names = (schedules || []).map(s => s.teacherName?.trim()).filter(Boolean);
  return Array.from(new Set(names)).sort();
};

// Add normalizeName fix for Registration.tsx
/**
 * Normalizes a name for comparison by converting to lowercase, 
 * trimming, and removing extra spaces.
 */
export const normalizeName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

export const syncWithGDrive = pushToGDrive;

export const getUsers = (): UserProfile[] => {
  const data = getAppData();
  const users: UserProfile[] = (data.teachers || []).map(t => ({
    id: t.id, fullName: t.name, phone: t.phone, email: t.email, role: t.isWaliKelas ? UserRole.MUSYRIF : UserRole.GURU
  }));
  const adminEmail = 'idarohmahasina@gmail.com';
  if (!users.some(u => u.email.toLowerCase() === adminEmail)) {
    users.push({ id: 'u-admin', fullName: 'Admin Idaroh', phone: '-', email: adminEmail, role: UserRole.IDAROH });
  }
  return users;
};
