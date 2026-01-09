
import { 
  Student, Schedule, ViolationCategory, SessionType, AttendanceStatus, 
  ReportItem, TeacherAttendance, AttendanceRecord, Teacher, OrganizationMember
} from './types';

// Updated Logo URL from User Request
export const APP_LOGO = "https://drive.google.com/thumbnail?id=1jn1DUtOIreMiNEvVvBkWTP_71mXZbPdm&sz=w200";

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

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Ustadz KH. Abdul Hakim', subject: 'Tafsir Jalalain', phone: '08123456789', email: 'hakim@mahasina.id', gender: 'Putra', isWaliKelas: true, waliKelasFor: '12 IPA', teachingClasses: ['12 IPA', '11 IPA'] },
  { id: 't2', name: 'Ustadzah Siti Aminah, M.Pd', subject: 'Bahasa Inggris', phone: '08123456780', email: 'aminah@mahasina.id', gender: 'Putri', isWaliKelas: true, waliKelasFor: '10 IPS', teachingClasses: ['10 IPS', '10 IPA'] },
  { id: 't3', name: 'Ustadz Ahmad Rifa\'i', subject: 'Fiqih Wadlih', phone: '08123456781', email: 'rifai@mahasina.id', gender: 'Putra', isWaliKelas: false, teachingClasses: ['7A', '7B', '8A'] },
  { id: 't4', name: 'Ustadzah Fatmawati', subject: 'Matematika', phone: '08123456782', email: 'fatma@mahasina.id', gender: 'Putri', isWaliKelas: false, teachingClasses: ['11 IPA', '12 IPA'] },
  { id: 't5', name: 'Ustadz Zulkifli', subject: 'Nahwu Jurumiyah', phone: '08123456783', email: 'zulkifli@mahasina.id', gender: 'Putra', isWaliKelas: true, waliKelasFor: '8A', teachingClasses: ['8A', '8B', '9A'] },
  { id: 't6', name: 'Ustadzah Nurul Huda', subject: 'Tahfidz Al-Quran', phone: '08123456784', email: 'nurul@mahasina.id', gender: 'Putri', isWaliKelas: false, teachingClasses: ['Semua Kelas'] },
  { id: 't7', name: 'Ustadz Mansur', subject: 'Hadis Arba\'in', phone: '08123456785', email: 'mansur@mahasina.id', gender: 'Putra', isWaliKelas: false, teachingClasses: ['9A', '9B'] },
  { id: 't8', name: 'Idaroh Pusat Mahasina', subject: 'Administrasi', phone: '-', email: 'idarohmahasina@gmail.com', gender: 'Putra', isWaliKelas: false, teachingClasses: [] }
];

// Helper for date generation
const t = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('id-ID');
};

export const MOCK_SCHEDULE: Schedule[] = [
  // SENIN
  { id: 'sch1', class: '11 IPA', level: 'MA', gender: 'Putra', day: 'Senin', time: '07:30 - 09:00', subject: 'Fisika Terapan', teacherName: 'Ustadzah Fatmawati', sessionType: SessionType.MADRASAH },
  { id: 'sch2', class: '7A', level: 'MTs', gender: 'Putra', day: 'Senin', time: '13:00 - 14:30', subject: 'Fiqih Wadlih', teacherName: 'Ustadz Ahmad Rifa\'i', sessionType: SessionType.MADRASAH },
  { id: 'sch3', class: '10 IPS', level: 'MA', gender: 'Putri', day: 'Senin', time: '20:00 - 21:30', subject: 'Kajian Kitab Kuning', teacherName: 'Ustadz KH. Abdul Hakim', sessionType: SessionType.MAJLIS },
  // SELASA
  { id: 'sch4', class: '8A', level: 'MTs', gender: 'Putra', day: 'Selasa', time: '07:30 - 09:00', subject: 'Nahwu Jurumiyah', teacherName: 'Ustadz Zulkifli', sessionType: SessionType.MADRASAH },
  { id: 'sch5', class: '12 IPA', level: 'MA', gender: 'Putri', day: 'Selasa', time: '05:00 - 06:30', subject: 'Tahfidz Al-Quran', teacherName: 'Ustadzah Nurul Huda', sessionType: SessionType.QURAN },
  { id: 'sch6', class: '11 IPS', level: 'MA', gender: 'Putra', day: 'Selasa', time: '10:00 - 11:30', subject: 'Bahasa Inggris', teacherName: 'Ustadzah Siti Aminah, M.Pd', sessionType: SessionType.MADRASAH },
  // RABU
  { id: 'sch7', class: '9B', level: 'MTs', gender: 'Putri', day: 'Rabu', time: '14:00 - 15:30', subject: 'Hadis Arba\'in', teacherName: 'Ustadz Mansur', sessionType: SessionType.HADIS },
  { id: 'sch8', class: '10 IPA', level: 'MA', gender: 'Putra', day: 'Rabu', time: '07:30 - 09:00', subject: 'Matematika Peminatan', teacherName: 'Ustadzah Fatmawati', sessionType: SessionType.MADRASAH },
  { id: 'sch9', class: '7B', level: 'MTs', gender: 'Putri', day: 'Rabu', time: '10:00 - 11:30', subject: 'Bahasa Arab', teacherName: 'Ustadz Ahmad Rifa\'i', sessionType: SessionType.MADRASAH },
  // KAMIS
  { id: 'sch10', class: '11 IPA', level: 'MA', gender: 'Putra', day: 'Kamis', time: '05:00 - 06:30', subject: 'Murajaah Al-Quran', teacherName: 'Ustadzah Nurul Huda', sessionType: SessionType.QURAN },
  { id: 'sch11', class: '12 IPA', level: 'MA', gender: 'Putri', day: 'Kamis', time: '07:30 - 09:00', subject: 'Tafsir Jalalain', teacherName: 'Ustadz KH. Abdul Hakim', sessionType: SessionType.KITAB },
  // JUMAT
  { id: 'sch12', class: 'Semua', level: 'MA', gender: 'Putra', day: 'Jumat', time: '08:00 - 10:00', subject: 'Muhadharah (Latihan Pidato)', teacherName: 'Idaroh Pusat Mahasina', sessionType: SessionType.TAMBAHAN },
  // SABTU & AHAD
  { id: 'sch13', class: '9A', level: 'MTs', gender: 'Putra', day: 'Sabtu', time: '20:00 - 21:30', subject: 'Kajian Hadis', teacherName: 'Ustadz Mansur', sessionType: SessionType.MAJLIS },
  { id: 'sch14', class: '10 IPS', level: 'MA', gender: 'Putri', day: 'Ahad', time: '09:00 - 11:00', subject: 'Ekskul Peminatan', teacherName: 'Idaroh Pusat Mahasina', sessionType: SessionType.PEMINATAN }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', date: t(0), recordedTime: '07:45', studentId: '1', status: AttendanceStatus.S, note: 'Sakit Demam', recordedBy: 'Ustadzah Fatmawati', class: '11 IPA', sessionType: SessionType.MADRASAH, subject: 'Fisika Terapan' },
  { id: 'a2', date: t(0), recordedTime: '13:10', studentId: '2', status: AttendanceStatus.T, note: 'Telat 10 Menit', recordedBy: 'Ustadz Ahmad Rifa\'i', class: '7A', sessionType: SessionType.MADRASAH, subject: 'Fiqih Wadlih' },
  { id: 'a3', date: t(1), recordedTime: '07:50', studentId: '5', status: AttendanceStatus.A, note: 'Alpha', recordedBy: 'Ustadz Zulkifli', class: '8B', sessionType: SessionType.MADRASAH, subject: 'Nahwu Jurumiyah' },
  { id: 'a4', date: t(2), recordedTime: '10:15', studentId: '3', status: AttendanceStatus.I, note: 'Izin Pulang (Acara Keluarga)', recordedBy: 'Ustadzah Siti Aminah, M.Pd', class: '10 IPS', sessionType: SessionType.MADRASAH, subject: 'Bahasa Inggris' }
];

export const MOCK_REPORTS: ReportItem[] = [
  { id: 'r1', studentId: '1', type: 'Violation', category: ViolationCategory.IBADAH, description: 'Tidur saat kajian malam', points: 15, date: t(1), timestamp: '20:45', reporter: 'Musyrif Kamar', status: 'Ditindak', actionNote: 'Dita`zir bersihkan teras masjid' },
  { id: 'r2', studentId: '2', type: 'Violation', category: ViolationCategory.KEDISIPLINAN, description: 'Membawa HP Tanpa Izin', points: 100, date: t(5), timestamp: '14:30', reporter: 'Keamanan Pondok', status: 'Ditindak', actionNote: 'HP disita dan orang tua dipanggil' },
  { id: 'r3', studentId: '3', type: 'Achievement', category: ViolationCategory.AKADEMIK, description: 'Juara 1 Lomba Pidato Bahasa Arab', points: 150, date: t(2), timestamp: '10:00', reporter: 'Ustadz Ahmad Rifa\'i', status: 'Ditindak', actionNote: 'Pemberian Piagam & Hadiah Kitab' },
  { id: 'r4', studentId: '7', type: 'Achievement', category: ViolationCategory.IBADAH, description: 'Khatam Setoran Hafalan 5 Juz Sekali Duduk', points: 300, date: t(3), timestamp: '06:00', reporter: 'Ustadzah Nurul Huda', status: 'Ditindak', actionNote: 'Syukuran & Sertifikat Tahfidz' }
];

export const MOCK_TEACHER_ATTENDANCE: TeacherAttendance[] = [
  { id: 'ta1', date: t(0), teacherName: 'Ustadzah Fatmawati', subject: 'Fisika Terapan', class: '11 IPA', level: 'MA', gender: 'Putra', checkInTime: '07:25', checkOutTime: '09:05', status: 'Hadir', sessionType: SessionType.MADRASAH, timeScheduled: '07:30 - 09:00' },
  { id: 'ta2', date: t(0), teacherName: 'Ustadz Ahmad Rifa\'i', subject: 'Fiqih Wadlih', class: '7A', level: 'MTs', gender: 'Putra', checkInTime: '13:05', checkOutTime: '14:35', status: 'Hadir', sessionType: SessionType.MADRASAH, timeScheduled: '13:00 - 14:30' },
  { id: 'ta3', date: t(1), teacherName: 'Ustadz Zulkifli', subject: 'Nahwu Jurumiyah', class: '8A', level: 'MTs', gender: 'Putra', checkInTime: '07:45', checkOutTime: '09:00', status: 'Terlambat', sessionType: SessionType.MADRASAH, timeScheduled: '07:30 - 09:00' }
];

export const MOCK_ORSAM: OrganizationMember[] = [
  { id: 'o1', position: 'Ketua Umum', name: 'Zaidan Al-Khairi', nis: '2024002', class: '9A', department: 'Badan Pengurus Harian' },
  { id: 'o2', position: 'Sekretaris', name: 'Ahmad Fauzi', nis: '2024001', class: '11 IPA', department: 'Badan Pengurus Harian' },
  { id: 'o3', position: 'Ketua Div. Keamanan', name: 'Umar Bin Khattab', nis: '2024004', class: '11 IPA', department: 'Departemen Keamanan' },
  { id: 'o4', position: 'Ketua Div. Kebersihan', name: 'Yusuf Mansur', nis: '2024006', class: '9A', department: 'Departemen Kebersihan' }
];

export const MOCK_ORKLAS: OrganizationMember[] = [
  { id: 'ok1', position: 'Ketua Kelas', name: 'Ali Bin Abi Thalib', class: '11 IPA' },
  { id: 'ok2', position: 'Sekretaris Kelas', name: 'Fatimah Az-Zahra', class: '8B' },
  { id: 'ok3', position: 'Ketua Kelas', name: 'Hasan Basri', class: '7A' }
];
