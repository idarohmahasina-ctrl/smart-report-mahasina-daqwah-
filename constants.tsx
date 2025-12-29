
import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  ShieldAlert, 
  Trophy, 
  Info, 
  LogOut,
  ChevronRight,
  Plus,
  Search,
  Download,
  Filter,
  User,
  Eye,
  BookOpen
} from 'lucide-react';
import { Student, Teacher, Schedule, OrganizationMember, ViolationCategory, SessionType } from './types';

export const APP_LOGO = "https://drive.google.com/thumbnail?id=1bcmRcJff0_5WBiXdhbuEBzFn9kSnDU0Y&sz=w200";

export const CLASSES = [
  '7A', '7B', '8A', '8B', '9A', '9B',
  '10 IPA', '10 IPS', '11 IPA', '11 IPS', '12 IPA', '12 IPS'
];

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Absensi: <UserCheck size={20} />,
  Students: <Users size={20} />,
  Violations: <ShieldAlert size={20} />,
  Achievements: <Trophy size={20} />,
  Info: <Info size={20} />,
  Logout: <LogOut size={20} />,
  ChevronRight: <ChevronRight size={20} />,
  Plus: <Plus size={20} />,
  Search: <Search size={20} />,
  Download: <Download size={20} />,
  Filter: <Filter size={20} />,
  User: <User size={20} />,
  Eye: <Eye size={16} />,
  Academic: <BookOpen size={20} />
};

export const PREDEFINED_VIOLATIONS = [
  { label: 'Terlambat Shalat Berjamaah', points: 5, category: ViolationCategory.IBADAH },
  { label: 'Tidak Membawa Kitab', points: 3, category: ViolationCategory.KEDISIPLINAN },
  { label: 'Tugas Sekolah Tidak Dikerjakan', points: 10, category: ViolationCategory.AKADEMIK },
  { label: 'Rambut Gondrong / Tidak Rapi', points: 10, category: ViolationCategory.AKHLAK },
  { label: 'Keluar Area Ponpes Tanpa Izin', points: 50, category: ViolationCategory.KEDISIPLINAN },
  { label: 'Membuang Sampah Sembarangan', points: 5, category: ViolationCategory.KEBERSIHAN },
  { label: 'Berkelahi / Keributan', points: 75, category: ViolationCategory.AKHLAK }
];

export const PREDEFINED_ACHIEVEMENTS = [
  { label: 'Setoran Tahfidz > 1 Juz', points: 50, category: ViolationCategory.IBADAH },
  { label: 'Juara Lomba Akademik', points: 75, category: ViolationCategory.AKADEMIK },
  { label: 'Nilai Ujian Sempurna (100)', points: 30, category: ViolationCategory.AKADEMIK },
  { label: 'Membantu Kebersihan Tanpa Disuruh', points: 10, category: ViolationCategory.KEBERSIHAN }
];

export const MOCK_STUDENTS: Student[] = [
  { 
    id: '1', nis: '2024001', name: 'Ahmad Fauzi', formalClass: '11 IPA', level: 'MA', gender: 'Putra',
    sessionClasses: {
      [SessionType.SEKOLAH]: '11 IPA',
      [SessionType.QURAN]: 'Halaqah Ulya (A)',
      [SessionType.HADIS]: 'Bulughul Maram Pagi',
      [SessionType.KITAB]: 'Fathul Qarib',
      [SessionType.PENJURUSAN]: 'Kelas IPA Murni'
    }
  },
  { 
    id: '2', nis: '2024002', name: 'Zaidan Al-Khairi', formalClass: '7A', level: 'MTs', gender: 'Putra',
    sessionClasses: {
      [SessionType.SEKOLAH]: '7A',
      [SessionType.QURAN]: 'Halaqah Wustho (B)',
      [SessionType.HADIS]: 'Arbain Nawawi',
      [SessionType.KITAB]: 'Ta\'lim Muta\'allim'
    }
  },
  { 
    id: '3', nis: '2024003', name: 'Siti Maryam', formalClass: '10 IPS', level: 'MA', gender: 'Putri',
    sessionClasses: {
      [SessionType.SEKOLAH]: '10 IPS',
      [SessionType.QURAN]: 'Halaqah Ulya (C)',
      [SessionType.HADIS]: 'Bulughul Maram Pagi',
      [SessionType.KITAB]: 'Riyadhus Shalihin'
    }
  }
];

export const MOCK_SCHEDULE: Schedule[] = [
  { id: 's1', class: 'Halaqah Ulya (A)', level: 'MA', gender: 'Putra', day: 'Senin', time: '05:00 - 06:00', subject: 'Tahfidz Al-Quran', teacherName: 'Ust. Hamzah', sessionType: SessionType.QURAN },
  { id: 's2', class: '11 IPA', level: 'MA', gender: 'Putra', day: 'Senin', time: '07:30 - 09:00', subject: 'Biologi', teacherName: 'Ust. Abdul Malik', sessionType: SessionType.SEKOLAH },
  { id: 's3', class: 'Bulughul Maram Pagi', level: 'MA', gender: 'Putra', day: 'Senin', time: '14:00 - 15:30', subject: 'Hadis Tematik', teacherName: 'Ust. Abdul Malik', sessionType: SessionType.HADIS }
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Ust. Abdul Malik, M.Pd', subject: 'Biologi / Hadis', phone: '08123456789', email: 'malik@mahasina.id', gender: 'Putra', isWaliKelas: true, waliKelasFor: '11 IPA', teachingClasses: ['11 IPA', 'Bulughul Maram Pagi'] },
];

export const MOCK_ORSAM: OrganizationMember[] = [];
export const MOCK_ORKLAS: OrganizationMember[] = [];
