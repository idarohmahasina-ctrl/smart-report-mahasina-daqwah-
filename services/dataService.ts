
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

export interface ExtraDataList {
  id: string;
  title: string;
  data: any[];
  uploadedAt: string;
}

export interface AppData {
  profile: UserProfile | null;
  attendance: AttendanceRecord[];
  prayerAttendance: PrayerRecord[];
  teacherAttendance: TeacherAttendance[];
  reports: ReportItem[];
  students: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  orsam: OrganizationMember[];
  orklas: OrganizationMember[];
  extraDataLists: ExtraDataList[];
  violationTemplates: TemplateItem[];
  achievementTemplates: TemplateItem[];
  announcements: Announcement[];
  academicConfig: AcademicConfig;
  lastSynced?: string;
}

const initialData: AppData = {
  profile: null,
  attendance: MOCK_ATTENDANCE,
  prayerAttendance: [],
  teacherAttendance: MOCK_TEACHER_ATTENDANCE,
  reports: MOCK_REPORTS,
  students: MOCK_STUDENTS,
  teachers: MOCK_TEACHERS,
  schedules: MOCK_SCHEDULE,
  orsam: MOCK_ORSAM,
  orklas: MOCK_ORKLAS,
  extraDataLists: [],
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
  announcements: [
    {
      id: 'ann-1',
      title: 'Selamat Datang di Smart Report Mahasina',
      content: 'Gunakan aplikasi ini untuk memantau absensi dan pelaporan santri secara real-time. Mohon ustadz/ah melakukan sinkronisasi setiap selesai menginput.',
      date: new Date().toLocaleDateString('id-ID'),
      author: 'Idaroh Pusat',
      priority: 'Normal'
    }
  ],
  academicConfig: {
    schoolYear: '2025/2026',
    semester: 'II (Genap)',
    isHoliday: false,
    sessionHolidays: {}
  }
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

// Fungsi Pintar untuk Menggabungkan Data (Merge)
const mergeData = (local: AppData, cloud: AppData): AppData => {
  const mergeById = (localArr: any[], cloudArr: any[]) => {
    const map = new Map();
    [...(cloudArr || []), ...(localArr || [])].forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  return {
    ...cloud, // Prioritaskan config dari cloud (Admin)
    profile: local.profile, // Profile tetap lokal
    attendance: mergeById(local.attendance, cloud.attendance),
    prayerAttendance: mergeById(local.prayerAttendance, cloud.prayerAttendance),
    teacherAttendance: mergeById(local.teacherAttendance, cloud.teacherAttendance),
    reports: mergeById(local.reports, cloud.reports),
    // Master data biasanya hanya diubah oleh Admin, jadi kita ambil yang terbaru
    students: cloud.students?.length > 0 ? cloud.students : local.students,
    teachers: cloud.teachers?.length > 0 ? cloud.teachers : local.teachers,
    schedules: cloud.schedules?.length > 0 ? cloud.schedules : local.schedules,
    announcements: mergeById(local.announcements, cloud.announcements),
    lastSynced: new Date().toISOString()
  };
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

const FILE_NAME = 'mahasina_backup.json';

// PUSH (Kirim & Merge ke Cloud)
export const syncWithGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const localData = getAppData();
    
    // 1. Cari file di Drive
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();
    
    let finalData = localData;
    let fileId = null;

    // 2. Jika file ada, tarik dulu dan merge agar tidak menimpa data orang lain
    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
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
      // Update file yang ada
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: fileContent
      });
    } else {
      // Buat file baru jika belum ada sama sekali
      const metadata = { name: FILE_NAME, mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
    }

    // Update lokal dengan hasil merge
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
    saveSyncStatus({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false, autoSync: true });
    return true;
  } catch (error) {
    console.error('GDrive Sync Error:', error);
    return false;
  }
};

// PULL (Tarik & Merge ke HP)
export const pullFromGDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (fileRes.ok) {
        const cloudData = await fileRes.json();
        const localData = getAppData();
        const merged = mergeData(localData, cloudData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        saveSyncStatus({ pending: false, timestamp: new Date().toISOString(), isNewLocal: false, autoSync: true });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('GDrive Pull Error:', error);
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
