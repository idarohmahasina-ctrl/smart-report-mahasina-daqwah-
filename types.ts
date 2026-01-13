
export enum UserRole {
  GURU = 'Guru',
  MUSYRIF = 'Musyrif/ah',
  IDAROH = 'Petugas Idaroh',
  SANTRI_OFFICER = 'Petugas Santri',
  PENGASUH = 'Pengasuh'
}

export enum AttendanceStatus {
  H = 'Hadir',
  S = 'Sakit',
  I = 'Izin',
  T = 'Terlambat',
  A = 'Alpha'
}

export enum PrayerTime {
  SUBUH = 'Subuh',
  DHUHA = 'Dhuha',
  DZUHUR = 'Dzuhur',
  ASHAR = 'Ashar',
  MAGHRIB = 'Maghrib',
  ISYA = 'Isya',
  LALARAN = 'Lalaran Ahad Malam'
}

// Added SessionType definition
export type SessionType = string;

export enum ViolationCategory {
  AKADEMIK = 'Akademik',
  IBADAH = 'Ibadah',
  AKHLAK = 'Akhlak',
  KEDISIPLINAN = 'Kedisiplinan',
  KEBERSIHAN = 'Kebersihan',
  LAINNYA = 'Lain-lain'
}

export interface AcademicConfig {
  schoolYear: string;
  semester: 'I (Ganjil)' | 'II (Genap)';
  isHoliday: boolean;
  excludedClasses: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  isBlocked?: boolean;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  formalClass: string; 
  sessionClasses: Record<string, string>; // Sesi -> Nama Kelas
  level: 'MTs' | 'MA';
  gender: 'Putra' | 'Putri';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
  teachingClasses: string[];
  // Added phone property to match usage
  phone: string;
}

export interface Schedule {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacherName: string;
  class: string;
  level: 'MTs' | 'MA';
  gender: 'Putra' | 'Putri';
  sessionType: string;
}

export interface OrganizationMember {
  id: string;
  position: string;
  name: string;
  nis: string;
  class: string;
  division: string;
  orgType: 'ORSAM' | 'ORKLAS';
  gender: 'Putra' | 'Putri';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  studentId: string;
  status: AttendanceStatus;
  note: string;
  recordedBy: string;
  class: string;
  sessionType: string;
}

// Renamed from TeacherAttendanceRecord to TeacherAttendance to match imports in other files
export interface TeacherAttendance {
  id: string;
  date: string;
  teacherEmail: string;
  teacherName: string;
  subject: string;
  class: string;
  startTime: string;
  endTime?: string;
  photoUrl: string; // Base64
  summary?: string;
}

export interface ReportItem {
  id: string;
  studentId: string;
  type: 'Violation' | 'Achievement';
  category: ViolationCategory;
  description: string;
  points: number;
  date: string;
  time: string;
  reporter: string;
  status: 'Belum Ditindak' | 'Ditindak';
  actionNote?: string;
  photoUrl?: string;
}

// Added PrayerStatus enum missing in types.ts
export enum PrayerStatus {
  JAMAAH = "Berjama'ah",
  UDZUR = 'Udzur',
  SAKIT = 'Sakit',
  IZIN = 'Izin',
  TERLAMBAT = 'Terlambat',
  ALPHA = 'Alpha'
}

// Added PrayerRecord interface missing in types.ts
export interface PrayerRecord {
  id: string;
  date: string;
  recordedTime: string;
  studentId: string;
  status: PrayerStatus;
  recordedBy: string;
  class: string;
  prayerTime: PrayerTime;
  note?: string;
}

// Added TemplateItem interface missing in types.ts
export interface TemplateItem {
  label: string;
  points: number;
  category: ViolationCategory;
}

// Added Announcement interface missing in types.ts
export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

// Added AppData interface missing parts (extraDataLists, announcements, etc.)
export interface AppData {
  students: Student[];
  teachers: Teacher[];
  schedules: Schedule[];
  attendance: AttendanceRecord[];
  teacherAttendance: TeacherAttendance[];
  reports: ReportItem[];
  prayerAttendance: PrayerRecord[];
  orsam: OrganizationMember[];
  orklas: OrganizationMember[];
  violationTemplates: TemplateItem[];
  achievementTemplates: TemplateItem[];
  academicConfig: AcademicConfig;
  extraDataLists: any[]; // Used in Information.tsx
  announcements: Announcement[];
}
