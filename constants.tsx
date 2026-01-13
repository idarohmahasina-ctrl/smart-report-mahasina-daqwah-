
import { 
  Student, Schedule, ViolationCategory, SessionType, AttendanceStatus, 
  ReportItem, TeacherAttendance, AttendanceRecord, Teacher, OrganizationMember,
  PrayerStatus, PrayerTime, PrayerRecord
} from './types';

export const APP_LOGO = "https://drive.google.com/thumbnail?id=1jn1DUtOIreMiNEvVvBkWTP_71mXZbPdm&sz=w200";

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

// --- MOCK DATA FOR PRESENTATION ---

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', nis: '2024001', name: 'Ahmad Fauzi', formalClass: '7A', sessionClasses: {}, level: 'MTs', gender: 'Putra' },
  { id: 's2', nis: '2024002', name: 'Zaid Al-Khair', formalClass: '7A', sessionClasses: {}, level: 'MTs', gender: 'Putra' },
  { id: 's3', nis: '2024003', name: 'Fatimah Az-Zahra', formalClass: '8B', sessionClasses: {}, level: 'MTs', gender: 'Putri' },
  { id: 's4', nis: '2024004', name: 'Sarah Meilani', formalClass: '8B', sessionClasses: {}, level: 'MTs', gender: 'Putri' },
  { id: 's5', nis: '2024005', name: 'Umar Bin Khattab', formalClass: '9A', sessionClasses: {}, level: 'MTs', gender: 'Putra' },
  { id: 's6', nis: '2025001', name: 'Ali Bin Abi Thalib', formalClass: '10-IPA', sessionClasses: {}, level: 'MA', gender: 'Putra' },
  { id: 's7', nis: '2025002', name: 'Aisyah Humaira', formalClass: '11-IPS', sessionClasses: {}, level: 'MA', gender: 'Putri' },
];

export const MOCK_TEACHERS: Teacher[] = [
  // Added phone property to match Teacher interface
  { id: 't1', name: 'Ustadz Zulkifli', subject: 'Nahwu Shorof', phone: '0812345678', email: 'zulkifli@gmail.com', teachingClasses: ['7A', '8B'] },
  { id: 't2', name: 'Ustadzah Aminah', subject: 'Fiqih Wanita', phone: '0899887766', email: 'aminah@gmail.com', teachingClasses: ['8B', '11-IPS'] },
  { id: 't3', name: 'Ustadz Ahmad', subject: 'Tahfidz Al-Quran', phone: '0855443322', email: 'ahmad@gmail.com', teachingClasses: ['7A', '9A', '10-IPA'] },
];

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());

export const MOCK_SCHEDULE: Schedule[] = [
  { id: 'sch1', class: '7A', level: 'MTs', gender: 'Putra', day: today, time: '07:30 - 09:00', subject: 'Nahwu Shorof', teacherName: 'Ustadz Zulkifli', sessionType: 'Madrasah' },
  { id: 'sch2', class: '8B', level: 'MTs', gender: 'Putri', day: today, time: '09:15 - 10:45', subject: 'Fiqih', teacherName: 'Ustadzah Aminah', sessionType: 'Madrasah' },
  { id: 'sch3', class: '10-IPA', level: 'MA', gender: 'Putra', day: today, time: '13:00 - 15:00', subject: 'Tahfidz', teacherName: 'Ustadz Ahmad', sessionType: 'Quran' },
];

const dateStr = new Date().toLocaleDateString('id-ID');

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // Fixed: Added missing 'note' property to satisfy AttendanceRecord interface
  { id: 'a1', date: dateStr, time: '07:35', studentId: 's1', status: AttendanceStatus.H, note: '', recordedBy: 'Ustadz Zulkifli', class: '7A', sessionType: 'Madrasah' },
  { id: 'a2', date: dateStr, time: '07:36', studentId: 's2', status: AttendanceStatus.T, note: '', recordedBy: 'Ustadz Zulkifli', class: '7A', sessionType: 'Madrasah' },
];

export const MOCK_REPORTS: ReportItem[] = [
  // Renamed timestamp to time to match ReportItem interface
  { id: 'r1', studentId: 's1', type: 'Violation', category: ViolationCategory.KEDISIPLINAN, description: 'Membawa HP Tanpa Izin', points: 100, date: dateStr, time: '10:00', reporter: 'Ustadzah Aminah', status: 'Belum Ditindak' },
  { id: 'r2', studentId: 's3', type: 'Achievement', category: ViolationCategory.AKADEMIK, description: 'Juara 1 Pidato Bahasa Arab', points: 150, date: dateStr, time: '11:00', reporter: 'Ustadz Zulkifli', status: 'Ditindak' },
  { id: 'r3', studentId: 's2', type: 'Violation', category: ViolationCategory.IBADAH, description: 'Tidur saat Majlis Malam', points: 15, date: dateStr, time: '20:00', reporter: 'Admin', status: 'Ditindak' },
];

export const MOCK_PRAYER: PrayerRecord[] = [
  { id: 'p1', date: dateStr, recordedTime: '04:45', studentId: 's1', status: PrayerStatus.JAMAAH, recordedBy: 'Musyrif', class: '7A', prayerTime: PrayerTime.SUBUH },
  { id: 'p2', date: dateStr, recordedTime: '04:46', studentId: 's2', status: PrayerStatus.ALPHA, recordedBy: 'Musyrif', class: '7A', prayerTime: PrayerTime.SUBUH },
];
