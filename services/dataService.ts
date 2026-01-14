
import { db } from './firebase.ts';
import { 
  doc, setDoc, onSnapshot, getDoc, collection, getDocs, deleteDoc
} from "firebase/firestore";
import { 
  UserProfile, AppData
} from '../types.ts';

const SESSION_KEY = 'mahasina_active_session_v4';

export interface ExtraDataList {
  id: string;
  name: string;
  items: string[];
}

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const cleanEmail = email.toLowerCase().trim();
  const docRef = doc(db, "users", cleanEmail);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as UserProfile;
  return null;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const registerUser = async (profile: UserProfile) => {
  const cleanEmail = profile.email.toLowerCase().trim();
  await setDoc(doc(db, "users", cleanEmail), profile);
};

export const deleteUser = async (email: string) => {
  const cleanEmail = email.toLowerCase().trim();
  await deleteDoc(doc(db, "users", cleanEmail));
};

export const subscribeToAppData = (callback: (data: AppData) => void) => {
  return onSnapshot(doc(db, "settings", "master_data"), (snapshot) => {
    if (snapshot.exists()) callback(snapshot.data() as AppData);
  });
};

export const saveAppData = async (data: Partial<AppData>) => {
  const docRef = doc(db, "settings", "master_data");
  await setDoc(docRef, data, { merge: true });
};

// Fungsi Hard Reset untuk Admin Utama
export const resetFirestoreData = async () => {
  const docRef = doc(db, "settings", "master_data");
  const emptyData: AppData = {
    students: [],
    teachers: [],
    schedules: [],
    attendance: [],
    teacherAttendance: [],
    reports: [],
    prayerAttendance: [],
    orsam: [],
    orklas: [],
    violationTemplates: [],
    achievementTemplates: [],
    extraDataLists: [],
    announcements: [],
    academicConfig: { 
      schoolYear: '2024/2025', 
      semester: 'II (Genap)', 
      isHoliday: false, 
      excludedClasses: {},
      // Fix: Add missing excludedSessions property
      excludedSessions: {} 
    }
  };
  await setDoc(docRef, emptyData);
};

// Fungsi Seed Demo Data
export const seedDemoData = async (demoData: AppData) => {
  const docRef = doc(db, "settings", "master_data");
  await setDoc(docRef, demoData);
};

export const setActiveSession = (u: UserProfile | null) => {
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else localStorage.removeItem(SESSION_KEY);
};

export const getActiveSession = (): UserProfile | null => {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const clearAppData = () => localStorage.removeItem(SESSION_KEY);

export const getSyncStatus = () => {
  return { isNewLocal: false };
};