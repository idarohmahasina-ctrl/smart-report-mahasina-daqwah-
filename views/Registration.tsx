
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { 
  registerUser, 
  getUsers, 
  syncWithGDrive, 
  setActiveSession 
} from '../services/dataService';
import { 
  UserPlus, LogIn, Mail, User, Phone, AlertCircle, Cloud, 
  ShieldCheck, RefreshCw, Smartphone, Briefcase, BookmarkCheck,
  ChevronRight, ArrowLeft
} from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
  availableClasses: string[];
}

const Registration: React.FC<RegistrationProps> = ({ onComplete, availableClasses }) => {
  const [view, setView] = useState<'login' | 'signup' | 'cloud'>('login');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: UserRole.GURU,
    classes: [] as string[]
  });

  const GOOGLE_CLIENT_ID = '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com';

  const takenClasses = getUsers()
    .filter(u => u.role === UserRole.MUSYRIF)
    .flatMap(u => u.classes || []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailLower = formData.email.toLowerCase().trim();
    const users = getUsers();
    
    // Spesial case untuk Admin Utama
    if (emailLower === 'idarohmahasina@gmail.com') {
      const admin: UserProfile = {
        id: 'admin-master',
        fullName: 'Idaroh Pusat Mahasina',
        email: 'idarohmahasina@gmail.com',
        phone: '-',
        role: UserRole.IDAROH,
        classes: []
      };
      setActiveSession(admin);
      onComplete(admin);
      return;
    }

    // Mencari di database lokal apakah email sudah terdaftar
    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);
    if (user) {
      setActiveSession(user);
      onComplete(user);
    } else {
      setError('Email tidak ditemukan. Pastikan Anda sudah terdaftar atau hubungi Admin Idaroh.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Mohon lengkapi seluruh data profil Anda.');
      return;
    }

    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      role: formData.role,
      classes: formData.classes
    };

    try {
      registerUser(newUser);
      setTempProfile(newUser);
      setView('cloud');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloudActivation = (useCloud: boolean) => {
    if (!tempProfile) return;

    if (!useCloud) {
      localStorage.setItem('mahasina_cloud_connected', 'false');
      setActiveSession(tempProfile);
      onComplete(tempProfile);
      return;
    }

    if (typeof google === 'undefined') {
      alert("Sistem Google Drive sedang dimuat, silakan tunggu sebentar.");
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.access_token) {
            setIsSyncing(true);
            const success = await syncWithGDrive(response.access_token);
            if (success) {
              localStorage.setItem('mahasina_cloud_connected', 'true');
              localStorage.setItem('mahasina_cloud_token', response.access_token);
              setActiveSession(tempProfile);
              onComplete(tempProfile);
            } else {
              alert("Koneksi Cloud gagal. Anda tetap bisa masuk dengan mode penyimpanan lokal.");
              localStorage.setItem('mahasina_cloud_connected', 'false');
              setActiveSession(tempProfile);
              onComplete(tempProfile);
            }
            setIsSyncing(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      alert("Terjadi gangguan pada layanan Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] p-10 md:p-14 relative z-10 my-10 max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <img src={APP_LOGO} alt="Logo" className="w-20 h-20 mx-auto mb-6 bg-white rounded-full p-2 shadow-xl" />
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight">Smart Report<br/>Mahasina</h1>
              <p className="text-emerald-700 text-[8px] font-black uppercase tracking-[0.3em] mt-3">Sistem Informasi Pesantren Digital</p>
            </div>
            
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Masuk Sistem</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Gunakan email yang sudah terdaftar</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-400"><Mail size={18} /></span>
                  <input
                    required
                    type="email"
                    autoFocus
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 focus:bg-white rounded-[2rem] outline-none font-bold text-sm transition-all shadow-inner"
                    placeholder="email@mahasina.id"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                Masuk Sekarang <ChevronRight size={16}/>
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Belum memiliki akses petugas?</p>
              <button 
                onClick={() => { setView('signup'); setError(''); }}
                className="text-emerald-700 font-black text-[11px] uppercase tracking-[0.15em] hover:text-emerald-900 flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all"
              >
                <UserPlus size={16}/> Klik Di Sini Untuk Daftar
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SIGN UP */}
        {view === 'signup' && (
          <div className="animate-in slide-in-from-right-4 duration-500 pb-4">
            <button onClick={() => setView('login')} className="mb-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-700 transition-colors">
              <ArrowLeft size={16}/> Kembali Ke Login
            </button>
            
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Registrasi Baru</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Pastikan data yang diisi benar</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-slate-400"><User size={18} /></span>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="Contoh: Ustadz Ahmad" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Resmi</label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-slate-400"><Mail size={18} /></span>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="email@mahasina.id" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-slate-400"><Phone size={18} /></span>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" placeholder="08..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Peran / Jabatan</label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-slate-400"><Briefcase size={18} /></span>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole, classes: []})} className="w-full pl-14 pr-10 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none shadow-inner">
                      {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {formData.role === UserRole.MUSYRIF && (
                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck size={18} className="text-emerald-700"/>
                    <label className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Pilih Kelas Binaan</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {availableClasses.map(cls => {
                      const isTaken = takenClasses.includes(cls);
                      const isSelected = formData.classes.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          disabled={isTaken && !isSelected}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
                            }));
                          }}
                          className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 ${
                            isSelected ? 'bg-emerald-700 border-emerald-700 text-white shadow-md' : 
                            isTaken ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed' : 
                            'bg-white border-emerald-100 text-emerald-800 hover:border-emerald-300'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                Daftar & Aktivasi Akun <ChevronRight size={18}/>
              </button>
            </form>
          </div>
        )}

        {/* VIEW: CLOUD ACTIVATION */}
        {view === 'cloud' && (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <Cloud size={48} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sinkronisasi Cloud</h2>
              <p className="text-[11px] text-slate-500 mt-3 px-6 leading-relaxed font-medium">Hubungkan ke Google Drive untuk mencadangkan data laporan pesantren Anda secara otomatis.</p>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                onClick={() => handleCloudActivation(true)}
                disabled={isSyncing}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-4 uppercase tracking-widest text-[10px] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} Aktifkan Google Drive Sync
              </button>
              <button 
                onClick={() => handleCloudActivation(false)}
                className="w-full py-4 text-slate-400 font-black flex items-center justify-center gap-2 uppercase tracking-widest text-[9px] active:scale-95 transition-all"
              >
                <Smartphone size={16}/> Gunakan Penyimpanan Lokal Saja
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
