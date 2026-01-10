
import React, { useState, useMemo } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { 
  setActiveSession, 
  getAppData, 
  getTeachersFromSchedules,
  pullFromGDrive,
  normalizeName 
} from '../services/dataService';
import { Mail, User, ChevronRight, Search, ShieldCheck, UserCheck2, RefreshCw, AlertCircle } from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'auth' | 'identity' | 'sync'>('auth');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const appData = getAppData();
  const knownTeachers = useMemo(() => getTeachersFromSchedules(appData.schedules || []), [appData.schedules]);

  // Cari kecocokan nama secara cerdas
  const detectedTeacher = useMemo(() => {
    if (fullName.length < 3) return null;
    const cleanInput = normalizeName(fullName);
    return knownTeachers.find(name => normalizeName(name) === cleanInput) || null;
  }, [fullName, knownTeachers]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('identity');
  };

  const finalizeRegistration = async () => {
    setIsLoading(true);
    setStep('sync');

    // Gunakan detectedTeacher jika ada, jika tidak gunakan input asli
    const finalName = detectedTeacher || fullName.trim();
    
    let role = UserRole.SANTRI_OFFICER;
    if (email.toLowerCase() === 'idarohmahasina@gmail.com') role = UserRole.IDAROH;
    else if (detectedTeacher) role = UserRole.GURU;

    const profile: UserProfile = {
      id: `u-${Date.now()}`,
      fullName: finalName,
      email: email.toLowerCase().trim(),
      phone: '-',
      role: role,
      classes: detectedTeacher ? appData.schedules.filter(s => s.teacherName === detectedTeacher).map(s => s.class) : []
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
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto mb-6 bg-emerald-50 p-2 rounded-2xl" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Smart Report</h1>
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Portal Digital Mahasina</p>
        </div>

        {step === 'auth' && (
          <form onSubmit={handleAuth} className="space-y-6">
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
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ketik Nama Anda (Cukup Nama Panggilan)</label>
                <div className="relative">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Misal: Ahmad" />
                </div>
                <p className="text-[8px] text-slate-400 font-medium mt-2 italic px-1">Sistem akan otomatis membersihkan gelar & mencocokkan dengan database jadwal.</p>
             </div>

             <div className="space-y-3">
                {fullName.length >= 3 && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in zoom-in-95 ${detectedTeacher ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${detectedTeacher ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {detectedTeacher ? <UserCheck2 size={20}/> : <AlertCircle size={20}/>}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Status Deteksi:</p>
                        <p className={`text-[11px] font-black uppercase mt-1 ${detectedTeacher ? 'text-emerald-700' : 'text-blue-700'}`}>
                           {detectedTeacher ? `Terdeteksi Sebagai: ${detectedTeacher}` : 'Petugas Santri / Umum'}
                        </p>
                     </div>
                  </div>
                )}
                
                <button onClick={finalizeRegistration} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all">
                   Masuk Dashboard
                </button>
             </div>
          </div>
        )}

        {step === 'sync' && (
          <div className="text-center py-10 space-y-6 animate-in zoom-in-95">
             <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
             <h2 className="text-lg font-black text-slate-800 uppercase">Menghubungkan Database...</h2>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sinkronisasi Cloud Aktif</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
