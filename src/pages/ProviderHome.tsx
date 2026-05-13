import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '../types';
import { Briefcase, MapPin, Clock, CheckCircle2, XCircle, TrendingUp, Users, DollarSign, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import MapDisplay from '../components/MapDisplay';
import SupportSection from '../components/SupportSection';

import { sendNotificationToUser } from '../hooks/useNotifications';

const ProviderHome = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [recentActivity, setRecentActivity] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Open requests (pending)
    const qPending = query(
      collection(db, 'bookings'),
      where('status', '==', 'pending')
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(docs);
    }, (error) => console.error("Pending Jobs Error:", error));

    // Recent activity (assigned to others)
    const qRecent = query(
      collection(db, 'bookings'),
      where('status', '==', 'assigned'),
      orderBy('updatedAt', 'desc')
    );

    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      // Filter out my own jobs from this view
      const othersJobs = docs.filter(j => j.providerId !== user.uid).slice(0, 3);
      setRecentActivity(othersJobs);
    }, (error) => console.error("Recent Activity Error:", error));

    // My active jobs
    const qMyJobs = query(
      collection(db, 'bookings'),
      where('providerId', '==', user.uid)
    );

    const unsubMyJobs = onSnapshot(qMyJobs, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setMyJobs(docs);
      setLoading(false);
    }, (error) => {
      console.error("My Jobs Error:", error);
      setLoading(false);
    });

    return () => {
      unsubPending();
      unsubRecent();
      unsubMyJobs();
    };
  }, [user]);

  const handleAccept = async (booking: Booking) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        providerId: user.uid,
        status: 'assigned',
        updatedAt: serverTimestamp(),
      });

      // Notify customer
      if (booking.customerId) {
        await sendNotificationToUser(
          booking.customerId,
          'Service Partner Assigned!',
          `${profile?.displayName} has accepted your request and is starting soon.`,
          { bookingId: booking.id, status: 'assigned' }
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('permission-denied') || err.message?.includes('Missing or insufficient permissions')) {
        alert('This job has already been accepted by another service partner. Please check for other available requests.');
      } else {
        alert('Failed to accept job. Please try again.');
      }
    }
  };

  const stats = {
    earnings: myJobs
      .filter(j => j.status === 'completed')
      .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
    jobsDone: myJobs.filter(j => j.status === 'completed').length,
    rating: 4.9, // Mock rating as we don't have reviews yet
    newRequests: requests.length,
  };

  const handleWithdraw = () => {
    if (stats.earnings <= 0) {
      alert("You don't have any earnings to withdraw yet.");
      return;
    }
    alert(`Transfer of ₹${stats.earnings} initiated to your linked bank account!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold text-natural-text mb-2">Namaste, {profile?.displayName?.split(' ')[0]}</h1>
          <p className="text-natural-muted font-medium">You are currently {profile?.isOnline ? 'Online' : 'Offline'}</p>
        </div>
        <button 
          onClick={handleWithdraw}
          className="px-6 py-3 bg-natural-text text-white rounded-xl font-bold text-sm shadow-xl shadow-natural-text/20 hover:opacity-90 transition-all cursor-pointer"
        >
          Withdraw ₹{stats.earnings}
        </button>
      </div>

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
            center={profile?.location as any || { lat: 12.9716, lng: 77.5946 }}
            markers={requests.map(req => ({
              id: req.id,
              position: { lat: req.location.lat, lng: req.location.lng },
              title: (req as any).serviceName || 'Service Request'
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

          <div className="space-y-6">
            {requests.length > 0 ? requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-[32px] border border-natural-border shadow-soft hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-natural-text text-xl">{(req as any).serviceName || 'Service Request'}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                        <Users className="w-3 h-3" />
                        ID: {req.customerId.substring(0, 8)}
                      </div>
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
                  <button className="px-5 py-4 bg-natural-surface text-natural-muted rounded-2xl font-bold hover:bg-natural-border transition-colors cursor-pointer">
                    <XCircle className="w-6 h-6" />
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8">My Current Jobs</h2>
            <div className="space-y-6">
               {myJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').map((job) => (
                 <Link 
                  key={job.id} 
                  to={`/booking/${job.id}`}
                  className="bg-white p-8 rounded-[32px] border border-natural-border shadow-soft hover:shadow-md transition-all block"
                 >
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-natural-surface rounded-2xl flex items-center justify-center">
                         <Briefcase className="text-primary w-6 h-6" />
                       </div>
                       <div>
                         <h4 className="font-bold text-natural-text text-lg">{(job as any).serviceName}</h4>
                         <p className="text-sm text-natural-muted">Status: {job.status}</p>
                       </div>
                     </div>
                     <div className="text-primary bg-primary/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                       {job.status}
                     </div>
                   </div>
                 </Link>
               ))}
               {myJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length === 0 && (
                 <div className="text-sm text-gray-400 italic">No active jobs yet. Accept a request to get started.</div>
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
                        <h4 className="text-sm font-bold text-natural-text">{(activity as any).serviceName}</h4>
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
