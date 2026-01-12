
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import Registration from './views/utils/Registration.tsx';
import Dashboard from './views/Dashboard.tsx';
import Attendance from './Attendance.tsx';
import Reports from './views/utils/Reports.tsx';
import Information from './views/utils/Information.tsx';
import Settings from './views/Settings.tsx';
import PrayerAttendance from './views/utils/PrayerAttendance.tsx';
import ControlPanel from './views/ControlPanel.tsx';
import { 
  UserProfile
} from './types.ts';
import { 
  saveAppData, clearAppData, addAttendanceRecord, addReportRecord,
  getActiveSession, subscribeToAppData
} from './services/dataService.ts';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const activeUser = getActiveSession();
    if (activeUser) {
      setProfile(activeUser);
    }
    
    // Subscribe ke Firebase real-time listener
    const unsubscribe = subscribeToAppData((data) => {
      setAppData(data);
      setLoading(false);
    });

    const timer = setTimeout(() => {
      if (loading) setRetryCount(prev => prev + 1);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [retryCount]);

  const handleLogout = () => {
    if (confirm("Logout dari aplikasi Smart Report?")) {
      clearAppData();
      setProfile(null);
      window.location.reload();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#064e3b] flex flex-col items-center justify-center text-white space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-3">
        <p className="font-black uppercase tracking-[0.4em] text-[10px]">Smart Report Mahasina</p>
        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
          {retryCount > 0 ? 'Menyiapkan Database Pertama Anda...' : 'Menghubungkan ke Cloud Jakarta...'}
        </p>
        {retryCount > 1 && (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest transition-all"
          >
            Refresh Koneksi
          </button>
        )}
      </div>
    </div>
  );

  if (!profile) return <Registration onComplete={(p) => setProfile(p)} />;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      role={profile.role}
      userName={profile.fullName}
      userEmail={profile.email}
      onLogout={handleLogout}
      academicConfig={appData.academicConfig}
    >
      <div className="animate-slide-up">
        {activeTab === 'dashboard' && <Dashboard {...appData} profile={profile} />}
        {activeTab === 'absen-santri' && (
          <Attendance 
            mode="Santri" 
            role={profile.role} 
            currentUser={profile.fullName} 
            {...appData} 
            onSave={recs => addAttendanceRecord(recs)} 
            onTeacherCheckIn={() => {}} 
          />
        )}
        {activeTab === 'absen-sholat' && (
          <PrayerAttendance 
            students={appData.students} 
            allPrayerRecords={appData.prayerAttendance} 
            currentUser={profile.fullName} 
            onSave={recs => saveAppData({ prayerAttendance: [...appData.prayerAttendance, ...recs] })} 
          />
        )}
        {activeTab === 'pelanggaran' && (
          <Reports 
            type="Violation" 
            role={profile.role} 
            currentUser={profile.fullName} 
            students={appData.students} 
            allReports={appData.reports} 
            templates={appData.violationTemplates} 
            onSave={rep => addReportRecord(rep)} 
          />
        )}
        {activeTab === 'prestasi' && (
          <Reports 
            type="Achievement" 
            role={profile.role} 
            currentUser={profile.fullName} 
            students={appData.students} 
            allReports={appData.reports} 
            templates={appData.achievementTemplates} 
            onSave={rep => addReportRecord(rep)} 
          />
        )}
        {activeTab === 'informasi' && (
          <Information 
            role={profile.role} 
            userEmail={profile.email} 
            data={appData} 
            onUpdateData={(t, d) => { 
              const update: any = {}; 
              if (t==='Siswa') update.students = d; 
              if (t==='Guru') update.teachers = d; 
              if (t==='Jadwal') update.schedules = d; 
              saveAppData(update); 
            }} 
          />
        )}
        {activeTab === 'control-panel' && (
          <ControlPanel 
            data={appData} 
            actions={{
              deleteAttendance: id => saveAppData({ attendance: appData.attendance.filter((a: any) => a.id !== id) }),
              deletePrayer: id => saveAppData({ prayerAttendance: appData.prayerAttendance.filter((p: any) => p.id !== id) }),
              deleteReport: id => saveAppData({ reports: appData.reports.filter((r: any) => r.id !== id) })
            }} 
          />
        )}
        {activeTab === 'pengaturan' && (
          <Settings 
            userEmail={profile.email} 
            academicConfig={appData.academicConfig} 
            onUpdateAcademic={c => saveAppData({ academicConfig: c })} 
            availableClasses={[]} 
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
