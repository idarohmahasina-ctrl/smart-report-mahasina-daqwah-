
import { db } from './firebase.ts';
import { 
  doc, setDoc, onSnapshot, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs, deleteDoc
} from "firebase/firestore";
import { 
  UserProfile, AttendanceRecord, ReportItem, AppData, UserRole
} from '../types.ts';

const SESSION_KEY = 'mahasina_active_session_v4';

// Added ExtraDataList interface export
export interface ExtraDataList {
  id: string;
  name: string;
  items: string[];
}

// User Registry di Firestore
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const cleanEmail = email.toLowerCase().trim();
  const docRef = doc(db, "users", cleanEmail);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as UserProfile;
  return null;
};

export const registerUser = async (profile: UserProfile) => {
  const cleanEmail = profile.email.toLowerCase().trim();
  await setDoc(doc(db, "users", cleanEmail), profile);
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

export const setActiveSession = (u: UserProfile | null) => {
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else localStorage.removeItem(SESSION_KEY);
};

export const getActiveSession = (): UserProfile | null => {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const clearAppData = () => localStorage.removeItem(SESSION_KEY);

// Added missing cloud sync utility functions
export const getSyncStatus = () => {
  return { isNewLocal: false };
};

export const pullFromGDrive = async (token: string) => {
  console.log("Pulling from GDrive with token:", token);
  return false;
};

export const getTeamDatabaseId = () => {
  return localStorage.getItem('mahasina_team_db_id');
};
