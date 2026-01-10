
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, UserProfile, Teacher } from '../types';
import { APP_LOGO } from '../constants';
import { 
  registerUser, 
  getUsers, 
  setActiveSession,
  pullFromGDrive,
  setTeamDatabaseId,
  getTeamDatabaseId,
  getAppData,
  linkTeacherEmail
} from '../services/dataService';
import { 
  LogIn, Mail, User, AlertCircle, Search, ChevronRight, Link2, CheckCircle2, ShieldCheck, UserCheck2, ArrowLeft, RefreshCw
} from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
  availableClasses: string[];
}

const Registration: React.FC<RegistrationProps> = ({ onComplete, availableClasses }) => {
  const [view, setView] = useState<'login' | 'claim_profile' | 'discovery'>('login');
  const [discoveryStatus, setDiscoveryStatus] = useState('Mengautentikasi...');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const GOOGLE_CLIENT_ID = '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com';

  const appData = getAppData();
  
  const unlinkedTeachers = useMemo(() => {
    return (appData.teachers || []).filter(t => !t.email || t.email.trim() === '');
  }, [appData.teachers]);

  const filteredTeachers = useMemo(() => {
    return unlinkedTeachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [unlinkedTeachers, searchTerm]);

  const startDiscovery = (profile: UserProfile) => {
    setActiveSession(profile);
    setDiscoveryStatus('Memverifikasi Izin Google Drive...');
    setView('discovery');

    if (typeof google === 'undefined') {
      alert("Gagal memuat Google SDK. Mohon refresh halaman.");
      setView('login');
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (response: any) => {
        if (response.access_token) {
          localStorage.setItem('mahasina_cloud_token', response.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          setDiscoveryStatus('Menarik Data Tim Mahasina...');
          
          // Paksa tarik data dari cloud ke memori lokal
          const success = await pullFromGDrive(response.access_token);
          if (success) {
            setDiscoveryStatus('Sinkronisasi Berhasil!');
            setTimeout(() => onComplete(profile), 1000);
          } else {
            setDiscoveryStatus('Menyiapkan Dashboard Mandiri...');
            setTimeout(() => onComplete(profile), 1000);
          }
        } else {
          onComplete(profile);
        }
      },
      error_callback: (err: any) => {
        console.error("Auth error:", err);
        onComplete(profile);
      }
    });
    client.requestAccessToken();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = formData.email.toLowerCase().trim();
    
    // Admin Pusat
    if (emailLower === 'idarohmahasina@gmail.com') {
      const admin = { id: 'admin', fullName: 'Idaroh Pusat', email: emailLower, phone: '-', role: UserRole.IDAROH, classes: [] };
      startDiscovery(admin);
      return;
    }

    // Cek Guru yang sudah tertaut
    const masterTeacher = (appData.teachers || []).find(t => t.email?.toLowerCase().trim() === emailLower);
    if (masterTeacher) {
      const teacherProfile: UserProfile = {
        id: masterTeacher.id,
        fullName: masterTeacher.name,
        email: masterTeacher.email,
        phone: masterTeacher.phone,
        role: UserRole.GURU,
        classes: masterTeacher.teachingClasses
      };
      startDiscovery(teacherProfile);
      return;
    }

    // Jika belum tertaut, izinkan pilih profil guru (Claim)
    if (appData.teachers && appData.teachers.length > 0) {
      setView('claim_profile');
    } else {
      // Jika database benar-benar kosong (awal sekali), paksa re-auth dulu
      const newUser = { id: `user-${Date.now()}`, fullName: 'User Baru', email: emailLower, phone: '-', role: UserRole.GURU, classes: [] };
      startDiscovery(newUser);
    }
  };

  const handleClaimProfile = (teacher: Teacher) => {
    if (confirm(`Apakah Anda adalah ${teacher.name}? Akun ini akan tertaut ke email ${formData.email}.`)) {
      linkTeacherEmail(teacher.id, formData.email);
      const teacherProfile: UserProfile = {
        id: teacher.id,
        fullName: teacher.name,
        email: formData.email,
        phone: teacher.phone,
        role: UserRole.GURU,
        classes: teacher.teachingClasses
      };
      startDiscovery(teacherProfile);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans relative">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 md:p-14 relative z-10 overflow-hidden">
        
        {view === 'login' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <img src={APP_LOGO} alt="Logo" className="w-20 h-20 mx-auto mb-6 bg-white rounded-full p-2 shadow-xl" />
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-tight">Smart Report<br/>Mahasina</h1>
              <p className="text-emerald-700 text-[8px] font-black uppercase tracking-[0.3em] mt-3 italic">Portal Digital Santri & Guru</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Gunakan Email Google Anda</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></span>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-[2rem] outline-none font-black text-xs shadow-inner border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="ustadz.fulan@gmail.com" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 active:scale-95 transition-all">
                Masuk & Sinkron <ChevronRight size={16}/>
              </button>
            </form>
          </div>
        )}

        {view === 'claim_profile' && (
          <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
             <div className="flex items-center gap-4">
                <button onClick={() => setView('login')} className="p-3 bg-slate-100 rounded-xl text-slate-400"><ArrowLeft size={18}/></button>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cari Profil Anda</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih nama Anda di database.</p>
                </div>
             </div>
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-black text-[10px] uppercase shadow-inner" placeholder="Cari Nama..." />
             </div>
             <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {filteredTeachers.map(t => (
                  <button key={t.id} onClick={() => handleClaimProfile(t)} className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between group shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black">{t.name[0]}</div>
                        <p className="text-[11px] font-black text-slate-800 uppercase">{t.name}</p>
                     </div>
                     <UserCheck2 size={18} className="text-slate-200 group-hover:text-emerald-600 transition-all"/>
                  </button>
                ))}
             </div>
          </div>
        )}

        {view === 'discovery' && (
          <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
             <RefreshCw size={50} className="text-emerald-600 animate-spin mx-auto" />
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{discoveryStatus}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Mohon Tunggu Sebentar...</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
