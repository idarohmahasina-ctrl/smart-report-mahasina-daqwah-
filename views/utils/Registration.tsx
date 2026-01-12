
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types.ts';
import { APP_LOGO } from '../../constants.tsx';
import { auth, googleProvider } from '../../services/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { setActiveSession } from '../../services/dataService.ts';
import { Mail, User, Phone, ChevronRight, RefreshCw, ShieldCheck, AlertCircle, Zap } from 'lucide-react';

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: UserRole.GURU
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{msg: string, code?: string} | null>(null);

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError({ msg: "Mohon lengkapi semua data profil." });
      return;
    }

    setLoading(true);
    const profile: UserProfile = {
      id: `local-${Date.now()}`,
      fullName: formData.fullName,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      role: formData.email.toLowerCase().trim() === 'idarohmahasina@gmail.com' ? UserRole.IDAROH : formData.role
    };

    setTimeout(() => {
      setActiveSession(profile);
      onComplete(profile);
      setLoading(false);
    }, 500);
  };

  const handleGoogleLogin = async () => {
    if (!formData.fullName) {
      setError({ msg: "Mohon isi Nama Lengkap Anda terlebih dahulu." });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Pastikan popup tidak diblokir
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const profile: UserProfile = {
        id: user.uid,
        fullName: formData.fullName,
        email: user.email?.toLowerCase() || '',
        phone: formData.phone || '-',
        role: (user.email?.toLowerCase() === 'idarohmahasina@gmail.com') ? UserRole.IDAROH : formData.role
      };

      // Simpan dan beri jeda sedikit untuk memastikan storage terisi
      setActiveSession(profile);
      setTimeout(() => {
        onComplete(profile);
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      if (err.code === 'auth/unauthorized-domain') {
        setError({ 
          msg: "Domain ini belum diizinkan di Firebase Console. Gunakan 'Akses Langsung' saja.",
          code: err.code 
        });
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError({ msg: "Jendela login ditutup sebelum selesai." });
      } else {
        setError({ msg: "Gagal login Google. Silakan gunakan Akses Langsung." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 md:p-6 font-sans">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-8 md:p-14 space-y-8 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="text-center space-y-4">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto bg-emerald-50 p-2 rounded-2xl shadow-inner" alt="Logo" />
           <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Smart Report</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Pesantren Digital Mahasina</p>
           </div>
        </div>

        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 animate-shake">
             <AlertCircle className="text-red-500 shrink-0" size={20} />
             <div className="space-y-1">
                <p className="text-[10px] font-black text-red-800 uppercase leading-none">Terjadi Kendala</p>
                <p className="text-[10px] font-medium text-red-600/80 leading-relaxed">{error.msg}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleDirectLogin} className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Lengkap</label>
                 <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" placeholder="Nama Ustadz/ah" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">No. WhatsApp</label>
                 <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" placeholder="0812..." />
                 </div>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email Petugas</label>
              <div className="relative">
                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                 <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" placeholder="contoh@gmail.com" />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tugas Utama</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-black text-xs border-2 border-transparent focus:border-emerald-600 transition-all uppercase shadow-inner appearance-none cursor-pointer">
                 {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
           </div>

           <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#064e3b] text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-800 transition-all active:scale-95"
              >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : <Zap size={18}/>}
                Akses Langsung (Tanpa Login)
              </button>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-100"></div>
                 <span className="flex-shrink mx-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">Atau Gunakan Akun</span>
                 <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin} 
                disabled={loading} 
                className="w-full bg-white border-2 border-slate-100 text-slate-600 font-black py-4 rounded-[2rem] shadow-sm flex items-center justify-center gap-4 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" />
                Masuk dengan Google
              </button>
           </div>
        </form>

        <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest">
           Sistem Laporan Cerdas Pesantren Mahasina &copy; 2025
        </p>
      </div>
    </div>
  );
};

export default Registration;
