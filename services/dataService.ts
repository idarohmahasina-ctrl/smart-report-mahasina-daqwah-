
import { 
  UserProfile, AttendanceRecord, ReportItem, TeacherAttendance, Student,
  Teacher, Schedule, OrganizationMember, UserRole, TemplateItem, AcademicConfig
} from '../types';
// Fixed typo in PREDEFINED_ACHIEVEMENTS import
import { 
  MOCK_STUDENTS, MOCK_TEACHERS, MOCK_SCHEDULE, MOCK_REPORTS, 
  MOCK_ATTENDANCE, MOCK_TEACHER_ATTENDANCE, PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS 
} from '../constants';

const STORAGE_KEY = 'mahasina_report_v2';
const USERS_KEY = 'mahasina_users_db_v2';
const SYNC_KEY = 'mahasina_sync_meta';
const SESSION_KEY = 'mahasina_active_session';

export interface AppData {
  profile: UserProfile | null;
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendance[];
  reports: ReportItem[];
  students: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  orsam: OrganizationMember[];
  orklas: OrganizationMember[];
  violationTemplates: TemplateItem[];
  achievementTemplates: TemplateItem[];
  academicConfig: AcademicConfig;
  lastSynced?: string;
}

const initialData: AppData = {
  profile: null,
  attendance: MOCK_ATTENDANCE,
  teacherAttendance: MOCK_TEACHER_ATTENDANCE,
  reports: MOCK_REPORTS,
  students: MOCK_STUDENTS,
  teachers: MOCK_TEACHERS,
  schedules: MOCK_SCHEDULE,
  orsam: [],
  orklas: [],
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
  academicConfig: {
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false,
    // Add missing required property from AcademicConfig interface
    sessionHolidays: {}
  }
};

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  const parsed = JSON.parse(data);
  // Merge missing keys with initial data to prevent crashes
  return { ...initialData, ...parsed };
};

export const saveAppData = (data: Partial<AppData>) => {
  const current = getAppData();
  const newData = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  
  const status = getSyncStatus();
  localStorage.setItem(SYNC_KEY, JSON.stringify({ 
    ...status,
    pending: true, 
    timestamp: new Date().toISOString(),
    isNewLocal: true 
  }));
};

export const getSyncStatus = () => {
  const status = localStorage.getItem(SYNC_KEY);
  return status ? JSON.parse(status) : { pending: false, timestamp: null, isNewLocal: false, autoSync: true };
};

export const saveSyncStatus = (status: any) => {
  localStorage.setItem(SYNC_KEY, JSON.stringify(status));
};

export const syncWithGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const data = getAppData();
    const fileName = 'mahasina_backup.json';
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!searchRes.ok) throw new Error('Failed to search GDrive');
    const searchData = await searchRes.json();
    const fileContent = JSON.stringify(data);
    const metadata = { name: fileName, mimeType: 'application/json' };
    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: fileContent
      });
    } else {
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
    }
    saveSyncStatus({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false, autoSync: true });
    return true;
  } catch (error) {
    console.error('GDrive Sync Error:', error);
    return false;
  }
};

export const getUsers = (): UserProfile[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerUser = (user: UserProfile) => {
  const users = getUsers();
  const emailLower = user.email.toLowerCase().trim();
  if (users.find(u => u.email.toLowerCase().trim() === emailLower)) {
    throw new Error('Email sudah terdaftar. Silakan gunakan menu Login.');
  }
  const updatedUsers = [...users, user];
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
};

export const updateUser = (updatedUser: UserProfile) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
};

export const getActiveSession = (): UserProfile | null => {
  const session = sessionStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const setActiveSession = (user: UserProfile | null) => {
  if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const clearAppData = () => {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('mahasina_cloud_token');
  localStorage.removeItem('mahasina_cloud_connected');
};
