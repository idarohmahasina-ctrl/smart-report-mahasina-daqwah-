
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import { APP_LOGO } from '../../constants';
import { 
  setActiveSession, 
  pullFromGDrive,
  findDatabaseInDrive,
  createDatabaseInDrive
} from '../../services/dataService';
import { Mail, User, Phone, ChevronRight, RefreshCw, Database, Briefcase, ChevronDown, ShieldCheck } from 'lucide-react';

declare const google: any;

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'signup' | 'connect' | 'syncing'>('signup');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: UserRole.GURU
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.phone) {
      setStep('connect');
    }
  };

  const handleCloudConnect = () => {
    if (typeof google === 'undefined') {
      alert("Layanan Google belum siap. Periksa koneksi internet.");
      return;
    }

    setLoading(true);
    const client = google.accounts.oauth2.initTokenClient({
      client_id: '769350037876-j7u6mul9fb3be11984h4jre7i9afsktd.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: async (res: any) => {
        if (res.access_token) {
          localStorage.setItem('mahasina_cloud_token', res.access_token);
          localStorage.setItem('mahasina_cloud_connected', 'true');
          setStep('syncing');
          
          try {
            let dbId = await findDatabaseInDrive(res.access_token);
            // Auto-create database if it's the Idaroh email and database not found
            if (!dbId && formData.email.toLowerCase() === 'idarohmahasina@gmail.com') {
               dbId = await createDatabaseInDrive(res.access_token);
            }

            if (dbId) {
              await pullFromGDrive(res.access_token);
              
              const profile: UserProfile = {
                id: `u-${Date.now()}`,
                fullName: formData.fullName,
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone,
                role: formData.email.toLowerCase() === 'idarohmahasina@gmail.com' ? UserRole.IDAROH : formData.role
              };

              setActiveSession(profile);
              onComplete(profile);
            } else {
              setError("Database Tim tidak ditemukan. Hubungi Admin Idaroh untuk mendapatkan akses Cloud.");
              setStep('connect');
            }
          } catch (e) {
            setError("Gagal menyambungkan ke Cloud. Coba lagi.");
            setStep('connect');
          } finally {
            setLoading(false);
          }
        }
      }
    });
    client.requestAccessToken();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="text-center relative z-10">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto mb-6 bg-emerald-50 p-2 rounded-2xl shadow-inner" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Smart Report</h1>
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Pondok Pesantren Mahasina</p>
        </div>

        {step === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-5 animate-in slide-in-from-right-10">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <div className="relative">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Ustadz / Nama Petugas" />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">No. WhatsApp</label>
                <div className="relative">
                   <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="0812..." />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email Google</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="contoh@gmail.com" />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Peran</label>
                <div className="relative">
                   <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                   <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-emerald-600 transition-all appearance-none uppercase">
                      {/* Fixed: Cast Object.values(UserRole) as string[] to fix unknown type error */}
                      {(Object.values(UserRole) as string[]).map(role => <option key={role} value={role}>{role}</option>)}
                   </select>
                   <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                </div>
             </div>

             <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest hover:bg-emerald-700 transition-all mt-4">
                Daftar & Lanjut <ChevronRight size={18}/>
             </button>
          </form>
        )}

        {step === 'connect' && (
          <div className="space-y-8 animate-in slide-in-from-right-10 text-center">
             <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 inline-block mx-auto">
                <ShieldCheck size={48} className="text-emerald-600 mx-auto" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Koneksi Database Tim</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                   Klik tombol di bawah untuk menyambungkan profil Anda dengan Cloud Pesantren Mahasina.
                </p>
             </div>

             {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase border border-red-100">
                  {error}
               </div>
             )}

             <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-600 uppercase">
                   {formData.email}
                </div>
                <button onClick={handleCloudConnect} disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all">
                   {loading ? <RefreshCw className="animate-spin" size={18}/> : <Database size={18}/>}
                   Sambungkan Tim
                </button>
                <button onClick={() => setStep('signup')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-700">Edit Profil</button>
             </div>
          </div>
        )}

        {step === 'syncing' && (
          <div className="text-center py-10 space-y-8 animate-in zoom-in-95">
             <div className="relative w-20 h-20 mx-auto">
                <RefreshCw className="w-full h-full text-emerald-600 animate-spin" />
                <Database className="absolute inset-0 m-auto w-8 h-8 text-emerald-900" />
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Menghubungkan...</h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Sinkronisasi Master Data Pesantren</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
