
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types.ts';
import { APP_LOGO } from '../../constants.tsx';
import { getUserByEmail, registerUser, setActiveSession } from '../../services/dataService.ts';
import { Mail, User, Phone, RefreshCw, AlertCircle, Zap, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    role: UserRole.GURU
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        // User sudah ada, langsung masuk
        setActiveSession(existingUser);
        onComplete(existingUser);
      } else {
        // User belum ada, lanjut isi detail
        setStep('details');
        setLoading(false);
      }
    } catch (err) {
      setError("Gagal menghubungi server. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      setError("Mohon lengkapi data profil Anda.");
      return;
    }

    setLoading(true);
    const newProfile: UserProfile = {
      id: `u-${Date.now()}`,
      fullName: formData.fullName,
      email: email.toLowerCase().trim(),
      phone: formData.phone,
      role: email.toLowerCase().trim() === 'idarohmahasina@gmail.com' ? UserRole.IDAROH : formData.role
    };

    try {
      await registerUser(newProfile);
      setActiveSession(newProfile);
      onComplete(newProfile);
    } catch (err) {
      setError("Gagal menyimpan profil. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#064e3b] p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        
        <div className="text-center space-y-3">
           <img src={APP_LOGO} className="w-20 h-20 mx-auto bg-emerald-50 p-3 rounded-3xl shadow-inner" alt="Logo" />
           <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Smart Report</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em]">Pesantren Mahasina</p>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
             <AlertCircle size={18} className="shrink-0" />
             <p className="text-[10px] font-bold leading-tight uppercase">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleCheckEmail} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email Petugas</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                   <input 
                     required 
                     type="email" 
                     value={email} 
                     onChange={e => setEmail(e.target.value)} 
                     className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" 
                     placeholder="nama@gmail.com" 
                   />
                </div>
                <p className="text-[8px] text-slate-400 italic ml-2">*Gunakan email yang sama untuk masuk di perangkat lain.</p>
             </div>

             <button 
               type="submit" 
               disabled={loading || !email}
               className="w-full bg-[#064e3b] text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50"
             >
               {loading ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
               Masuk ke Aplikasi
             </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right-10 duration-500">
             <button type="button" onClick={() => setStep('email')} className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-2">
                <ArrowLeft size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Ganti Email</span>
             </button>

             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                <p className="text-[8px] font-black text-emerald-800 uppercase tracking-widest opacity-60">Email Terdeteksi Baru:</p>
                <p className="text-[10px] font-bold text-emerald-900 truncate">{email}</p>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nama Lengkap</label>
                <div className="relative">
                   <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                   <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" placeholder="Nama Ustadz/ah" />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">No. WhatsApp</label>
                <div className="relative">
                   <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                   <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-emerald-600 transition-all shadow-inner" placeholder="0812..." />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tugas Utama</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-6 py-5 bg-slate-50 rounded-2xl outline-none font-black text-xs border-2 border-transparent focus:border-emerald-600 transition-all uppercase shadow-inner appearance-none cursor-pointer">
                   {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-[#064e3b] text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest hover:bg-emerald-800 transition-all active:scale-95"
             >
               {loading ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
               Selesaikan Pendaftaran
             </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-2 text-slate-300 pt-4 border-t border-slate-50">
           <ShieldCheck size={14} />
           <p className="text-[8px] font-bold uppercase tracking-widest">Data Terenkripsi & Cloud Mahasina</p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
