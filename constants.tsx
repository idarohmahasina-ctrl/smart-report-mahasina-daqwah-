
import { 
  Student, Schedule, ViolationCategory, SessionType, AttendanceStatus, 
  ReportItem, TeacherAttendance, AttendanceRecord, Teacher, OrganizationMember
} from './types';

// Logo URL Mahasina
export const APP_LOGO = "https://drive.google.com/thumbnail?id=1jn1DUtOIreMiNEvVvBkWTP_71mXZbPdm&sz=w200";

export const CLASSES = []; // Kosong, akan diisi via upload santri

export const PREDEFINED_VIOLATIONS = [
  { label: 'Terlambat Shalat Berjamaah', points: 5, category: ViolationCategory.IBADAH },
  { label: 'Tidak Mengikuti Dzikir Berjamaah', points: 10, category: ViolationCategory.IBADAH },
  { label: 'Tidur Saat Majlis Malam', points: 15, category: ViolationCategory.IBADAH },
  { label: 'Tidak Membawa Kitab/Buku', points: 5, category: ViolationCategory.KEDISIPLINAN },
  { label: 'Membawa HP Tanpa Izin', points: 100, category: ViolationCategory.KEDISIPLINAN },
  { label: 'Berkelahi / Ribut di Kamar', points: 75, category: ViolationCategory.AKHLAK },
  { label: 'Tugas Sekolah Tidak Dikerjakan', points: 20, category: ViolationCategory.AKADEMIK },
  { label: 'Membuang Sampah Sembarangan', points: 5, category: ViolationCategory.KEBERSIHAN }
];

export const PREDEFINED_ACHIEVEMENTS = [
  { label: 'Juara Lomba Nasional', points: 100, category: ViolationCategory.AKADEMIK },
  { label: 'Khatam Tahfidz 30 Juz', points: 500, category: ViolationCategory.IBADAH },
  { label: 'Santri Berakhlak Mulia', points: 50, category: ViolationCategory.AKHLAK },
  { label: 'Juara Kebersihan Kamar', points: 30, category: ViolationCategory.KEBERSIHAN }
];

// DATA DIKOSONGKAN UNTUK MULAI DARI AWAL
export const MOCK_STUDENTS: Student[] = [];
export const MOCK_TEACHERS: Teacher[] = [];
export const MOCK_SCHEDULE: Schedule[] = [];
export const MOCK_ATTENDANCE: AttendanceRecord[] = [];
export const MOCK_REPORTS: ReportItem[] = [];
export const MOCK_TEACHER_ATTENDANCE: TeacherAttendance[] = [];
export const MOCK_ORSAM: OrganizationMember[] = [];
export const MOCK_ORKLAS: OrganizationMember[] = [];
