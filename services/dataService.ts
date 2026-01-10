
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
  databaseId?: string;
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

// LOGIKA JOIN LINK: Bersihkan segalanya jika ada ID tim baru
const urlParams = new URLSearchParams(window.location.search);
const joinId = urlParams.get('join');
if (joinId) {
  const currentId = localStorage.getItem(TEAM_DB_ID_KEY);
  if (currentId !== joinId) {
    // Reset total untuk memastikan re-auth dan re-sync
    localStorage.clear(); 
    sessionStorage.clear();
    localStorage.setItem(TEAM_DB_ID_KEY, joinId);
    localStorage.setItem('mahasina_mock_disabled', 'true');
    // Hilangkan parameter dari URL dan refresh
    window.location.href = window.location.pathname; 
  }
}

export const setTeamDatabaseId = (id: string) => {
  localStorage.setItem(TEAM_DB_ID_KEY, id);
};

export const getTeamDatabaseId = () => {
  return localStorage.getItem(TEAM_DB_ID_KEY);
};

const mergeData = (local: AppData, cloud: AppData): AppData => {
  const combine = (arr1: any[], arr2: any[]) => {
    const map = new Map();
    [...(arr1 || []), ...(arr2 || [])].forEach(item => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  // KRUSIAL: Jika Cloud ada isinya, Master Data (Siswa/Guru/Jadwal) HARUS ikut Cloud
  return {
    ...cloud, 
    attendance: combine(local.attendance, cloud.attendance),
    prayerAttendance: combine(local.prayerAttendance, cloud.prayerAttendance),
    teacherAttendance: combine(local.teacherAttendance, cloud.teacherAttendance),
    reports: combine(local.reports, cloud.reports),
    students: (cloud.students && cloud.students.length > 0) ? cloud.students : local.students,
    teachers: (cloud.teachers && cloud.teachers.length > 0) ? cloud.teachers : local.teachers,
    schedules: (cloud.schedules && cloud.schedules.length > 0) ? cloud.schedules : local.schedules,
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
    
    // Cari file jika ID belum ada
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
      localStorage.setItem('mahasina_mock_disabled', 'true');
      localStorage.setItem(SYNC_KEY, JSON.stringify({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false }));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Pull failed:", error);
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

export const linkTeacherEmail = (teacherId: string, email: string) => {
  const current = getAppData();
  const updatedTeachers = current.teachers.map(t => 
    t.id === teacherId ? { ...t, email: email.toLowerCase().trim() } : t
  );
  saveAppData({ teachers: updatedTeachers });
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
  localStorage.removeItem('mahasina_cloud_connected');
};
