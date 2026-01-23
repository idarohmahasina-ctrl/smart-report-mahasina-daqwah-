
export const normalizeName = (name: string): string => {
  if (!name) return "";
  const titles = [
    /ustadz/gi, /ustadzah/gi, /bu /gi, /pak /gi, /kyai/gi, /nyai/gi,
    /s\.ag/gi, /lc/gi, /m\.pd/gi, /s\.pd/gi, /m\.ag/gi, /s\.hum/gi, 
    /h\./gi, /hj\./gi, /dr\./gi, /dra\./gi, /drs\./gi, /m\.si/gi,
    /st\./gi, /s\.h\./gi, /s\.kom/gi, /m\.kom/gi, /m\.m/gi, /s\.e/gi,
    /,/g, /\./g, /'/g 
  ];
  let cleanName = name.toLowerCase();
  titles.forEach(pattern => { cleanName = cleanName.replace(pattern, ""); });
  return cleanName.replace(/\s+/g, ' ').trim();
};

export const normalizeClassName = (cls: string): string => {
  if (!cls) return "";
  return cls.toLowerCase()
    .replace(/kelas/gi, "")
    .replace(/unit/gi, "")
    .replace(/ruang/gi, "")
    .replace(/[^a-z0-9]/gi, "") 
    .trim();
};

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

export const normalizeSessionName = (session: string): string => {
  if (!session) return "Umum";
  // Menghapus penggabungan otomatis Hadis-Aswaja agar sesuai data asli user
  return session.trim();
};
