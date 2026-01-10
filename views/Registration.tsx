
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { 
  setActiveSession, 
  getAppData, 
  getTeachersFromSchedules,
  pullFromGDrive,
  normalizeName 
} from '../services/dataService';
import { Mail, User, ChevronRight, UserCheck2, RefreshCw, AlertCircle, ShieldCheck, List, Search, X } from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'auth' | 'identity' | 'sync'>('auth');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherList, setShowTeacherList] = useState(false);

  const [appData, setAppData] = useState(getAppData());
  
  // Refresh data master saat komponen dimuat
  useEffect(() => {
    setAppData(getAppData());
  }, []);

  const knownTeachers = useMemo(() => getTeachersFromSchedules(appData.schedules || []), [appData.schedules]);

  // Deteksi otomatis dengan logika normalizeName yang sudah diperbarui
  const detectedTeacher = useMemo(() => {
    if (fullName.length < 3) return null;
    const cleanInput = normalizeName(fullName);
    return knownTeachers.find(name => normalizeName(name).includes(cleanInput) || cleanInput.includes(normalizeName(name))) || null;
  }, [fullName, knownTeachers]);

  const finalizeRegistration = async (forcedName?: string) => {
    setIsLoading(true);
    setStep('sync');

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

    if (typeof google !== 'undefined') {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (res: any) => {
          if (res.access_token) {
            localStorage.setItem('mahasina_cloud_token', res.access_token);
            localStorage.setItem('mahasina_cloud_connected', 'true');
            await pullFromGDrive(res.access_token);
          }
          setActiveSession(profile);
          onComplete(profile);
        },
        error_callback: (err: any) => {
          setActiveSession(profile);
          onComplete(profile);
        }
      });
      client.requestAccessToken();
    } else {
      setActiveSession(profile);
      onComplete(profile);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative">
        <div className="text-center">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto mb-6 bg-emerald-50 p-2 rounded-2xl" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Smart Report</h1>
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Portal Digital Mahasina</p>
        </div>

        {step === 'auth' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('identity'); }} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email Google Anda</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="contoh@gmail.com" />
                </div>
             </div>
             <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-emerald-700">
                Lanjutkan <ChevronRight size={18}/>
             </button>
          </form>
        )}

        {step === 'identity' && (
          <div className="space-y-8 animate-in slide-in-from-right-10">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Lengkap Anda</label>
                <div className="relative">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Misal: Ahmad Zulkifli" />
                </div>
             </div>

             <div className="space-y-4">
                {detectedTeacher ? (
                  <div className="p-5 rounded-[2rem] border bg-emerald-50 border-emerald-100 flex items-center gap-4 animate-in zoom-in-95">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white shadow-lg">
                        <UserCheck2 size={20}/>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Terdeteksi Sebagai Guru:</p>
                        <p className="text-[11px] font-black uppercase mt-1 text-emerald-700">{detectedTeacher}</p>
                     </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-[2rem] border bg-blue-50 border-blue-100 flex items-center justify-between group animate-in zoom-in-95">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white">
                           <AlertCircle size={20}/>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Status Anda:</p>
                           <p className="text-[11px] font-black uppercase mt-1 text-blue-700">Petugas Umum</p>
                        </div>
                     </div>
                     <button onClick={() => setShowTeacherList(true)} className="text-[9px] font-black text-blue-800 bg-white px-3 py-2 rounded-xl shadow-sm border border-blue-100 uppercase hover:bg-blue-600 hover:text-white transition-all">
                        Cari di Daftar Guru
                     </button>
                  </div>
                )}

                <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                   <ShieldCheck className="text-amber-600 mt-1 shrink-0" size={20}/>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-800 uppercase leading-none">Sinkronisasi Cloud:</p>
                      <p className="text-[9px] font-medium text-amber-700 leading-relaxed">Pastikan mencentang kotak izin Google Drive agar data absen Anda muncul di perangkat ustadz lain.</p>
                   </div>
                </div>
                
                <button onClick={() => finalizeRegistration()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all">
                   Masuk Ke Dashboard
                </button>
             </div>
          </div>
        )}

        {step === 'sync' && (
          <div className="text-center py-10 space-y-6 animate-in zoom-in-95">
             <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
             <h2 className="text-lg font-black text-slate-800 uppercase">Menghubungkan...</h2>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sinkronisasi Database Drive</p>
          </div>
        )}

        {/* MODAL DAFTAR GURU UNTUK IDENTIFIKASI MANUAL */}
        {showTeacherList && (
          <div className="fixed inset-0 z-[100] bg-emerald-950/80 backdrop-blur-md p-6 flex items-center justify-center">
             <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <List className="text-emerald-700" size={20}/>
                      <h3 className="text-sm font-black text-slate-800 uppercase">Pilih Nama Anda</h3>
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
                         <ChevronRight size={16} className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"/>
                      </button>
                   ))}
                   {knownTeachers.length === 0 && (
                      <div className="p-8 text-center space-y-3">
                         <AlertCircle size={32} className="mx-auto text-amber-500"/>
                         <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed">Data KBM belum diunggah.<br/>Silakan Hubungi Idaroh.</p>
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
