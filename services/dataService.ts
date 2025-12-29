
import { 
  UserProfile, 
  AttendanceRecord, 
  ReportItem, 
  TeacherAttendance,
  Student,
  Teacher,
  Schedule,
  OrganizationMember,
  UserRole,
  TemplateItem,
  AcademicConfig
} from '../types';

const STORAGE_KEY = 'mahasina_report_v2';
const USERS_KEY = 'mahasina_users_db_v2';
const SYNC_KEY = 'mahasina_sync_meta';

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
  attendance: [],
  teacherAttendance: [],
  reports: [],
  students: [],
  teachers: [],
  schedules: [],
  orsam: [],
  orklas: [],
  violationTemplates: [],
  achievementTemplates: [],
  academicConfig: {
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false
  }
};

export const getAppData = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  const parsed = JSON.parse(data);
  if (!parsed.academicConfig) parsed.academicConfig = initialData.academicConfig;
  return parsed;
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

// REAL GOOGLE DRIVE SYNC FUNCTIONS
export const syncWithGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const data = getAppData();
    const fileName = 'mahasina_backup.json';
    
    // 1. Search for existing file
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();
    
    const fileContent = JSON.stringify(data);
    const metadata = { name: fileName, mimeType: 'application/json' };
    
    if (searchData.files && searchData.files.length > 0) {
      // Update existing
      const fileId = searchData.files[0].id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: fileContent
      });
    } else {
      // Create new
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
    }
    
    saveSyncStatus({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false });
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
  if (users.find(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('Email sudah terdaftar.');
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

export const clearAppData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
