
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { 
  setActiveSession, 
  getAppData, 
  getTeachersFromSchedules,
  pullFromGDrive,
  findDatabaseInDrive,
  normalizeName 
} from '../services/dataService';
import { Mail, User, ChevronRight, UserCheck2, RefreshCw, AlertCircle, ShieldCheck, List, Search, X, CloudDownload } from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'auth' | 'fetching' | 'identity'>('auth');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherList, setShowTeacherList] = useState(false);
  const [appData, setAppData] = useState(getAppData());

  const knownTeachers = useMemo(() => getTeachersFromSchedules(appData.schedules || []), [appData.schedules]);

  const detectedTeacher = useMemo(() => {
    if (fullName.length < 3) return null;
    const cleanInput = normalizeName(fullName);
    return knownTeachers.find(name => normalizeName(name).includes(cleanInput) || cleanInput.includes(normalizeName(name))) || null;
  }, [fullName, knownTeachers]);

  // Langkah 1: Otentikasi & Cari File
  const handleStartAuth = () => {
    if (typeof google === 'undefined') {
      alert("Google Services belum siap. Hubungkan ke Internet.");
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (res: any) => {
        if (res.access_token) {
          localStorage.setItem('mahasina_cloud_token', res.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          
          setStep('fetching');
          
          // FORCE SYNC: Tarik data KBM dari Cloud sekarang juga
          await findDatabaseInDrive(res.access_token);
          await pullFromGDrive(res.access_token);
          
          // Refresh data lokal setelah pull
          const freshData = getAppData();
          setAppData(freshData);
          
          setStep('identity');
        } else {
          alert("Gagal mendapatkan izin akses Google Drive.");
        }
      }
    });
    client.requestAccessToken();
  };

  const finalizeRegistration = async (forcedName?: string) => {
    setIsLoading(true);

    const finalName = forcedName || detectedTeacher || fullName.trim();
    let role = UserRole.SANTRI_OFFICER;
    
    const isTeacherInList = knownTeachers.some(name => name === finalName);
    
    if (email.toLowerCase() === 'idarohmahasina@gmail.com') role = UserRole.IDAROH;
    else if (isTeacherInList) role = UserRole.GURU;

    const profile: UserProfile = {
      id: `u-${Date.now()}`,
      fullName: finalName,
      email: email.toLowerCase().trim(),
      phone: '-',
      role: role
    };

    setActiveSession(profile);
    onComplete(profile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Dekorasi Background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        
        <div className="text-center relative z-10">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto mb-6 bg-emerald-50 p-2 rounded-2xl shadow-inner" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Smart Report</h1>
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Portal Digital Mahasina</p>
        </div>

        {step === 'auth' && (
          <div className="space-y-8 animate-in slide-in-from-right-10">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email Google Anda</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="contoh@gmail.com" />
                </div>
             </div>
             <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <ShieldCheck className="text-amber-600 mt-1 shrink-0" size={18}/>
                <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase">Klik tombol di bawah untuk menyambungkan email Anda dengan Database Pesantren Mahasina.</p>
             </div>
             <button onClick={handleStartAuth} disabled={!email.includes('@')} className="w-full bg-emerald-800 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all">
                Sambungkan Cloud <ChevronRight size={18}/>
             </button>
          </div>
        )}

        {step === 'fetching' && (
          <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
             <div className="relative w-20 h-20 mx-auto">
                <RefreshCw className="w-full h-full text-emerald-600 animate-spin" />
                <CloudDownload className="absolute inset-0 m-auto w-8 h-8 text-emerald-900" />
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Menarik Data...</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Mengambil Jadwal KBM & Daftar Guru</p>
             </div>
          </div>
        )}

        {step === 'identity' && (
          <div className="space-y-8 animate-in slide-in-from-right-10">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Lengkap Anda</label>
                <div className="relative">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Nama tanpa gelar..." />
                </div>
             </div>

             <div className="space-y-4">
                {detectedTeacher ? (
                  <div className="p-5 rounded-[2rem] border bg-emerald-50 border-emerald-100 flex items-center gap-4 animate-in zoom-in-95">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white shadow-lg">
                        <UserCheck2 size={20}/>
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Identitas Ditemukan:</p>
                        <p className="text-[11px] font-black uppercase mt-1 text-emerald-700">{detectedTeacher}</p>
                     </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-[2rem] border bg-blue-50 border-blue-100 flex flex-col gap-4 animate-in zoom-in-95">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white">
                           <AlertCircle size={20}/>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Pencocokan Otomatis Gagal</p>
                           <p className="text-[11px] font-black uppercase mt-1 text-blue-700">Petugas Umum</p>
                        </div>
                     </div>
                     <button onClick={() => setShowTeacherList(true)} className="w-full py-3 bg-white text-blue-700 rounded-xl border border-blue-200 text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                        Pilih Dari Daftar Guru Mahasina
                     </button>
                  </div>
                )}
                
                <button onClick={() => finalizeRegistration()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all">
                   Masuk Ke Dashboard
                </button>
             </div>
          </div>
        )}

        {/* MODAL DAFTAR GURU */}
        {showTeacherList && (
          <div className="fixed inset-0 z-[100] bg-emerald-950/80 backdrop-blur-md p-6 flex items-center justify-center">
             <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <List className="text-emerald-700" size={20}/>
                      <h3 className="text-sm font-black text-slate-800 uppercase">Daftar Guru Terarsip</h3>
                   </div>
                   <button onClick={() => setShowTeacherList(false)} className="p-2 text-slate-400 hover:text-red-600"><X size={20}/></button>
                </div>
                <div className="p-4 border-b">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input type="text" placeholder="Cari nama..." onChange={(e) => setFullName(e.target.value)} value={fullName} className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-emerald-600" />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                   {knownTeachers.filter(n => normalizeName(n).includes(normalizeName(fullName))).map((name) => (
                      <button key={name} onClick={() => { setFullName(name); setShowTeacherList(false); finalizeRegistration(name); }} className="w-full text-left p-4 hover:bg-emerald-50 rounded-2xl flex items-center justify-between group">
                         <span className="text-xs font-black text-slate-700 uppercase">{name}</span>
                         <ChevronRight size={16} className="text-slate-200 group-hover:text-emerald-600 transition-all"/>
                      </button>
                   ))}
                   {knownTeachers.length === 0 && (
                      <div className="p-10 text-center space-y-4">
                         <CloudDownload size={40} className="mx-auto text-slate-200 animate-bounce"/>
                         <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed">Data KBM tidak ditemukan di Cloud.<br/>Gunakan Link Join dari Admin.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
