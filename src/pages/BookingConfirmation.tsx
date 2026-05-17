import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { CheckCircle2, Calendar, MapPin, CreditCard, ChevronRight, Home, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      
      const timeout = setTimeout(() => {
        if (loading) setLoading(false);
      }, 1500);

      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const shareOnWhatsApp = (num: string) => {
    if (!booking) return;
    const bookingIdShort = booking.id.substring(0, 8).toUpperCase();
    const message = `*CLEANEASE HYDERABAD - NEW BOOKING REQUEST*%0A%0A` +
      `*Job ID:* #CE-${bookingIdShort}%0A` +
      `*Service:* ${booking.serviceName}%0A` +
      `*Category:* ${booking.category}%0A` +
      `*Amount:* ₹${booking.totalPrice}%0A%0A` +
      `*CUSTOMER DETAILS*%0A` +
      `*Name:* ${profile?.displayName || 'User'}%0A` +
      `*Email:* ${user?.email || 'N/A'}%0A` +
      `*Contact:* ${profile?.phoneNumber || 'Not provided'}%0A%0A` +
      `*LOCATION*%0A` +
      `*Address:* ${booking.location.address}%0A` +
      `*Map:* https://www.google.com/maps/search/?api=1&query=${booking.location.lat},${booking.location.lng}%0A%0A` +
      `*SCHEDULE*%0A` +
      `*Time:* ${format(new Date(booking.scheduledAt), 'EEEE, MMM do, p')}%0A%0A` +
      `*ACTION REQUIRED:* Please login to Admin Dashboard to Accept/Reject this booking.`;
    
    window.open(`https://wa.me/${num}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-natural-muted font-medium">Securing your booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-natural-text mb-2">Booking Not Found</h2>
        <p className="text-natural-muted mb-6">We couldn't retrieve the details for this booking.</p>
        <Link to="/home" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg pb-24">
      <div className="max-w-xl mx-auto px-4 pt-8">
        {/* Success Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-serif font-bold text-natural-text mb-2"
          >
            Booking Requested!
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-natural-muted"
          >
            Your request is sent to our experts for approval.
          </motion.p>
        </div>

        {/* Booking Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-natural-border shadow-soft overflow-hidden mb-8"
        >
          <div className="bg-primary/5 p-6 border-b border-natural-border flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Booking ID</p>
              <p className="text-xs font-mono font-bold text-natural-text">{booking.id?.substring(0, 12).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                booking.status === 'pending-approval' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {booking.status === 'pending-approval' ? 'Pending Approval' : 'Confirmed'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Service Title */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-natural-text mb-1">{booking.serviceName}</h3>
                <p className="text-sm font-medium text-natural-muted">Professional Home Service</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-natural-text">₹{booking.totalPrice}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  {booking.paymentStatus === 'paid' ? 'Payment Successful' : 'Pay on Service'}
                </p>
              </div>
            </div>

            <div className="h-px bg-natural-border/50" />

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-natural-surface border border-natural-border flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Scheduled For</p>
                  <p className="text-sm font-bold text-natural-text">
                    {format(new Date(booking.scheduledAt), 'EEEE, MMM do')}
                  </p>
                  <p className="text-xs font-medium text-natural-muted">
                    {format(new Date(booking.scheduledAt), 'p')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-natural-surface border border-natural-border flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Service Location</p>
                  <p className="text-sm font-bold text-natural-text line-clamp-2 leading-tight">
                    {booking.location.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-natural-surface border border-natural-border flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Payment Method</p>
                  <p className="text-sm font-bold text-natural-text capitalize">
                    {booking.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                  </p>
                  <p className="text-xs font-medium text-natural-muted">
                    {booking.paymentStatus === 'paid' ? 'Transaction ID: Verified' : 'Amount Due: ₹' + booking.totalPrice}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-natural-surface border border-natural-border flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Provider Matching</p>
                  <p className="text-sm font-bold text-natural-text">Ongoing</p>
                  <p className="text-xs font-medium text-natural-muted">We're assigning your pro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-natural-surface border-t border-natural-border">
             <div className="flex items-start gap-3 text-xs text-natural-muted leading-relaxed">
                <div className="mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p>
                  A professional will be assigned and reach out to you within 30 minutes of the scheduled time. You can track your booking in the 'My Bookings' section.
                </p>
             </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 mb-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">!</div>
              <div>
                <h4 className="font-bold text-emerald-900">Action Required: Notify Admins</h4>
                <p className="text-xs text-emerald-700">Please send booking details to both admins via WhatsApp to ensure instant approval.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => shareOnWhatsApp('919502337968')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <div className="text-left w-full">
                  <span className="block text-[9px] font-bold uppercase opacity-80 mb-1">Step 1</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Notify Admin 1</span>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => shareOnWhatsApp('918790934547')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <div className="text-left w-full">
                  <span className="block text-[9px] font-bold uppercase opacity-80 mb-1">Step 2</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>Notify Admin 2</span>
                  </div>
                </div>
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to={`/live-tracking/${booking.id}`} 
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-natural-border text-natural-text font-bold rounded-2xl hover:bg-natural-surface transition-all"
          >
            Track Booking
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link 
            to="/home" 
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-natural-muted space-x-1">
            <span>Need help? Contact:</span>
            <a href="tel:+919502337968" className="text-primary font-bold hover:underline">+91 95023 37968</a>
            <span>or</span>
            <a href="tel:+918790934547" className="text-primary font-bold hover:underline">+91 87909 34547</a>
          </p>
        </div>
      </div>
    </div>
  );
}
