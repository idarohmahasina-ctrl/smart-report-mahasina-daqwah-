
export const normalizeName = (name: string): string => {
  if (!name) return "";
  
  const titles = [
    /ustadz/gi, /ustadzah/gi, /bu /gi, /pak /gi, /kyai/gi, /nyai/gi,
    /s\.ag/gi, /lc/gi, /m\.pd/gi, /s\.pd/gi, /m\.ag/gi, /s\.hum/gi, 
    /h\./gi, /hj\./gi, /dr\./gi, /dra\./gi, /drs\./gi, /m\.si/gi,
    /st\./gi, /s\.h\./gi, /s\.kom/gi, /m\.kom/gi,
    /,/g, /\./g 
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
    return normalizedTarget.includes(normalizedUser) || normalizedUser.includes(normalizedTarget);
  };

  return check(scheduleTeacher) || check(scheduleAssistant) || check(homeroomTeacher);
};
