
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

export enum ViolationCategory {
  AKADEMIK = 'Akademik',
  IBADAH = 'Ibadah',
  AKHLAK = 'Akhlak',
  KEDISIPLINAN = 'Kedisiplinan',
  KEBERSIHAN = 'Kebersihan',
  LAINNYA = 'Lain-lain'
}

export enum SessionType {
  QURAN = 'Al-Quran',
  MADRASAH = 'Madrasah',
  HADIS = 'Hadis',
  KITAB = 'Kitab Kuning',
  PEMINATAN = 'Peminatan',
  MAJLIS = 'Majlis Malam',
  TAMBAHAN = 'Tambahan/Sesi Lain'
}

export interface AcademicConfig {
  schoolYear: string;
  semester: 'I (Ganjil)' | 'II (Genap)';
  isHoliday: boolean;
  sessionHolidays: Partial<Record<SessionType, boolean>>;
}

export interface TemplateItem {
  label: string;
  points: number;
  category: ViolationCategory;
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
  sessionClasses: Partial<Record<SessionType, string>>;
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
  sessionType: SessionType;
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
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  class: string;
  sessionType: SessionType;
  subject: string;
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
  sessionType: SessionType;
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
  timestamp: string; // Waktu presisi (HH:mm)
  reporter: string;
  status: 'Belum Ditindak' | 'Ditindak';
  actionNote?: string;
}
