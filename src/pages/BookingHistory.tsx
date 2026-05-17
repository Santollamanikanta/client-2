import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Booking } from '../types';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, XCircle, ArrowRight, IndianRupee, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookingHistory() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;

    const field = profile?.role === 'provider' ? 'providerId' : 'customerId';
    
    const q = query(
      collection(db, 'bookings'),
      where(field, '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(docs);
      setLoading(false);
    }, (error) => {
      console.error("History subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (loading) return <div className="h-96 flex items-center justify-center font-bold text-natural-muted">Loading history...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-natural-text mb-4">Service History</h1>
        <p className="text-natural-muted font-medium">Review your past and recurring services.</p>
      </div>

      <div className="space-y-6">
        {bookings.length > 0 ? bookings.map((booking) => (
          <motion.div 
            key={booking.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-natural-border shadow-soft p-8 hover:shadow-lg transition-all group"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                  booking.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
                }`}>
                  {booking.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                   booking.status === 'cancelled' ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-natural-text">{booking.serviceName || 'Standard Service'}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      booking.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-primary text-white text-[9px]'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2 text-sm text-natural-muted font-medium">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-natural-muted font-medium">
                      <IndianRupee className="w-4 h-4" />
                      ₹{booking.totalPrice}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-natural-muted font-medium sm:col-span-2">
                      <MapPin className="w-4 h-4" />
                      {booking.location.address || 'Standard Location'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                      {booking.paymentMethod === 'cash' ? 'Cash on Service' : 'Paid Online'}
                      <div className="w-1 h-1 bg-natural-border rounded-full" />
                      {booking.paymentStatus || 'confirmed'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Link 
                  to={`/booking/${booking.id}`}
                  className="w-full md:w-auto px-6 py-3 bg-natural-surface text-natural-text rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-natural-border transition-all cursor-pointer text-xs"
                >
                  Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-24 bg-natural-surface rounded-[40px] border border-natural-border border-dashed">
            <Calendar className="w-16 h-16 text-natural-muted/20 mx-auto mb-6" />
            <p className="text-natural-muted font-bold text-xl mb-2">No bookings found</p>
            <p className="text-natural-muted/60 text-sm">When you start using services, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
