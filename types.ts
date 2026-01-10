
export enum UserRole {
  GURU = 'Guru',
  MUSYRIF = 'Musyrif/ah (Wali Kelas)',
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

export enum PrayerStatus {
  JAMAAH = 'Berjama\'ah',
  UDZUR = 'Udzur',
  SAKIT = 'Sakit',
  IZIN = 'Izin',
  TERLAMBAT = 'Terlambat',
  ALPHA = 'Alpha'
}

export enum PrayerTime {
  SUBUH = 'Subuh',
  DHUHA = 'Dhuha',
  DZUHUR = 'Dzuhur',
  ASHAR = 'Ashar',
  MAGHRIB = 'Maghrib',
  ISYA = 'Isya'
}

export enum ViolationCategory {
  AKADEMIK = 'Akademik',
  IBADAH = 'Ibadah',
  AKHLAK = 'Akhlak',
  KEDISIPLINAN = 'Kedisiplinan',
  KEBERSIHAN = 'Kebersihan',
  LAINNYA = 'Lain-lain'
}

// Fixed: Changed SessionType to enum so it can be used as a value in mock data and constants
export enum SessionType {
  MADRASAH = 'Madrasah',
  MAJLIS = 'Majlis',
  QURAN = 'Quran',
  HADIS = 'Hadis',
  KITAB = 'Kitab',
  TAMBAHAN = 'Tambahan',
  PEMINATAN = 'Peminatan'
}

export interface AcademicConfig {
  schoolYear: string;
  semester: 'I (Ganjil)' | 'II (Genap)';
  isHoliday: boolean;
  sessionHolidays: Record<string, boolean>;
}

export interface TemplateItem {
  id?: string;
  label: string;
  points: number;
  category: ViolationCategory;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'Normal' | 'Penting';
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  classes?: string[];
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  formalClass: string; 
  sessionClasses: Record<string, string>; // Dinamis: Sesi -> Nama Kelas
  level: 'MTs' | 'MA';
  gender: 'Putra' | 'Putri';
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email: string;
  gender: 'Putra' | 'Putri';
  isWaliKelas: boolean;
  waliKelasFor?: string;
  teachingClasses: string[];
}

export interface Schedule {
  id: string;
  class: string; 
  level: 'MTs' | 'MA';
  gender: 'Putra' | 'Putri';
  day: string;
  time: string;
  subject: string;
  teacherName: string;
  sessionType: string;
}

export interface OrganizationMember {
  id: string;
  position: string;
  name: string;
  nis?: string;
  class: string;
  department?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  recordedTime: string; 
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  class: string;
  sessionType: string;
  subject: string;
}

export interface PrayerRecord {
  id: string;
  date: string;
  recordedTime: string; 
  studentId: string;
  status: PrayerStatus;
  note?: string;
  recordedBy: string;
  class: string;
  prayerTime: PrayerTime;
}

export interface TeacherAttendance {
  id: string;
  date: string;
  teacherName: string;
  subject: string;
  class: string;
  level: 'MTs' | 'MA';
  gender: 'Putra' | 'Putri';
  checkInTime: string;
  checkOutTime?: string;
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Alpha';
  note?: string;
  sessionType: string;
  timeScheduled: string;
}

export interface ReportItem {
  id: string;
  studentId: string;
  type: 'Violation' | 'Achievement';
  category: ViolationCategory;
  description: string;
  points: number;
  date: string;
  timestamp: string; 
  reporter: string;
  status: 'Belum Ditindak' | 'Ditindak';
  actionNote?: string;
}