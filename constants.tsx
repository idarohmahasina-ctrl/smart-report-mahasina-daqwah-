
import { 
  Student, Schedule, ViolationCategory, SessionType, AttendanceStatus, 
  ReportItem, TeacherAttendance, AttendanceRecord 
} from './types';

export const APP_LOGO = "https://drive.google.com/thumbnail?id=1bcmRcJff0_5WBiXdhbuEBzFn9kSnDU0Y&sz=w200";

export const CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B', '10 IPA', '10 IPS', '11 IPA', '11 IPS', '12 IPA', '12 IPS'];

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

export const MOCK_STUDENTS: Student[] = [
  { id: '1', nis: '2024001', name: 'Ahmad Fauzi', formalClass: '11 IPA', level: 'MA', gender: 'Putra', sessionClasses: {} },
  { id: '2', nis: '2024002', name: 'Zaidan Al-Khairi', formalClass: '7A', level: 'MTs', gender: 'Putra', sessionClasses: {} },
  { id: '3', nis: '2024003', name: 'Siti Maryam', formalClass: '10 IPS', level: 'MA', gender: 'Putri', sessionClasses: {} },
  { id: '4', nis: '2024004', name: 'Umar Bin Khattab', formalClass: '11 IPA', level: 'MA', gender: 'Putra', sessionClasses: {} },
  { id: '5', nis: '2024005', name: 'Fatimah Az-Zahra', formalClass: '8B', level: 'MTs', gender: 'Putri', sessionClasses: {} },
  { id: '6', nis: '2024006', name: 'Yusuf Mansur', formalClass: '9A', level: 'MTs', gender: 'Putra', sessionClasses: {} },
  { id: '7', nis: '2024007', name: 'Aisha Humaira', formalClass: '12 IPA', level: 'MA', gender: 'Putri', sessionClasses: {} },
  { id: '8', nis: '2024008', name: 'Hasan Basri', formalClass: '7A', level: 'MTs', gender: 'Putra', sessionClasses: {} },
  { id: '9', nis: '2024009', name: 'Khadijah Al-Kubra', formalClass: '10 IPS', level: 'MA', gender: 'Putri', sessionClasses: {} },
  { id: '10', nis: '2024010', name: 'Ali Bin Abi Thalib', formalClass: '11 IPA', level: 'MA', gender: 'Putra', sessionClasses: {} }
];

// Mock data generator for presentation
const t = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('id-ID');
};

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // Hari ini
  { id: 'a1', date: t(0), studentId: '1', status: AttendanceStatus.S, note: 'Flu', recordedBy: 'Admin', class: '11 IPA', sessionType: SessionType.MADRASAH, subject: 'Fisika' },
  { id: 'a2', date: t(0), studentId: '2', status: AttendanceStatus.T, note: 'Kesiangan', recordedBy: 'Admin', class: '7A', sessionType: SessionType.MADRASAH, subject: 'Fiqih' },
  { id: 'a3', date: t(0), studentId: '5', status: AttendanceStatus.A, note: 'Tanpa Keterangan', recordedBy: 'Admin', class: '8B', sessionType: SessionType.MADRASAH, subject: 'IPA' },
  // Minggu ini
  { id: 'a4', date: t(2), studentId: '3', status: AttendanceStatus.I, note: 'Keluarga Sakit', recordedBy: 'Admin', class: '10 IPS', sessionType: SessionType.QURAN, subject: 'Tahfidz' },
  { id: 'a5', date: t(3), studentId: '1', status: AttendanceStatus.T, note: 'Jadwal Antrian Mandi', recordedBy: 'Admin', class: '11 IPA', sessionType: SessionType.MADRASAH, subject: 'Kimia' },
  { id: 'a6', date: t(4), studentId: '6', status: AttendanceStatus.A, note: 'Pulang Tanpa Izin', recordedBy: 'Admin', class: '9A', sessionType: SessionType.MAJLIS, subject: 'Kajian Malam' },
  // Bulan ini
  { id: 'a7', date: t(10), studentId: '2', status: AttendanceStatus.S, note: 'Sakit Gigi', recordedBy: 'Admin', class: '7A', sessionType: SessionType.MADRASAH, subject: 'B. Arab' },
  { id: 'a8', date: t(15), studentId: '1', status: AttendanceStatus.A, note: 'Mabal', recordedBy: 'Admin', class: '11 IPA', sessionType: SessionType.MADRASAH, subject: 'MTK' },
  { id: 'a9', date: t(20), studentId: '8', status: AttendanceStatus.I, note: 'Acara Kakak', recordedBy: 'Admin', class: '7A', sessionType: SessionType.QURAN, subject: 'Murajaah' },
];

export const MOCK_REPORTS: ReportItem[] = [
  { id: 'r1', studentId: '1', type: 'Violation', category: ViolationCategory.IBADAH, description: 'Tidur saat shubuh', points: 15, date: t(0), timestamp: '05:15', reporter: 'Musyrif', status: 'Belum Ditindak' },
  { id: 'r2', studentId: '2', type: 'Violation', category: ViolationCategory.KEDISIPLINAN, description: 'Membawa HP Tanpa Izin', points: 100, date: t(2), timestamp: '14:30', reporter: 'Admin', status: 'Ditindak', actionNote: 'HP disita 1 semester' },
  { id: 'r3', studentId: '3', type: 'Achievement', category: ViolationCategory.AKADEMIK, description: 'Juara 1 Lomba Pidato', points: 150, date: t(1), timestamp: '10:00', reporter: 'Guru', status: 'Ditindak', actionNote: 'Hadiah Kitab & Piagam' },
  { id: 'r4', studentId: '5', type: 'Violation', category: ViolationCategory.AKHLAK, description: 'Berkelahi di Kantin', points: 50, date: t(4), timestamp: '16:00', reporter: 'Musyrif', status: 'Ditindak', actionNote: 'Dita`zir bersihkan masjid 3 hari' },
  { id: 'r5', studentId: '1', type: 'Achievement', category: ViolationCategory.IBADAH, description: 'Hafal Juz 30', points: 200, date: t(12), timestamp: '09:00', reporter: 'Ustadz Tahfidz', status: 'Ditindak', actionNote: 'Sertifikat Tahfidz' },
  { id: 'r6', studentId: '10', type: 'Violation', category: ViolationCategory.KEBERSIHAN, description: 'Membuang sampah di laci', points: 5, date: t(5), timestamp: '07:00', reporter: 'Ketua Kelas', status: 'Belum Ditindak' },
];

export const MOCK_TEACHER_ATTENDANCE: TeacherAttendance[] = [
  { id: 'ta1', date: t(0), teacherName: 'Idaroh Pusat Mahasina', subject: 'Fisika', class: '11 IPA', level: 'MA', gender: 'Putra', checkInTime: '07:45', checkOutTime: '09:00', status: 'Terlambat', sessionType: SessionType.MADRASAH, timeScheduled: '07:30 - 09:00' },
  { id: 'ta2', date: t(1), teacherName: 'Idaroh Pusat Mahasina', subject: 'Tahfidz', class: 'Halaqah 1', level: 'MA', gender: 'Putra', checkInTime: '05:00', checkOutTime: '06:30', status: 'Hadir', sessionType: SessionType.QURAN, timeScheduled: '05:00 - 06:30' },
  { id: 'ta3', date: t(5), teacherName: 'Idaroh Pusat Mahasina', subject: 'Fiqih', class: '7A', level: 'MTs', gender: 'Putra', checkInTime: '13:00', checkOutTime: '14:30', status: 'Hadir', sessionType: SessionType.MADRASAH, timeScheduled: '13:00 - 14:30' },
];

export const MOCK_SCHEDULE: Schedule[] = [
  { id: 'sch1', class: '11 IPA', level: 'MA', gender: 'Putra', day: 'Senin', time: '07:30 - 09:00', subject: 'Fisika', teacherName: 'Idaroh Pusat Mahasina', sessionType: SessionType.MADRASAH },
  { id: 'sch2', class: '7A', level: 'MTs', gender: 'Putra', day: 'Senin', time: '13:00 - 14:30', subject: 'Fiqih', teacherName: 'Idaroh Pusat Mahasina', sessionType: SessionType.MADRASAH },
  { id: 'sch3', class: '10 IPS', level: 'MA', gender: 'Putri', day: 'Selasa', time: '20:00 - 21:30', subject: 'Kajian Malam', teacherName: 'Idaroh Pusat Mahasina', sessionType: SessionType.MAJLIS }
];

export const MOCK_TEACHERS = [];
export const MOCK_ORSAM = [];
export const MOCK_ORKLAS = [];
