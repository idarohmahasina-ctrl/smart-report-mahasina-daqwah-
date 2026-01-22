
export const normalizeName = (name: string): string => {
  if (!name) return "";
  
  // Daftar gelar dan sebutan yang akan diabaikan dalam pencocokan
  const titles = [
    /ustadz/gi, /ustadzah/gi, /bu /gi, /pak /gi, /kyai/gi, /nyai/gi,
    /s\.ag/gi, /lc/gi, /m\.pd/gi, /s\.pd/gi, /m\.ag/gi, /s\.hum/gi, 
    /h\./gi, /hj\./gi, /dr\./gi, /dra\./gi, /drs\./gi, /m\.si/gi,
    /st\./gi, /s\.h\./gi, /s\.kom/gi, /m\.kom/gi, /m\.m/gi, /s\.e/gi,
    /,/g, /\./g, /'/g // Hapus tanda baca
  ];

  let cleanName = name.toLowerCase();
  titles.forEach(pattern => {
    cleanName = cleanName.replace(pattern, "");
  });

  // Hapus spasi ganda dan trim
  return cleanName.replace(/\s+/g, ' ').trim();
};

/**
 * Mengecek apakah nama user cocok dengan nama pengajar di jadwal 
 * Menggunakan fuzzy matching: Jika nama yang dinormalisasi terkandung satu sama lain
 */
export const isTeacherMatch = (userName: string, scheduleTeacher: string, scheduleAssistant?: string, homeroomTeacher?: string): boolean => {
  const normalizedUser = normalizeName(userName);
  if (normalizedUser.length < 2) return false;

  const check = (target: string | undefined) => {
    if (!target) return false;
    const normalizedTarget = normalizeName(target);
    // Cek apakah nama satu terkandung di nama lainnya (lebih fleksibel)
    return normalizedTarget.includes(normalizedUser) || normalizedUser.includes(normalizedTarget);
  };

  return check(scheduleTeacher) || check(scheduleAssistant) || check(homeroomTeacher);
};

/**
 * Normalisasi nama sesi/kegiatan agar konsisten
 */
export const normalizeSessionName = (session: string): string => {
  if (!session) return "Madrasah";
  const s = session.trim().toLowerCase();
  if (s === 'madrasah' || s === 'sekolah' || s === 'kbm') return 'Madrasah';
  if (s.includes('al-quran') || s.includes('quran')) return 'Al-Quran';
  if (s.includes('kitab') || s.includes('kuning')) return 'Kitab Kuning';
  if (s.includes('hadis') || s.includes('aswaja')) return 'Hadis-Aswaja';
  return session.trim();
};
