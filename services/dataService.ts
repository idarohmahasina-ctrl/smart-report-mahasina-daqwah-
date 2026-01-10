
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

// --- DRIVE DISCOVERY ENGINE ---

export const findDatabaseInDrive = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='mahasina_db.json' and trashed=false&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      const id = data.files[0].id;
      localStorage.setItem(TEAM_DB_ID_KEY, id);
      return id;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const createDatabaseInDrive = async (token: string): Promise<string | null> => {
  try {
    const metadata = {
      name: 'mahasina_db.json',
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(initialData)], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    
    const data = await response.json();
    if (data.id) {
      localStorage.setItem(TEAM_DB_ID_KEY, data.id);
      return data.id;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// --- SYNC ENGINE ---

export const pushToGDrive = async (token: string): Promise<boolean> => {
  try {
    let dbId = localStorage.getItem(TEAM_DB_ID_KEY);
    if (!dbId) {
      dbId = await findDatabaseInDrive(token);
      if (!dbId) dbId = await createDatabaseInDrive(token);
    }
    
    if (!dbId || !token) return false;

    const localData = getAppData();
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

const merge = (local: any[], remote: any[]) => {
  const map = new Map();
  (remote || []).forEach(item => { if (item && item.id) map.set(item.id, item); });
  (local || []).forEach(item => { if (item && item.id) map.set(item.id, item); });
  return Array.from(map.values());
};

export const pullFromGDrive = async (token: string): Promise<boolean> => {
  try {
    let dbId = localStorage.getItem(TEAM_DB_ID_KEY);
    if (!dbId) {
      dbId = await findDatabaseInDrive(token);
    }
    
    if (!dbId || !token) return false;

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${dbId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return false;
    
    const remoteData: AppData = await response.json();
    const localData = getAppData();

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

export const saveAppData = (data: Partial<AppData>) => {
  const current = getAppData();
  const newData = { ...current, ...data, lastUpdate: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: true, timestamp: new Date().toISOString() }));
  
  const token = localStorage.getItem('mahasina_cloud_token');
  if (token) pushToGDrive(token);
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

export const clearAppData = () => {
  localStorage.clear();
  sessionStorage.clear();
};

/**
 * Robust Normalization: Menghapus gelar-gelar umum di Mahasina 
 * agar pencocokan nama lebih akurat.
 */
export const normalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/(ustadz|ustadzah|ust|usth|kyai|nyai|ibu|bapak|pak|bu|dr|h\.|hj\.)/g, '') // Hapus gelar
    .replace(/[.,]/g, '') // Hapus titik koma
    .trim()
    .replace(/\s+/g, ' '); // Sederhanakan spasi
};

export const getTeachersFromSchedules = (schedules: Schedule[]): string[] => {
  const names = (schedules || []).map(s => s.teacherName?.trim()).filter(Boolean);
  return Array.from(new Set(names)).sort();
};

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
