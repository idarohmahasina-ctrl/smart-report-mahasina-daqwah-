
import { 
  UserProfile, AttendanceRecord, ReportItem, TeacherAttendance, Student,
  Teacher, Schedule, OrganizationMember, UserRole, TemplateItem, AcademicConfig,
  PrayerRecord, Announcement
} from '../types';
import { 
  MOCK_STUDENTS, MOCK_TEACHERS, MOCK_SCHEDULE, MOCK_REPORTS, 
  MOCK_ATTENDANCE, MOCK_TEACHER_ATTENDANCE, PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS,
  MOCK_ORSAM, MOCK_ORKLAS
} from '../constants';

const STORAGE_KEY = 'mahasina_report_v2';
const USERS_KEY = 'mahasina_users_db_v2';
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
  databaseId?: string; // Menyimpan ID file unik tim
}

const initialData: AppData = {
  attendance: MOCK_ATTENDANCE,
  prayerAttendance: [],
  teacherAttendance: MOCK_TEACHER_ATTENDANCE,
  reports: MOCK_REPORTS,
  students: MOCK_STUDENTS,
  teachers: MOCK_TEACHERS,
  schedules: MOCK_SCHEDULE,
  orsam: MOCK_ORSAM,
  orklas: MOCK_ORKLAS,
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

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  try {
    return { ...initialData, ...JSON.parse(data) };
  } catch (e) {
    return initialData;
  }
};

export const setTeamDatabaseId = (id: string) => {
  localStorage.setItem(TEAM_DB_ID_KEY, id);
};

export const getTeamDatabaseId = () => {
  return localStorage.getItem(TEAM_DB_ID_KEY);
};

const mergeData = (local: AppData, cloud: AppData): AppData => {
  const combine = (arr1: any[], arr2: any[]) => {
    const map = new Map();
    [...(arr2 || []), ...(arr1 || [])].forEach(item => {
      if (item && item.id) {
        const existing = map.get(item.id);
        if (!existing || (item.updatedAt && item.updatedAt > (existing.updatedAt || 0))) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };

  return {
    ...cloud,
    attendance: combine(local.attendance, cloud.attendance),
    prayerAttendance: combine(local.prayerAttendance, cloud.prayerAttendance),
    teacherAttendance: combine(local.teacherAttendance, cloud.teacherAttendance),
    reports: combine(local.reports, cloud.reports),
    students: cloud.students?.length > 0 ? cloud.students : local.students,
    lastUpdate: new Date().toISOString()
  };
};

export const saveAppData = (data: Partial<AppData>) => {
  const current = getAppData();
  const newData = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  
  localStorage.setItem(SYNC_KEY, JSON.stringify({ 
    pending: true, 
    timestamp: new Date().toISOString(),
    isNewLocal: true 
  }));
};

const GLOBAL_DB_NAME = 'mahasina_universal_db.json';

export const syncWithGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const localData = getAppData();
    let fileId = getTeamDatabaseId();
    
    // Jika belum punya ID, cari berdasarkan nama
    if (!fileId) {
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${GLOBAL_DB_NAME}' and trashed=false`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        fileId = searchData.files[0].id;
        setTeamDatabaseId(fileId!);
      }
    }

    let finalData = localData;

    if (fileId) {
      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (fileRes.ok) {
        const cloudData = await fileRes.json();
        finalData = mergeData(localData, cloudData);
      }
    }

    const fileContent = JSON.stringify(finalData);

    if (fileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: fileContent
      });
    } else {
      const metadata = { name: GLOBAL_DB_NAME, mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));
      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
      const createData = await createRes.json();
      if (createData.id) setTeamDatabaseId(createData.id);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
    localStorage.setItem(SYNC_KEY, JSON.stringify({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false }));
    return true;
  } catch (error) {
    return false;
  }
};

export const pullFromGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const fileId = getTeamDatabaseId();
    if (!fileId) return false;

    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (fileRes.ok) {
      const cloudData = await fileRes.json();
      const localData = getAppData();
      const merged = mergeData(localData, cloudData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const getUsers = (): UserProfile[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerUser = (user: UserProfile) => {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === user.email.toLowerCase())) return;
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
};

export const updateUser = (user: UserProfile) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index === -1) return;
  const updatedUsers = [...users];
  updatedUsers[index] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const updatedUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
};

export const getActiveSession = (): UserProfile | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const setActiveSession = (u: UserProfile | null) => {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const getSyncStatus = () => {
  const s = localStorage.getItem(SYNC_KEY);
  return s ? JSON.parse(s) : { pending: false, isNewLocal: false };
};

export const clearAppData = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('mahasina_cloud_token');
};
