
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { APP_LOGO } from '../constants';
import { registerUser, getUsers } from '../services/dataService';
import { UserPlus, LogIn, Mail, User, Phone, AlertCircle } from 'lucide-react';

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: UserRole.GURU,
    classes: [] as string[]
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailLower = formData.email.toLowerCase().trim();

    if (isLoginView) {
      const users = getUsers();
      // Prioritaskan pencocokan email untuk sinkronisasi data dari Idaroh
      const user = users.find(u => u.email.toLowerCase().trim() === emailLower);
      
      if (user) {
        onComplete(user);
      } else if (emailLower === 'idarohmahasina@gmail.com') {
        // Auto-create untuk Super Admin jika belum ada di database lokal
        const admin: UserProfile = {
          id: 'admin-master',
          fullName: 'Idaroh Pusat Mahasina',
          email: 'idarohmahasina@gmail.com',
          phone: '-',
          role: UserRole.IDAROH,
          classes: []
        };
        registerUser(admin);
        onComplete(admin);
      } else {
        setError('Email tidak terdaftar atau belum diaktivasi oleh Idaroh.');
      }
    } else {
      if (!formData.fullName || !formData.phone || !formData.email) {
        setError("Mohon lengkapi seluruh kolom pendaftaran.");
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
        onComplete(newUser);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#065f46] p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-700/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-800/40 rounded-full blur-3xl" />

      <div className="bg-white/95 backdrop-blur-md w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <img src={APP_LOGO} alt="Logo" className="w-24 h-24 mx-auto mb-6 bg-white rounded-full p-3 shadow-xl" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight">Smart Report</h1>
          <p className="text-emerald-700 text-[9px] font-black uppercase tracking-[0.2em] mt-2 leading-relaxed">Pondok Pesantren Mahasina<br/>Darul Quran wal Hadis</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><User size={18} /></span>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                    placeholder="Nama Sesuai Jadwal"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telepon</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-slate-400"><Phone size={18} /></span>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                    placeholder="08..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-5 py-4 border border-transparent bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-emerald-950/20 active:scale-95 mt-6 flex items-center justify-center gap-3"
          >
            {isLoginView ? <LogIn size={20} /> : <UserPlus size={20} />}
            <span className="uppercase tracking-[0.2em] text-xs">
              {isLoginView ? 'Masuk Sekarang' : 'Daftarkan Petugas'}
            </span>
          </button>
        </form>

        <div className="mt-10 text-center pt-8 border-t border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {isLoginView ? 'Petugas Baru?' : 'Sudah Ada Akun?'}
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              className="ml-2 text-emerald-600 font-black hover:underline underline-offset-4"
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
