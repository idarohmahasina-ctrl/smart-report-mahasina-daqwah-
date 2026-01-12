
import { 
  UserProfile, AttendanceRecord, ReportItem, TeacherAttendance, Student,
  Teacher, Schedule, OrganizationMember, UserRole, TemplateItem, AcademicConfig,
  PrayerRecord, Announcement
} from '../types';
import { 
  PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS,
  MOCK_STUDENTS, MOCK_TEACHERS, MOCK_SCHEDULE, MOCK_ATTENDANCE, MOCK_REPORTS, MOCK_PRAYER
} from '../constants';

const STORAGE_KEY = 'mahasina_report_v2';
const SYNC_KEY = 'mahasina_sync_meta';
const SESSION_KEY = 'mahasina_active_session';
const TEAM_DB_ID_KEY = 'mahasina_team_database_id';

export interface ExtraDataList {
  id: string;
  name: string;
  data: any[];
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
  attendance: MOCK_ATTENDANCE,
  prayerAttendance: MOCK_PRAYER,
  teacherAttendance: [],
  reports: MOCK_REPORTS,
  students: MOCK_STUDENTS,
  teachers: MOCK_TEACHERS,
  schedules: MOCK_SCHEDULE,
  orsam: [],
  orklas: [],
  announcements: [],
  academicConfig: { schoolYear: '2024/2025', semester: 'II (Genap)', isHoliday: false, sessionHolidays: {} },
  extraDataLists: [],
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
};

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  try {
    const parsed = JSON.parse(data);
    return { ...initialData, ...parsed };
  } catch (e) {
    return initialData;
  }
};

export const saveAppDataLocal = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getSyncStatus = () => {
  const meta = localStorage.getItem(SYNC_KEY);
  if (!meta) return { isNewLocal: false, timestamp: '' };
  try {
    return JSON.parse(meta);
  } catch (e) {
    return { isNewLocal: false, timestamp: '' };
  }
};

const smartMerge = (local: any[], remote: any[]) => {
  const map = new Map();
  (local || []).forEach(item => { if (item?.id) map.set(item.id, item); });
  (remote || []).forEach(item => { if (item?.id) map.set(item.id, item); });
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
    if (!remoteData) return false;

    const localData = getAppData();
    const mergedData: AppData = {
      ...remoteData,
      attendance: smartMerge(localData.attendance, remoteData.attendance),
      prayerAttendance: smartMerge(localData.prayerAttendance, remoteData.prayerAttendance),
      teacherAttendance: smartMerge(localData.teacherAttendance, remoteData.teacherAttendance),
      reports: smartMerge(localData.reports, remoteData.reports),
      lastUpdate: remoteData.lastUpdate || new Date().toISOString()
    };

    saveAppDataLocal(mergedData);
    localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: false, timestamp: new Date().toISOString() }));
    return true;
  } catch (e) {
    return false;
  }
};

export const pushToGDrive = async (token: string): Promise<boolean> => {
  try {
    const dbId = localStorage.getItem(TEAM_DB_ID_KEY);
    if (!dbId || !token) return false;

    const localData = getAppData();
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${dbId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...localData, lastUpdate: new Date().toISOString() })
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
  saveAppDataLocal(newData);
  localStorage.setItem(SYNC_KEY, JSON.stringify({ isNewLocal: true, timestamp: new Date().toISOString() }));
  
  const token = localStorage.getItem('mahasina_cloud_token');
  if (token) pushToGDrive(token);
};

export const findDatabaseInDrive = async (token: string): Promise<string | null> => {
  const existingId = localStorage.getItem(TEAM_DB_ID_KEY);
  if (existingId) return existingId;

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='mahasina_db.json' and trashed=false&fields=files(id, name)&orderBy=modifiedTime desc`,
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
    const metadata = { name: 'mahasina_db.json', mimeType: 'application/json' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(initialData)], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
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

export const setActiveSession = (u: UserProfile | null) => {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const getActiveSession = (): UserProfile | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const setTeamDatabaseId = (id: string) => {
  if (id && id !== "null") {
    localStorage.setItem(TEAM_DB_ID_KEY, id);
  }
};

export const getTeamDatabaseId = () => localStorage.getItem(TEAM_DB_ID_KEY);

export const clearAppData = () => {
  sessionStorage.clear();
  localStorage.removeItem(SYNC_KEY);
};
