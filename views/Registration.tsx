
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { registerUser, getUsers, syncWithGDrive } from '../services/dataService';
import { 
  UserPlus, LogIn, Mail, User, Phone, AlertCircle, Check, Cloud, 
  ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Copy, Globe, HelpCircle,
  Briefcase, CheckSquare, Square, Terminal
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
  const GOOGLE_CLIENT_ID = '382977690476-qqlbo0r0q27hprcjettr8l34t513pii4.apps.googleusercontent.com';

  // Deteksi origin murni untuk Google Console
  const currentOrigin = window.location.origin.replace(/\/$/, "");

  const toggleClass = (cls: string) => {
    const current = [...formData.classes];
    if (current.includes(cls)) {
      setFormData({ ...formData, classes: current.filter(c => c !== cls) });
    } else {
      setFormData({ ...formData, classes: [...current, cls] });
    }
  };

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
        setError('Email tidak terdaftar. Sila klik "KLIK REGISTRASI" di bawah jika Anda petugas baru.');
      }
    } else {
      if (!formData.fullName || !formData.phone || !formData.email) {
        setError("Mohon lengkapi seluruh kolom: Nama, Email, dan No. Telepon.");
        return;
      }

      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === emailLower)) {
        setError("Email sudah terdaftar. Sila login.");
        return;
      }

      if (formData.role === UserRole.MUSYRIF && formData.classes.length === 0) {
        setError("Musyrif/ah wajib memilih minimal satu Kelas Binaan.");
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
      alert("Sistem Google sedang memuat... Mohon tunggu sebentar.");
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
              alert("Gagal sinkronisasi database Idaroh. Sila coba kembali.");
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

  const handleSkipCloud = () => {
    if (confirm("Peringatan: Tanpa Sinkronisasi Database Idaroh, laporan Anda tidak akan tercatat di sistem pusat Mahasina. Lanjutkan masuk Mode Lokal?")) {
      if (tempProfile) onComplete(tempProfile);
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

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <p className="text-[9px] font-black text-indigo-700 uppercase mb-2">💡 Tips Login Pertama:</p>
                 <p className="text-[10px] text-indigo-800 leading-relaxed italic">
                   Jika muncul layar "Google hasn't verified this app", klik <b>Advanced</b> lalu klik <b>Go to Smart Report Mahasina (unsafe)</b>.
                 </p>
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
                onClick={handleSkipCloud}
                className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-red-500 transition-all"
              >
                Masuk Tanpa Sinkronisasi (Hanya Lokal)
              </button>
           </div>

           {showTroubleshoot && (
             <div className="mt-8 p-6 bg-red-50 rounded-3xl border border-red-100 text-left animate-in slide-in-from-top-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <AlertTriangle size={16} className="text-red-600" />
                   <p className="text-[10px] font-black text-red-700 uppercase">Perlu Perbaikan Otorisasi Google</p>
                </div>
                
                <p className="text-[9px] text-red-600 font-medium leading-relaxed">
                  Buka <b>Google Cloud Console</b>. Pastikan "Authorized JavaScript Origins" berisi URL ini (Tanpa miring di akhir):
                </p>
                
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-red-200">
                   <Globe size={14} className="text-slate-400" />
                   <code className="text-[10px] font-black text-slate-700 flex-1 truncate">{currentOrigin}</code>
                   <button onClick={() => { navigator.clipboard.writeText(currentOrigin); alert("URL disalin!"); }} className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600">
                      <Copy size={14} />
                   </button>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-xl">
                   <p className="text-[8px] text-slate-400 font-black uppercase mb-2 flex items-center gap-1"><Terminal size={10}/> App Client ID:</p>
                   <code className="text-[8px] text-emerald-400 break-all font-mono leading-tight">{GOOGLE_CLIENT_ID}</code>
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
            <>
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><User size={18} /></span>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                    placeholder="Nama Sesuai KTP/SK"
                  />
                </div>
              </div>

              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon (WhatsApp)</label>
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

              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan / Peran Petugas</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><Briefcase size={18} /></span>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, classes: [] })}
                    className="w-full pl-12 pr-10 py-4 border border-transparent bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none focus:bg-white transition-all"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === UserRole.MUSYRIF && (
                <div className="space-y-3 animate-in slide-in-from-left-4 duration-500 mt-4 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-inner">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                     <CheckSquare size={14}/> Pilih Kelas Binaan (Dapat Lebih Dari Satu)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                     {availableClasses.length > 0 ? availableClasses.map(cls => (
                       <button
                         key={cls}
                         type="button"
                         onClick={() => toggleClass(cls)}
                         className={`px-3 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border-2 ${
                           formData.classes.includes(cls) 
                           ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                           : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'
                         }`}
                       >
                         {formData.classes.includes(cls) ? <CheckSquare size={12}/> : <Square size={12}/>}
                         {cls}
                       </button>
                     )) : (
                       <p className="col-span-3 text-[9px] text-slate-400 italic text-center py-4">Sila upload data santri terlebih dahulu untuk memunculkan daftar kelas.</p>
                     )}
                  </div>
                </div>
              )}
            </>
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
            {isLoginView ? 'Petugas baru di Mahasina?' : 'Sudah terdaftar sebelumnya?'}
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              className="ml-2 text-emerald-600 font-black hover:underline"
            >
              {isLoginView ? 'KLIK REGISTRASI' : 'KLIK LOGIN'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
