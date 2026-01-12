
import { db } from './firebase.ts';
import { 
  doc, setDoc, onSnapshot, updateDoc, arrayUnion
} from "firebase/firestore";
import { 
  UserProfile, AttendanceRecord, ReportItem, Student, 
  Teacher, Schedule, AcademicConfig, PrayerRecord, AppData, ExtraDataList
} from '../types.ts';
import { PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS } from '../constants.tsx';

const SESSION_KEY = 'mahasina_active_session';

export type { ExtraDataList };

const initialData: AppData = {
  attendance: [],
  prayerAttendance: [],
  reports: [],
  students: [],
  teachers: [],
  schedules: [],
  academicConfig: { schoolYear: '2024/2025', semester: 'II (Genap)', isHoliday: false, sessionHolidays: {} },
  violationTemplates: PREDEFINED_VIOLATIONS,
  achievementTemplates: PREDEFINED_ACHIEVEMENTS,
  orsam: [],
  orklas: [],
  extraDataLists: [],
  announcements: [],
};

// Listen for real-time updates from Firestore
export const subscribeToAppData = (callback: (data: AppData) => void) => {
  const docRef = doc(db, "settings", "master_data");
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      // Pastikan data yang diterima memiliki struktur lengkap AppData
      // Jika user baru membuat field "initialized", maka field lain akan diambil dari initialData
      const mergedData: AppData = {
        ...initialData,
        ...remoteData,
        // Pastikan array tetap array jika field ada tapi kosong
        attendance: remoteData.attendance || [],
        prayerAttendance: remoteData.prayerAttendance || [],
        reports: remoteData.reports || [],
        students: remoteData.students || [],
        teachers: remoteData.teachers || [],
        schedules: remoteData.schedules || [],
        violationTemplates: remoteData.violationTemplates || PREDEFINED_VIOLATIONS,
        achievementTemplates: remoteData.achievementTemplates || PREDEFINED_ACHIEVEMENTS,
      };
      
      callback(mergedData);
    } else {
      // Jika dokumen benar-benar belum ada, buat baru
      setDoc(docRef, initialData);
      callback(initialData);
    }
  });
};

// Update application data partially
export const saveAppData = async (data: Partial<AppData>) => {
  const docRef = doc(db, "settings", "master_data");
  try {
    await updateDoc(docRef, {
      ...data,
      lastUpdate: new Date().toISOString()
    });
  } catch (e) {
    // Jika gagal update (misal doc belum ada field master), gunakan setDoc dengan merge
    await setDoc(docRef, data, { merge: true });
  }
};

export const addAttendanceRecord = async (newRecords: AttendanceRecord[]) => {
  const docRef = doc(db, "settings", "master_data");
  await updateDoc(docRef, {
    attendance: arrayUnion(...newRecords)
  });
};

export const addReportRecord = async (newReport: ReportItem) => {
  const docRef = doc(db, "settings", "master_data");
  await updateDoc(docRef, {
    reports: arrayUnion(newReport)
  });
};

export const setActiveSession = (u: UserProfile | null) => {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else sessionStorage.removeItem(SESSION_KEY);
};

export const getActiveSession = (): UserProfile | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const clearAppData = () => {
  sessionStorage.clear();
  localStorage.clear();
};

export const pullFromGDrive = async (token: string) => { return false; };
export const findDatabaseInDrive = async (token: string) => { return 'cloud-master-db'; };
export const createDatabaseInDrive = async (token: string) => { return 'db-123'; };
export const getSyncStatus = () => { return { isNewLocal: false, lastSync: new Date().toISOString() }; };
export const getTeamDatabaseId = () => { return 'mahasina-cloud-db'; };
export const setTeamDatabaseId = (id: string) => {};
export const getAppData = (): AppData => { return initialData; };
