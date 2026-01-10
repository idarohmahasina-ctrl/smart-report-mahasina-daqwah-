
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
    return appData.teachers.filter(t => !t.email || t.email.trim() === '');
  }, [appData.teachers]);

  const filteredTeachers = useMemo(() => {
    return unlinkedTeachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [unlinkedTeachers, searchTerm]);

  const startDiscovery = (profile: UserProfile) => {
    setActiveSession(profile);
    setDiscoveryStatus('Memverifikasi Izin Akses Google Drive...');
    setView('discovery');

    // Pastikan library Google Client sudah siap
    if (typeof google === 'undefined') {
      alert("Gagal memuat sistem Google. Mohon refresh halaman.");
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
          setDiscoveryStatus('Menarik Data Master Tim Mahasina...');
          
          const success = await pullFromGDrive(response.access_token);
          if (success) {
            setDiscoveryStatus('Berhasil Terhubung! Menyiapkan Dashboard...');
            setTimeout(() => onComplete(profile), 1000);
          } else {
            // Jika pull gagal tapi punya ID, coba sinkronisasi ulang
            onComplete(profile);
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
    
    // Bypass IDAROH
    if (emailLower === 'idarohmahasina@gmail.com') {
      const admin = { id: 'admin', fullName: 'Idaroh Pusat', email: emailLower, phone: '-', role: UserRole.IDAROH, classes: [] };
      startDiscovery(admin);
      return;
    }

    // Cek di Guru Master
    const masterTeacher = appData.teachers.find(t => t.email?.toLowerCase().trim() === emailLower);
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

    // Cek di user yang sudah daftar lokal
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);
    if (user) {
      startDiscovery(user);
    } else {
      // Jika benar-benar baru, arahkan untuk pilih nama guru
      if (appData.teachers.length > 0) {
        setView('claim_profile');
      } else {
        // Fallback: Jika database masih kosong, izinkan admin masuk dulu untuk upload
        setError('Data pengajar belum tersedia. Hubungi Admin Idaroh.');
      }
    }
  };

  const handleClaimProfile = (teacher: Teacher) => {
    if (confirm(`Apakah benar Anda adalah ${teacher.name}? Email ini akan ditautkan secara permanen.`)) {
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
              <p className="text-emerald-700 text-[8px] font-black uppercase tracking-[0.3em] mt-3">Sistem Mengenali Guru & Santri</p>
            </div>
            
            {error && (
              <div className="mb-6 p-5 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 border border-red-100">
                <AlertCircle size={20} className="shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">Akses Ditolak</p>
                  <p className="text-[9px] font-medium leading-relaxed uppercase">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Masukkan Email Google Anda</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></span>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-[2rem] outline-none font-black text-xs shadow-inner border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="contoh: ustadza@gmail.com" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 active:scale-95 transition-all">
                Masuk Sistem <ChevronRight size={16}/>
              </button>
            </form>
          </div>
        )}

        {view === 'claim_profile' && (
          <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
             <div className="flex items-center gap-4">
                <button onClick={() => setView('login')} className="p-3 bg-slate-100 rounded-xl text-slate-400"><ArrowLeft size={18}/></button>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Siapa Nama Anda?</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih nama Anda dari daftar database.</p>
                </div>
             </div>

             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-black text-[10px] uppercase shadow-inner border-2 border-transparent focus:border-emerald-600" placeholder="Cari Nama Anda Di Sini..." />
             </div>

             <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {filteredTeachers.map(t => (
                  <button key={t.id} onClick={() => handleClaimProfile(t)} className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between group shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-all font-black">{t.name[0]}</div>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 uppercase">{t.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Mapel: {t.subject}</p>
                        </div>
                     </div>
                     <UserCheck2 size={18} className="text-slate-200 group-hover:text-emerald-600 transition-all"/>
                  </button>
                ))}
             </div>
          </div>
        )}

        {view === 'discovery' && (
          <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
             <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-500">
                   <RefreshCw size={40} className="text-emerald-600 animate-spin" />
                </div>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{discoveryStatus}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Sinkronisasi Server Mahasina...</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
