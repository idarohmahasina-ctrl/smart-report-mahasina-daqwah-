
import { 
  Student, Schedule, ViolationCategory, AttendanceStatus, 
  ReportItem, TeacherAttendance, AttendanceRecord, Teacher,
  PrayerStatus, PrayerTime, PrayerRecord
} from './types';

export const APP_LOGO = "https://drive.google.com/thumbnail?id=1jn1DUtOIreMiNEvVvBkWTP_71mXZbPdm&sz=w200";

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
const dateStr = new Date().toLocaleDateString('id-ID');

export const DEMO_STUDENTS: Student[] = [
  { id: 's1', nis: '2024001', name: 'Ahmad Fauzi', formalClass: '7A', sessionClasses: { "Kitab Kuning": "Safinah A", "Al-Quran": "Tajwid 1" }, level: 'MTs', gender: 'Putra' },
  { id: 's2', nis: '2024002', name: 'Zaid Al-Khair', formalClass: '7A', sessionClasses: { "Kitab Kuning": "Safinah A", "Al-Quran": "Tajwid 2" }, level: 'MTs', gender: 'Putra' },
  { id: 's3', nis: '2024003', name: 'Fatimah Az-Zahra', formalClass: '8B', sessionClasses: { "Kitab Kuning": "Fathul Qorib B", "Al-Quran": "Tahfidz 1" }, level: 'MTs', gender: 'Putri' },
  { id: 's4', nis: '2024004', name: 'Sarah Meilani', formalClass: '8B', sessionClasses: { "Kitab Kuning": "Fathul Qorib B", "Al-Quran": "Tahfidz 1" }, level: 'MTs', gender: 'Putri' },
  { id: 's5', nis: '2024005', name: 'Umar Bin Khattab', formalClass: '9A', sessionClasses: { "Kitab Kuning": "Imriti A", "Al-Quran": "Tahfidz 2" }, level: 'MTs', gender: 'Putra' },
  { id: 's6', nis: '2025001', name: 'Ali Bin Abi Thalib', formalClass: '10-IPA', sessionClasses: { "Kitab Kuning": "Alfiyah A", "Al-Quran": "Qiroat" }, level: 'MA', gender: 'Putra' },
  { id: 's7', nis: '2025002', name: 'Aisyah Humaira', formalClass: '11-IPS', sessionClasses: { "Kitab Kuning": "Alfiyah B", "Al-Quran": "Tahfidz 3" }, level: 'MA', gender: 'Putri' },
  { id: 's8', nis: '2025003', name: 'Yusuf Mansur', formalClass: '7A', sessionClasses: { "Kitab Kuning": "Safinah A", "Al-Quran": "Tajwid 1" }, level: 'MTs', gender: 'Putra' },
  { id: 's9', nis: '2025004', name: 'Maryam Abdullah', formalClass: '8B', sessionClasses: { "Kitab Kuning": "Fathul Qorib B", "Al-Quran": "Tahfidz 1" }, level: 'MTs', gender: 'Putri' }
];

export const DEMO_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Ustadz Zulkifli', subject: 'Nahwu Shorof', phone: '0812345678', email: 'zulkifli@gmail.com', teachingClasses: ['7A', '8B'] },
  { id: 't2', name: 'Ustadzah Aminah', subject: 'Fiqih Wanita', phone: '0899887766', email: 'aminah@gmail.com', teachingClasses: ['8B', '11-IPS'] },
  { id: 't3', name: 'Ustadz Ahmad', subject: 'Tahfidz Al-Quran', phone: '0855443322', email: 'ahmad@gmail.com', teachingClasses: ['7A', '9A', '10-IPA'] },
  { id: 't4', name: 'Ustadzah Siti', subject: 'Bahasa Arab', phone: '0877112233', email: 'siti@gmail.com', teachingClasses: ['7A', '8B', '11-IPS'] }
];

export const DEMO_SCHEDULES: Schedule[] = [
  { id: 'sch1', class: '7A', level: 'MTs', gender: 'Putra', day: today, time: '07:30 - 09:00', subject: 'Nahwu Shorof', teacherName: 'Ustadz Zulkifli', assistantTeacherName: 'Ustadz Ahmad', sessionType: 'Madrasah' },
  { id: 'sch2', class: '8B', level: 'MTs', gender: 'Putri', day: today, time: '09:15 - 10:45', subject: 'Fiqih', teacherName: 'Ustadzah Aminah', assistantTeacherName: 'Ustadzah Siti', sessionType: 'Madrasah' },
  { id: 'sch3', class: '10-IPA', level: 'MA', gender: 'Putra', day: today, time: '13:00 - 15:00', subject: 'Tahfidz', teacherName: 'Ustadz Ahmad', sessionType: 'Al-Quran' },
  { id: 'sch4', class: 'Safinah A', level: 'MTs', gender: 'Putra', day: today, time: '16:00 - 17:30', subject: 'Kitab Safinah', teacherName: 'Ustadz Zulkifli', sessionType: 'Kitab Kuning' }
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att1', date: dateStr, time: '07:35', studentId: 's1', status: AttendanceStatus.H, note: '', recordedBy: 'Ustadz Zulkifli', class: '7A', sessionType: 'Madrasah' },
  { id: 'att2', date: dateStr, time: '07:36', studentId: 's2', status: AttendanceStatus.T, note: 'Terlambat 5 menit', recordedBy: 'Ustadz Zulkifli', class: '7A', sessionType: 'Madrasah' },
  { id: 'att3', date: dateStr, time: '07:40', studentId: 's8', status: AttendanceStatus.A, note: 'Tanpa Keterangan', recordedBy: 'Ustadz Zulkifli', class: '7A', sessionType: 'Madrasah' }
];

export const DEMO_REPORTS: ReportItem[] = [
  { 
    id: 'rep1', studentId: 's1', type: 'Violation', category: ViolationCategory.KEDISIPLINAN, 
    description: 'Membawa HP Tanpa Izin di area asrama', points: 100, date: dateStr, time: '10:00', 
    reporter: 'Ustadzah Aminah', status: 'Belum Ditindak', 
    photoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop' 
  },
  { 
    id: 'rep2', studentId: 's3', type: 'Achievement', category: ViolationCategory.AKADEMIK, 
    description: 'Juara 1 Lomba Pidato Bahasa Arab Tingkat Provinsi', points: 150, date: dateStr, time: '11:00', 
    reporter: 'Ustadz Zulkifli', status: 'Ditindak', actionNote: 'Diberikan piagam penghargaan saat upacara',
    photoUrl: 'https://images.unsplash.com/photo-1491333078588-55b6733c7de6?q=80&w=400&auto=format&fit=crop' 
  }
];

export const DEMO_TEACHER_ATTENDANCE: TeacherAttendance[] = [
  { 
    id: 'ta1', date: dateStr, teacherEmail: 'zulkifli@gmail.com', teacherName: 'Ustadz Zulkifli', 
    subject: 'Nahwu Shorof', class: '7A', startTime: '07:25', summary: 'Hadir tepat waktu, materi pembukaan Jurumiyah',
    // Fix missing status property
    status: AttendanceStatus.H,
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' 
  }
];

export const DEMO_PRAYER: PrayerRecord[] = [
  { id: 'p1', date: dateStr, recordedTime: '04:45', studentId: 's1', status: PrayerStatus.JAMAAH, recordedBy: 'Musyrif', class: '7A', prayerTime: PrayerTime.SUBUH },
  { id: 'p2', date: dateStr, recordedTime: '04:46', studentId: 's2', status: PrayerStatus.ALPHA, recordedBy: 'Musyrif', class: '7A', prayerTime: PrayerTime.SUBUH }
];
