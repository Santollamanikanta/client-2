import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Phone, MapPin, ShieldCheck, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import SupportSection from '../components/SupportSection';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    address: profile?.address || '',
    skills: (profile as any)?.skills || [],
    isOnline: (profile as any)?.isOnline ?? true,
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-natural-muted mb-8 hover:text-natural-text transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-natural-text mb-4">My Profile</h1>
        <p className="text-natural-muted font-medium">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Profile Info */}
        <div className="card-natural p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <img 
                src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                alt="Profile" 
                className="w-32 h-32 rounded-[40px] border-8 border-natural-surface object-cover shadow-soft mb-4"
              />
              <div className="absolute bottom-4 right-0 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-natural-text">{profile?.displayName}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mt-1">{profile?.role}</p>
            <div className="mt-4 px-3 py-1 bg-natural-surface rounded-lg border border-natural-border flex items-center gap-2">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">ID:</span>
              <code className="text-[10px] font-mono text-natural-text select-all">{user?.uid}</code>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted" />
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium" 
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted" />
                <input 
                  type="tel" 
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-2">Primary Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-natural-muted" />
                <textarea 
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                  placeholder="Your default service address"
                />
              </div>
            </div>

            {profile?.role === 'provider' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-2">Skills & Specializations</label>
                  <p className="text-[10px] text-natural-muted mb-4 font-medium italic">Enter skills separated by commas (e.g. Plumbing, Leak Repair)</p>
                  <input 
                    type="text" 
                    value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full px-6 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="Skills separated by commas"
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-natural-surface rounded-2xl border border-natural-border">
                  <div>
                    <h4 className="text-sm font-bold text-natural-text">Availability Status</h4>
                    <p className="text-[10px] text-natural-muted font-medium mt-1">Toggle your visibility to customers</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, isOnline: !formData.isOnline})}
                    className={`w-14 h-8 rounded-full transition-all relative ${formData.isOnline ? 'bg-emerald-500' : 'bg-natural-muted'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.isOnline ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </>
            )}

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer mt-8"
            >
              {loading ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Support Section */}
        <SupportSection />
      </div>
    </div>
  );
}
