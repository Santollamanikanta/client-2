import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '../types';
import { Briefcase, MapPin, Clock, CheckCircle2, XCircle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import MapDisplay from '../components/MapDisplay';
import SupportSection from '../components/SupportSection';
import { sendNotificationToUser } from '../hooks/useNotifications';
import { ToggleLeft, ToggleRight, LayoutGrid, List } from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeleton';

const ProviderHome = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Open requests subscription - remove orderBy to avoid index requirement
    const requestsQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'pending')
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      let allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      // Sort in memory
      allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (profile?.skills && profile.skills.length > 0) {
        setRequests(allRequests.filter(req => profile.skills?.includes(req.category)));
      } else {
        setRequests(allRequests);
      }
      setLoading(false);
    });

    // My jobs subscription
    const myJobsQuery = query(
      collection(db, 'bookings'),
      where('providerId', '==', user.uid)
    );
    const unsubscribeMyJobs = onSnapshot(myJobsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      // Sort in memory
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setMyJobs(docs);
    });

    // Recent activity subscription (assigned to others)
    const recentQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'assigned'),
      limit(20) // Get more to sort in memory
    );
    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
        .filter(b => b.providerId !== user.uid);
      
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRecentActivity(docs.slice(0, 3));
    });

    return () => {
      unsubscribeRequests();
      unsubscribeMyJobs();
      unsubscribeRecent();
    };
  }, [user, profile]);

  useEffect(() => {
    if (!user || profile?.role !== 'provider') return;

    const activeJob = myJobs.find(j => ['assigned', 'arriving', 'at-location', 'in-progress'].includes(j.status));
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocationError(null);
        
        // Update profile location
        try {
          await updateDoc(doc(db, 'profiles', user.uid), {
            location: { lat, lng },
            updatedAt: new Date().toISOString()
          });
          
          // If has active job, update booking location too
          if (activeJob) {
            await updateDoc(doc(db, 'bookings', activeJob.id), {
              providerLocation: { lat, lng },
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error updating location:", err);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please enable location to find jobs near you.");
        } else {
          setLocationError("Unable to retrieve your location.");
        }
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, profile?.role, myJobs]);

  const handleAccept = async (booking: Booking) => {
    if (!user || isToggling) return;
    
    // Optimistic UI: Remove from requests and add to myJobs locally
    setRequests(prev => prev.filter(r => r.id !== booking.id));
    const optimisticJob = { 
      ...booking, 
      status: 'assigned' as const, 
      providerId: user.uid, 
      updatedAt: new Date().toISOString() 
    };
    setMyJobs(prev => [optimisticJob, ...prev]);

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        providerId: user.uid,
        status: 'assigned',
        updatedAt: new Date().toISOString(),
      });

      // Notify customer (this can happen in background)
      if (booking.customerId) {
        sendNotificationToUser(
          booking.customerId,
          'Service Partner Assigned!',
          `${profile?.displayName} has accepted your request and is starting soon.`,
          { bookingId: booking.id, status: 'assigned' }
        ).catch(err => console.error("Notification failed:", err));
      }
    } catch (err: any) {
      console.error(err);
      // Revert on failure
      setRequests(prev => [booking, ...prev]);
      setMyJobs(prev => prev.filter(j => j.id !== booking.id));
      alert('This job has already been accepted by another service partner or failed to accept.');
    }
  };

  const stats = {
    earnings: myJobs
      .filter(j => j.status === 'completed')
      .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
    jobsDone: myJobs.filter(j => j.status === 'completed').length,
    rating: 4.9,
    newRequests: requests.length,
  };

  const handleWithdraw = () => {
    if (stats.earnings <= 0) {
      alert("You don't have any earnings to withdraw yet.");
      return;
    }
    alert(`Transfer of ₹${stats.earnings} initiated to your linked bank account!`);
  };

  const [isToggling, setIsToggling] = useState(false);
  const [localOnline, setLocalOnline] = useState<boolean | null>(null);

  const displayOnline = localOnline !== null ? localOnline : profile?.isOnline;

  const toggleOnline = async () => {
    if (!user || isToggling) return;
    const nextStatus = !displayOnline;
    
    // Optimistic Update
    setLocalOnline(nextStatus);
    setIsToggling(true);
    
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        isOnline: nextStatus,
        updatedAt: new Date().toISOString()
      });
      // Context listener (onSnapshot) will eventually update profile.isOnline
      // We'll keep localOnline for a second to prevent flickering
      setTimeout(() => setLocalOnline(null), 2000);
    } catch (err) {
      console.error(err);
      setLocalOnline(null); // Revert on error
    } finally {
      setIsToggling(false);
    }
  };

  const filteredJobs = myJobs.filter(job => {
    if (filter === 'active') return ['assigned', 'arriving', 'at-location', 'in-progress'].includes(job.status);
    if (filter === 'completed') return job.status === 'completed';
    return true;
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-natural-text mb-2">Namaste, {profile?.displayName?.split(' ')[0]}</h1>
          <div className="flex items-center gap-4">
             <p className="text-natural-muted font-medium">Status: {displayOnline ? 'Available for tasks' : 'Currently Offline'}</p>
             <button 
              onClick={toggleOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer group shadow-sm ${
                displayOnline 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                  : 'bg-white text-natural-muted border border-natural-border hover:bg-natural-surface'
              }`}
             >
                {displayOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {displayOnline ? 'Online' : 'Go Online'}
             </button>
          </div>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/profile"
            className="px-6 py-3 bg-natural-surface text-natural-text border border-natural-border rounded-xl font-bold text-sm hover:bg-natural-border transition-all cursor-pointer"
          >
            My Profile
          </Link>
          <button 
            onClick={handleWithdraw}
            className="px-6 py-3 bg-natural-text text-white rounded-xl font-bold text-sm shadow-xl shadow-natural-text/20 hover:opacity-90 transition-all cursor-pointer"
          >
            Withdraw ₹{stats.earnings}
          </button>
        </div>
      </div>

      {locationError && (
        <div className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex items-center gap-6">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-900">Location Access Required</h4>
            <p className="text-sm text-amber-700">{locationError}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Retry Access
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'Total Earnings', value: `₹${stats.earnings}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Jobs Done', value: stats.jobsDone.toString(), icon: CheckCircle2, color: 'text-primary', bg: 'bg-natural-surface' },
          { label: 'Rating', value: stats.rating.toString(), icon: TrendingUp, color: 'text-secondary', bg: 'bg-natural-surface' },
          { label: 'New Requests', value: stats.newRequests.toString(), icon: Users, color: 'text-primary', bg: 'bg-natural-surface' },
        ].map((stat, i) => (
          <div key={i} className="card-natural p-8">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
              <stat.icon className={`${stat.color} w-6 h-6`} />
            </div>
            <div className="text-3xl font-bold text-natural-text mb-1">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest font-bold text-natural-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {requests.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted">Jobs Near You</h2>
          </div>
          <MapDisplay 
            center={profile?.location as any || { lat: 17.3850, lng: 78.4867 }}
            markers={requests.map(req => ({
              id: req.id,
              position: { lat: req.location.lat, lng: req.location.lng },
              title: req.serviceName || 'Service Request'
            }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Open Requests */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted flex items-center gap-2">
              New Job Requests
              <span className="w-6 h-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {requests.length}
              </span>
            </h2>
          </div>

          <div className="space-y-6 relative">
            {!displayOnline && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-[40px] flex items-center justify-center p-8 text-center">
                <div className="max-w-xs">
                  <div className="w-16 h-16 bg-natural-surface rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                    <ToggleLeft className="w-8 h-8 text-natural-muted" />
                  </div>
                  <h3 className="text-xl font-bold text-natural-text mb-2">You're Offline</h3>
                  <p className="text-sm text-natural-muted mb-6">Go online to start receiving live job requests near you.</p>
                  
                  {(!profile?.skills || profile.skills.length === 0) && (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-left">
                       <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 font-serif italic">Important Step:</p>
                       <p className="text-[10px] text-natural-muted leading-relaxed">
                         You haven't selected any skills yet. Visit <strong>My Profile</strong> to select services you can provide.
                       </p>
                    </div>
                  )}

                  <button 
                    onClick={toggleOnline}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                  >
                    Go Online Now
                  </button>
                </div>
              </div>
            )}
            {requests.length > 0 ? requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-[32px] border border-natural-border shadow-soft hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-natural-text text-xl">{req.serviceName || 'Service Request'}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                        ID: {req.customerId.substring(0, 8)}
                       </span>
                      <div className="flex items-center gap-2 text-sm text-natural-muted font-medium">
                        <Clock className="w-4 h-4" /> 
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-natural-text">₹{req.totalPrice}</div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-natural-muted mb-8 bg-natural-surface p-4 rounded-2xl">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate">{req.location.address || 'Standard Location'}</span>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleAccept(req)}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    Accept Job
                  </button>
                  <button className="px-5 py-4 bg-natural-surface text-natural-muted rounded-2xl font-bold hover:bg-natural-border transition-colors cursor-pointer text-sm">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="bg-natural-surface text-natural-muted p-16 text-center rounded-[32px] border border-natural-border border-dashed">
                <p className="font-medium">Watching for new requests...</p>
              </div>
            )}
          </div>
        </div>

        {/* My Jobs */}
        <div className="space-y-12">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted">My Assignments</h2>
              <div className="flex bg-natural-surface p-1 rounded-xl border border-natural-border">
                 {(['active', 'completed', 'all'] as const).map(f => (
                   <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      filter === f ? 'bg-white text-primary shadow-sm' : 'text-natural-muted'
                    }`}
                   >
                     {f}
                   </button>
                 ))}
              </div>
            </div>
            <div className="space-y-6">
               {filteredJobs.map((job) => (
                 <Link 
                  key={job.id} 
                  to={`/booking/${job.id}`}
                  className={`bg-white p-8 rounded-[32px] border border-natural-border shadow-soft hover:shadow-md transition-all block ${job.status === 'completed' ? 'opacity-60' : ''}`}
                 >
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-natural-surface rounded-2xl flex items-center justify-center">
                         <Briefcase className="text-primary w-6 h-6" />
                       </div>
                       <div>
                         <h4 className="font-bold text-natural-text text-lg">{job.serviceName}</h4>
                         <p className="text-sm text-natural-muted capitalize">
                           {job.location.address?.split(',')[0]} • ₹{job.totalPrice}
                         </p>
                       </div>
                     </div>
                     <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                       job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                     }`}>
                       {job.status.replace('-', ' ')}
                     </div>
                   </div>
                 </Link>
               ))}
               {filteredJobs.length === 0 && (
                 <div className="text-sm text-gray-400 italic bg-natural-surface/30 p-12 text-center rounded-[32px] border border-dashed border-natural-border">
                   No {filter} jobs found.
                 </div>
               )}
            </div>
          </div>

          {recentActivity.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8 italic">Recently Taken by Others</h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-6 bg-natural-surface/50 rounded-2xl border border-natural-border/50 opacity-60 grayscale scale-95 origin-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg">
                        ✅
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-natural-text">{activity.serviceName}</h4>
                        <p className="text-[10px] font-medium text-natural-muted">Booked in {activity.location.address?.split(',')[0]}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Taken</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SupportSection />
    </div>
  );
};

export default ProviderHome;
