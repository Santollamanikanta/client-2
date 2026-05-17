import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Phone, ShieldCheck, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SupportSection from '../components/SupportSection';
import AddressAutocomplete from '../components/AddressAutocomplete';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    displayName: '',
    phoneNumber: '',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    skills: [] as string[],
    isOnline: true,
  });

  // Sync formData when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        lat: (profile as any).lat || null,
        lng: (profile as any).lng || null,
        skills: (profile as any).skills || [],
        isOnline: (profile as any).isOnline ?? true,
      });
    }
  }, [profile]);

  const handleToggleOnline = async () => {
    if (!user || !profile) return;
    const newStatus = !formData.isOnline;
    
    // Optimistic UI update
    setFormData(prev => ({ ...prev, isOnline: newStatus }));
    
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        isOnline: newStatus,
        updatedAt: new Date().toISOString(),
      });
      // Success is silent for the toggle to feel faster
    } catch (error) {
      console.error("Failed to toggle status:", error);
      // Revert on error
      setFormData(prev => ({ ...prev, isOnline: !newStatus }));
      alert("Failed to update status. Please check your connection.");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setIsSuccess(false);
    
    // Create the promise for the update
    const updatePromise = updateDoc(doc(db, 'profiles', user.uid), {
      ...formData,
      updatedAt: new Date().toISOString(),
    });

    try {
      // Rapid feedback: if it takes more than 1s, we still wait, but we try to resolve fast
      await updatePromise;
      
      setLoading(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert('Failed to update profile. Please try again.');
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
        <div className="bg-white rounded-[40px] border border-natural-border shadow-soft p-10">
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
                  className="w-full pl-12 pr-4 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm" 
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
                  className="w-full pl-12 pr-4 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-2">Primary Address</label>
              <AddressAutocomplete 
                defaultValue={formData.address}
                onAddressSelect={(address, lat, lng) => setFormData({...formData, address, lat, lng})}
                placeholder="Search for your area or building"
              />
            </div>

            {profile?.role === 'provider' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-natural-muted uppercase tracking-widest mb-4">Service Skills</label>
                  <p className="text-[10px] text-natural-muted mb-4 font-medium italic">Select the categories you want to receive jobs for:</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
                      { id: 'repairs', name: 'Repairs', icon: '⚡' },
                      { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
                      { id: 'cooking', name: 'Cooking', icon: '🍱' },
                      { id: 'dusting', name: 'Dusting', icon: '✨' },
                      { id: 'childcare', name: 'Child Care', icon: '👶' },
                      { id: 'caretaker', name: 'Caretaker', icon: '🤝' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(formData.skills) ? formData.skills : [];
                          if (current.includes(cat.id)) {
                            setFormData({ ...formData, skills: current.filter(s => s !== cat.id) });
                          } else {
                            setFormData({ ...formData, skills: [...current, cat.id] });
                          }
                        }}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          formData.skills?.includes(cat.id)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white border-natural-border text-natural-muted hover:border-primary/50'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-natural-surface rounded-2xl border border-natural-border">
                  <div>
                    <h4 className="text-sm font-bold text-natural-text">Availability Status</h4>
                    <p className="text-[10px] text-natural-muted font-medium mt-1">Toggle your visibility to customers</p>
                  </div>
                  <button 
                    onClick={handleToggleOnline}
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
              className={`w-full py-5 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-8 ${
                isSuccess ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-primary shadow-primary/20'
              }`}
            >
              {loading ? 'Saving...' : isSuccess ? <><ShieldCheck className="w-5 h-5" /> Saved!</> : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Support Section */}
        <SupportSection />
      </div>
    </div>
  );
}
