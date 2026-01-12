
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types.ts';
import { APP_LOGO } from '../../constants.tsx';
import { auth, googleProvider } from '../../services/firebase.ts';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { setActiveSession } from '../../services/dataService.ts';
import { Mail, User, Phone, RefreshCw, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

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
  const [error, setError] = useState<{msg: string} | null>(null);

  const validate = () => {
    if (!formData.fullName) {
      setError({ msg: "Nama Lengkap wajib diisi." });
      return false;
    }
    return true;
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const profile: UserProfile = {
      id: `quick-${Date.now()}`,
      fullName: formData.fullName,
      email: formData.email.toLowerCase().trim() || "guest@mahasina.com",
      phone: formData.phone || "-",
      role: (formData.email.toLowerCase().trim() === 'idarohmahasina@gmail.com') ? UserRole.IDAROH : formData.role
    };

    setActiveSession(profile);
    onComplete(profile);
  };

  const handleGoogleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setError(null);
    
    // Simpan data form sementara ke localStorage agar bisa dipulihkan jika halaman reload
    const tempProfile: UserProfile = {
      id: "pending",
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role
    };
    setActiveSession(tempProfile);

    try {
      // Di perangkat mobile, browser sering dialihkan. 
      // Kita coba popup dulu, jika gagal browser akan ditangani oleh AuthStateListener di App.tsx
      await signInWithPopup(auth, googleProvider);
      // Jika berhasil tanpa reload, App.tsx akan mendeteksi via onAuthStateChanged
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError({ msg: "Domain belum didaftarkan. Gunakan 'Masuk Sekarang' saja." });
        setLoading(false);
      } else {
        // Untuk error lain, biarkan user menggunakan login manual agar tidak macet
        setError({ msg: "Gagal Google Login. Silakan gunakan tombol 'Masuk Sekarang'." });
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center space-y-3">
           <img src={APP_LOGO} className="w-16 h-16 mx-auto bg-emerald-50 p-2 rounded-2xl" alt="Logo" />
           <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Smart Report Mahasina</h1>
           <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Portal Presensi & Laporan Digital</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
             <AlertCircle size={18} className="shrink-0" />
             <p className="text-[10px] font-bold leading-tight">{error.msg}</p>
          </div>
        )}

        <form onSubmit={handleQuickLogin} className="space-y-4">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nama Ustadz/ah</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                 <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all" placeholder="Nama Lengkap" />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tugas / Jabatan</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-black text-xs border-2 border-transparent focus:border-emerald-600 transition-all appearance-none cursor-pointer">
                 {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
           </div>

           <div className="pt-4 flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#064e3b] text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest hover:bg-emerald-800 transition-all active:scale-95"
              >
                {loading ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                Masuk Sekarang (Cepat)
              </button>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-100"></div>
                 <span className="flex-shrink mx-4 text-[8px] font-black text-slate-300 uppercase tracking-widest">Atau Sinkron Cloud</span>
                 <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin} 
                disabled={loading} 
                className="w-full bg-white border-2 border-slate-100 text-slate-600 font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" />
                Hubungkan Akun Google
              </button>
           </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-slate-300">
           <ShieldCheck size={12} />
           <p className="text-[8px] font-bold uppercase tracking-widest">Sistem Terenkripsi Mahasina</p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
