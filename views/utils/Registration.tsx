
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types.ts';
import { APP_LOGO } from '../../constants.tsx';
import { auth, googleProvider } from '../../services/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { setActiveSession } from '../../services/dataService.ts';
import { Mail, User, Phone, ChevronRight, RefreshCw, Briefcase, ChevronDown, ShieldCheck } from 'lucide-react';

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'signup' | 'connect'>('signup');
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

  const handleFirebaseLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user.email?.toLowerCase() !== formData.email.toLowerCase()) {
        throw new Error(`Email yang Anda pilih (${user.email}) tidak sesuai dengan pendaftaran (${formData.email})`);
      }

      const profile: UserProfile = {
        id: user.uid,
        fullName: formData.fullName,
        email: user.email,
        phone: formData.phone,
        role: user.email.toLowerCase() === 'idarohmahasina@gmail.com' ? UserRole.IDAROH : formData.role
      };

      setActiveSession(profile);
      onComplete(profile);
    } catch (err: any) {
      setError(err.message || "Gagal login dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="text-center">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto mb-6 bg-emerald-50 p-2 rounded-2xl shadow-inner" alt="Logo" />
           <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Smart Report</h1>
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Pesantren Digital Mahasina</p>
        </div>

        {step === 'signup' ? (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nama Lengkap</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Ustadz / Nama Petugas" />
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">No. WhatsApp</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="0812..." />
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email Google</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="contoh@gmail.com" />
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Peran</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-emerald-600 transition-all uppercase">
                   {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
             </div>

             <button type="submit" className="w-full bg-emerald-800 text-white font-black py-5 rounded-2xl shadow-lg flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest hover:bg-emerald-700 transition-all">
                Lanjut Ke Cloud <ChevronRight size={18}/>
             </button>
          </form>
        ) : (
          <div className="space-y-8 text-center animate-in slide-in-from-right-10">
             <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 inline-block">
                <ShieldCheck size={48} className="text-emerald-600" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Login Firebase</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                   Verifikasi email Anda dengan Google untuk mengaktifkan sinkronisasi real-time.
                </p>
             </div>

             {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase border border-red-100">
                  {error}
               </div>
             )}

             <button 
                onClick={handleFirebaseLogin} 
                disabled={loading} 
                className="w-full bg-white border-2 border-slate-200 text-slate-700 font-black py-5 rounded-2xl shadow-sm flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all"
             >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <Mail size={18}/>}
                Login dengan Google
             </button>
             
             <button onClick={() => setStep('signup')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kembali ke Edit Profil</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
