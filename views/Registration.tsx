
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { 
  registerUser, 
  getUsers, 
  syncWithGDrive, 
  setActiveSession,
  pullFromGDrive,
  setTeamDatabaseId,
  getTeamDatabaseId
} from '../services/dataService';
import { 
  LogIn, Mail, User, AlertCircle, Search, ChevronRight, Link2, CheckCircle2
} from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
  availableClasses: string[];
}

const Registration: React.FC<RegistrationProps> = ({ onComplete, availableClasses }) => {
  const [view, setView] = useState<'login' | 'signup' | 'discovery'>('login');
  const [discoveryStatus, setDiscoveryStatus] = useState('Mengautentikasi...');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', role: UserRole.GURU, classes: [] as string[] });

  // Deteksi Link Invitasi Otomatis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    if (joinId) {
      setTeamDatabaseId(joinId);
      console.log('Bergabung ke Tim Mahasina ID:', joinId);
    }
  }, []);

  const GOOGLE_CLIENT_ID = '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com';

  const startDiscovery = (profile: UserProfile) => {
    setActiveSession(profile);
    setDiscoveryStatus('Mencari Database Tim Mahasina...');
    setView('discovery');

    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (response: any) => {
        if (response.access_token) {
          localStorage.setItem('mahasina_cloud_token', response.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          setDiscoveryStatus('Sinkronisasi Data Tim...');
          await pullFromGDrive(response.access_token);
          onComplete(profile);
        } else {
          onComplete(profile);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = formData.email.toLowerCase().trim();
    const users = getUsers();
    
    // Default Admin
    if (emailLower === 'idarohmahasina@gmail.com') {
      const admin = { id: 'admin', fullName: 'Idaroh Pusat', email: emailLower, phone: '-', role: UserRole.IDAROH, classes: [] };
      startDiscovery(admin);
      return;
    }

    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);
    if (user) {
      startDiscovery(user);
    } else {
      setError('Email belum terdaftar di sistem Mahasina.');
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
              <p className="text-emerald-700 text-[8px] font-black uppercase tracking-[0.3em] mt-3">Digital Boarding System</p>
              {getTeamDatabaseId() && (
                <div className="mt-4 py-2 px-4 bg-emerald-50 text-emerald-700 rounded-full inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  <Link2 size={12}/> Mode Tim Aktif
                </div>
              )}
            </div>
            
            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-bold rounded-2xl flex items-center gap-3"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <span className="absolute left-5 top-5 text-slate-400"><Mail size={18} /></span>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-sm shadow-inner" placeholder="Email Google Anda" />
              </div>
              <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                Masuk & Hubungkan <ChevronRight size={16}/>
              </button>
            </form>
          </div>
        )}

        {view === 'discovery' && (
          <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
             <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-500">
                   <Search size={40} className="text-emerald-600 animate-pulse" />
                </div>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase">{discoveryStatus}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Menghubungkan Anda ke Database Tim...</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
