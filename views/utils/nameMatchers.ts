
export const normalizeName = (name: string): string => {
  if (!name) return "";
  
  // Daftar gelar dan sapaan yang sering digunakan di pesantren
  const titles = [
    /ustadz/gi, /ustadzah/gi, /bu /gi, /pak /gi, /kyai/gi, /nyai/gi,
    /s\.ag/gi, /lc/gi, /m\.pd/gi, /s\.pd/gi, /m\.ag/gi, /s\.hum/gi, 
    /h\./gi, /hj\./gi, /dr\./gi, /dra\./gi, /drs\./gi, /m\.si/gi,
    /,/g, /\./g // Hapus koma dan titik
  ];

  let cleanName = name.toLowerCase();
  titles.forEach(pattern => {
    cleanName = cleanName.replace(pattern, "");
  });

  return cleanName.trim();
};

export const isTeacherMatch = (fullName: string, scheduleName: string): boolean => {
  const n1 = normalizeName(fullName);
  const n2 = normalizeName(scheduleName);
  
  // Cek apakah n1 ada di dalam n2 atau sebaliknya
  return n1.length > 2 && (n2.includes(n1) || n1.includes(n2));
};
