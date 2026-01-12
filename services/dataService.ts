
import { db } from './firebase.ts';
import { 
  doc, setDoc, onSnapshot, updateDoc, arrayUnion, getDoc
} from "firebase/firestore";
import { 
  UserProfile, AttendanceRecord, ReportItem, Student, 
  Teacher, Schedule, AcademicConfig, PrayerRecord, AppData, ExtraDataList, UserRole
} from '../types.ts';
import { PREDEFINED_VIOLATIONS, PREDEFINED_ACHIEVEMENTS } from '../constants.tsx';

const SESSION_KEY = 'mahasina_active_session_v3';

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

// Fungsi untuk mengecek user berdasarkan email di Firestore
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const cleanEmail = email.toLowerCase().trim();
  const docRef = doc(db, "users", cleanEmail);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// Fungsi untuk mendaftarkan user baru ke Firestore
export const registerUser = async (profile: UserProfile) => {
  const cleanEmail = profile.email.toLowerCase().trim();
  const docRef = doc(db, "users", cleanEmail);
  await setDoc(docRef, profile);
};

export const subscribeToAppData = (callback: (data: AppData) => void) => {
  const docRef = doc(db, "settings", "master_data");
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      const mergedData: AppData = {
        ...initialData,
        ...remoteData,
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
      setDoc(docRef, initialData);
      callback(initialData);
    }
  });
};

export const saveAppData = async (data: Partial<AppData>) => {
  const docRef = doc(db, "settings", "master_data");
  try {
    await updateDoc(docRef, {
      ...data,
      lastUpdate: new Date().toISOString()
    });
  } catch (e) {
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
  if (u) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const getActiveSession = (): UserProfile | null => {
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
};

export const clearAppData = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const pullFromGDrive = async (token: string) => { return false; };
export const findDatabaseInDrive = async (token: string) => { return 'cloud-master-db'; };
export const createDatabaseInDrive = async (token: string) => { return 'db-123'; };
export const getSyncStatus = () => { return { isNewLocal: false, lastSync: new Date().toISOString() }; };
export const getTeamDatabaseId = () => { return 'mahasina-cloud-db'; };
export const setTeamDatabaseId = (id: string) => {};
export const getAppData = (): AppData => { return initialData; };
