
export const normalizeName = (name: string): string => {
  if (!name) return "";
  
  const titles = [
    /ustadz/gi, /ustadzah/gi, /bu /gi, /pak /gi, /kyai/gi, /nyai/gi,
    /s\.ag/gi, /lc/gi, /m\.pd/gi, /s\.pd/gi, /m\.ag/gi, /s\.hum/gi, 
    /h\./gi, /hj\./gi, /dr\./gi, /dra\./gi, /drs\./gi, /m\.si/gi,
    /,/g, /\./g 
  ];

  let cleanName = name.toLowerCase();
  titles.forEach(pattern => {
    cleanName = cleanName.replace(pattern, "");
  });

  return cleanName.trim();
};

/**
 * Mengecek apakah nama user cocok dengan nama pengajar di jadwal 
 * Mendukung: Guru Utama, Asisten, dan Wali Kelas (Walas)
 */
export const isTeacherMatch = (userName: string, scheduleTeacher: string, scheduleAssistant?: string, homeroomTeacher?: string): boolean => {
  const normalizedUser = normalizeName(userName);
  if (normalizedUser.length < 3) return false;

  const matchPrimary = normalizeName(scheduleTeacher).includes(normalizedUser) || normalizedUser.includes(normalizeName(scheduleTeacher));
  const matchAssistant = scheduleAssistant ? (normalizeName(scheduleAssistant).includes(normalizedUser) || normalizedUser.includes(normalizeName(scheduleAssistant))) : false;
  const matchHomeroom = homeroomTeacher ? (normalizeName(homeroomTeacher).includes(normalizedUser) || normalizedUser.includes(normalizeName(homeroomTeacher))) : false;

  return matchPrimary || matchAssistant || matchHomeroom;
};
