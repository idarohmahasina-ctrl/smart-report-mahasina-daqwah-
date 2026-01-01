
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { registerUser, getUsers, syncWithGDrive } from '../services/dataService';
import { 
  UserPlus, LogIn, Mail, User, Phone, AlertCircle, Check, Cloud, 
  ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Copy, Globe, HelpCircle,
  Briefcase, CheckSquare, Square, Terminal, ShieldAlert, Flag, X
} from 'lucide-react';

// Declare google global variable for Google Identity Services
declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
  availableClasses: string[];
}

const Registration: React.FC<RegistrationProps> = ({ onComplete, availableClasses }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [step, setStep] = useState<'form' | 'cloud'>('form');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: UserRole.GURU,
    classes: [] as string[]
  });

  const [error, setError] = useState('');
  
  // Client ID ustadz yang baru
  const GOOGLE_CLIENT_ID = '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com';
  const currentOrigin = window.location.origin.replace(/\/$/, "");

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailLower = formData.email.toLowerCase().trim();

    if (isLoginView) {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase().trim() === emailLower);
      
      if (user) {
        setTempProfile(user);
        setStep('cloud');
      } else if (emailLower === 'idarohmahasina@gmail.com') {
        const admin: UserProfile = {
          id: 'admin-master',
          fullName: 'Idaroh Pusat Mahasina',
          email: 'idarohmahasina@gmail.com',
          phone: '-',
          role: UserRole.IDAROH,
          classes: []
        };
        registerUser(admin);
        setTempProfile(admin);
        setStep('cloud');
      } else {
        setError('Email tidak terdaftar di database lokal. Sila daftar sebagai petugas baru.');
      }
    } else {
      if (!formData.fullName || !formData.phone || !formData.email) {
        setError("Mohon lengkapi seluruh kolom data diri.");
        return;
      }

      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === emailLower)) {
        setError("Email sudah terdaftar. Sila gunakan menu login.");
        return;
      }

      const newUser: UserProfile = {
        id: Math.random().toString(36).substr(2, 9),
        fullName: formData.fullName,
        email: emailLower,
        phone: formData.phone,
        role: formData.role,
        classes: formData.classes
      };

      try {
        registerUser(newUser);
        setTempProfile(newUser);
        setStep('cloud');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleCloudConnect = () => {
    if (typeof google === 'undefined') {
      alert("Sistem Google sedang memuat... Sila refresh halaman.");
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        error_callback: (err: any) => {
          console.error("GSI Error:", err);
          setShowTroubleshoot(true);
        },
        callback: async (response: any) => {
          if (response.error) {
            console.error("Auth Error:", response.error);
            setShowTroubleshoot(true);
            return;
          }
          if (response.access_token) {
            setIsSyncing(true);
            const success = await syncWithGDrive(response.access_token);
            if (success) {
              localStorage.setItem('mahasina_cloud_connected', 'true');
              localStorage.setItem('mahasina_cloud_token', response.access_token);
              if (tempProfile) onComplete(tempProfile);
            } else {
              alert("Gagal sinkronisasi Database Idaroh.");
            }
            setIsSyncing(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setShowTroubleshoot(true);
    }
  };

  if (step === 'cloud') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans relative overflow-hidden text-slate-800">
        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 relative z-10 text-center animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Cloud size={40} />
           </div>
           
           <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Sinkronisasi Database</h2>
           <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-8 uppercase tracking-widest">
             Hubungkan ke Google Drive Idaroh Mahasina
           </p>

           <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8 text-left space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <User size={20} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Petugas</p>
                    <p className="text-xs font-black text-emerald-800">{tempProfile?.fullName}</p>
                 </div>
              </div>

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
                 <ShieldAlert className="text-indigo-600 shrink-0" size={24} />
                 <div>
                    <p className="text-[9px] font-black text-indigo-700 uppercase mb-1">Tips Keamanan:</p>
                    <p className="text-[10px] text-indigo-800 leading-relaxed italic">
                      Gunakan Akun Google yang terdaftar di sistem Mahasina untuk keamanan data.
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <button 
                onClick={handleCloudConnect} 
                disabled={isSyncing}
                className="w-full py-6 bg-emerald-700 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20} />} 
                Aktifkan Auto-Sync & Masuk
              </button>

              <button 
                onClick={() => tempProfile && onComplete(tempProfile)}
                className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-red-500 transition-all"
              >
                Masuk Tanpa Sinkronisasi (Hanya Lokal)
              </button>
           </div>

           {showTroubleshoot && (
             <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-left animate-in slide-in-from-top-4 space-y-6">
                <div className="flex items-center gap-3">
                   <AlertTriangle size={20} className="text-red-500" />
                   <p className="text-[11px] font-black text-white uppercase tracking-widest">Login Error atau Diblokir?</p>
                </div>
                
                <div className="p-5 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl space-y-4">
                   <div className="flex items-center gap-2 text-emerald-400">
                      <Check size={14}/>
                      <p className="text-[9px] font-black uppercase">Wajib: JavaScript Origins</p>
                   </div>
                   <p className="text-[9px] text-slate-300 leading-relaxed">
                     Pastikan URL di bawah ini dimasukkan ke kolom <b className="text-white">Authorized JavaScript origins</b> di Google Console.
                   </p>
                   <div className="flex items-center gap-2 bg-black/50 p-3 rounded-xl border border-slate-700">
                      <code className="text-[10px] font-black text-emerald-400 flex-1 truncate">{currentOrigin}</code>
                      <button onClick={() => { navigator.clipboard.writeText(currentOrigin); alert("URL disalin!"); }} className="p-2 hover:bg-slate-800 rounded-lg text-white">
                         <Copy size={14} />
                      </button>
                   </div>
                   <p className="text-[9px] text-red-400 font-bold uppercase italic flex items-center gap-2">
                     <X size={12}/> Jangan masukkan ke "Redirect URIs"
                   </p>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans relative overflow-hidden">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative z-10 border border-white/20 my-10 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="text-center mb-10">
          <img src={APP_LOGO} alt="Logo" className="w-20 h-20 mx-auto mb-6 bg-white rounded-full p-2 shadow-xl" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">Smart Report</h1>
          <p className="text-emerald-700 text-[9px] font-black uppercase tracking-[0.2em] mt-2 leading-relaxed">Pondok Pesantren Mahasina<br/>Darul Quran wal Hadis</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Petugas</label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-slate-400"><Mail size={18} /></span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                placeholder="ustadz@mahasina.id"
              />
            </div>
          </div>

          {!isLoginView && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><User size={18} /></span>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                    placeholder="Nama Lengkap"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WA</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><Phone size={18} /></span>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                    placeholder="0812..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><Briefcase size={18} /></span>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full pl-12 pr-10 py-4 border border-transparent bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none focus:bg-white transition-all"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl active:scale-95 mt-6 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
          >
            {isLoginView ? <LogIn size={18}/> : <UserPlus size={18}/>}
            {isLoginView ? 'Masuk Sekarang' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isLoginView ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              className="ml-2 text-emerald-600 font-black hover:underline"
            >
              {isLoginView ? 'KLIK DAFTAR' : 'KLIK LOGIN'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
