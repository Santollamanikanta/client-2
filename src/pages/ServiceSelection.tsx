import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../types';
import { notifyProvidersInArea, notifyAdmin } from '../hooks/useNotifications';
import { ChevronLeft, Info, Star, ShieldCheck, Clock, MapPin, IndianRupee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Services Data
const MOCK_SERVICES: Record<string, Service[]> = {
  cleaning: [
    { id: 'c1', name: 'Full Home Cleaning', category: 'cleaning', basePrice: 2499, description: 'Complete deep cleaning of all rooms including kitchen and bathrooms.', iconName: 'broom' },
    { id: 'c2', name: 'Deep Kitchen Degreasing', category: 'cleaning', basePrice: 1299, description: 'Professional removal of oil stains and chimney cleaning.', iconName: 'broom' },
  ],
  repairs: [
    { id: 'r1', name: 'AC Unit Repair', category: 'repairs', basePrice: 499, description: 'General servicing and filter cleaning of single AC unit.', iconName: 'bolt' },
    { id: 'r2', name: 'Geyser Fixing', category: 'repairs', basePrice: 350, description: 'Addressing heating or leakage issues in geysers.', iconName: 'bolt' },
  ],
  plumbing: [
    { id: 'p1', name: 'Pipe Leak Fix', category: 'plumbing', basePrice: 299, description: 'Standard fixing of minor bathroom or kitchen pipe leaks.', iconName: 'plumber' },
    { id: 'p2', name: 'Toilet Repair', category: 'plumbing', basePrice: 450, description: 'Fixing flush or clogging issues in standard toilets.', iconName: 'plumber' },
  ],
  cooking: [
    { id: 'ck1', name: 'Weekly Tiffin Service', category: 'cooking', basePrice: 1500, description: 'Daily home-cooked meal delivery for 1 person.', iconName: 'tiffin' },
    { id: 'ck2', name: 'One-time Party Cook', category: 'cooking', basePrice: 1000, description: 'Hire a chef to prepare dinner for up to 6 guests at home.', iconName: 'tiffin' },
  ],
  dusting: [
    { id: 'd1', name: 'Furniture Dusting', category: 'dusting', basePrice: 400, description: 'Complete dusting of all furniture and surfaces.', iconName: 'dust' },
    { id: 'd2', name: 'Cabinet Cleaning', category: 'dusting', basePrice: 600, description: 'Internal and external cleaning of kitchen and room cabinets.', iconName: 'dust' },
  ],
  childcare: [
    { id: 'cc1', name: 'Day Care (4h)', category: 'childcare', basePrice: 1200, description: 'Verified child care for 4 hours at your home.', iconName: 'baby' },
    { id: 'cc2', name: 'Evening Sitter', category: 'childcare', basePrice: 800, description: 'Professional child sitter for evening hours.', iconName: 'baby' },
  ],
  caretaker: [
    { id: 'ct1', name: 'Senior Care', category: 'caretaker', basePrice: 1500, description: 'Compassionate assistance for senior citizens.', iconName: 'heart' },
    { id: 'ct2', name: 'Patient Support', category: 'caretaker', basePrice: 2000, description: 'Basic medical and physical support for recovering patients.', iconName: 'heart' },
  ]
};

const CATEGORIES_INFO: Record<string, { name: string, icon: string }> = {
  cleaning: { name: 'Deep Cleaning', icon: '🧹' },
  repairs: { name: 'Electric Repairs', icon: '⚡' },
  plumbing: { name: 'Plumbing Works', icon: '🔧' },
  cooking: { name: 'Cooking & Tiffin', icon: '🍱' },
  dusting: { name: 'Dusting', icon: '✨' },
  childcare: { name: 'Child Care', icon: '👶' },
  caretaker: { name: 'Care Taker', icon: '🤝' },
};

const ServiceSelection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'cleaning';
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [successBooking, setSuccessBooking] = useState<{ id: string, name: string, price: number } | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), where('category', '==', category));
        const snap = await getDocs(q);
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'services');
      }
    };
    fetchServices();
  }, [category]);

  const handleBooking = async (service: Service) => {
    if (!user) return;
    setBookingLoading(true);
    try {
      // 1. Process Mock Payment
      const payRes = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: service.basePrice, bookingId: service.id }),
      });
      const payData = await payRes.json();
      if (!payData.success) throw new Error('Payment failed');

      // 2. Create Booking
      const basePrice = service.basePrice;
      const discount = profile?.isPro ? Math.round(basePrice * 0.2) : 0;
      const finalPrice = basePrice - discount;

      const docRef = await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        status: 'pending',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        location: { lat: 17.3850, lng: 78.4867, address: 'Hyderabad, India' },
        totalPrice: finalPrice,
        paymentId: payData.transactionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isProBooking: profile?.isPro || false
      });

      // Notify relevant providers
      await notifyProvidersInArea(
        category, 
        `New ${service.name} Request`, 
        `A new job is available in your area for ₹${service.basePrice}`,
        { bookingId: docRef.id }
      );

      // Notify Owner/Admin
      await notifyAdmin(
        `New Booking: ₹${service.basePrice}`,
        `A new ${service.name} request was just paid for.`,
        { bookingId: docRef.id }
      );

      setSuccessBooking({
        id: docRef.id,
        name: service.name,
        price: finalPrice
      });
    } catch (err) {
      console.error(err);
      alert('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 text-natural-muted mb-8 hover:text-natural-text transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-natural-text mb-4">{CATEGORIES_INFO[category]?.name || category} Services</h1>
        <p className="text-natural-muted font-medium">Choose the best service for your household.</p>
      </div>

      <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {Object.entries(CATEGORIES_INFO).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setSearchParams({ category: id })}
              className={`px-6 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all border cursor-pointer flex items-center gap-2 ${
                category === id 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white border-natural-border text-natural-muted hover:border-primary/50'
              }`}
            >
              <span className="text-lg">{info.icon}</span>
              {info.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {services.map((service) => (
          <motion.div 
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-natural p-10 hover:shadow-xl transition-all flex flex-col md:flex-row gap-10 items-start"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">Recommended</span>
                <div className="flex items-center gap-1.5 text-secondary">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold">4.8 (2k+)</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-natural-text mb-3">{service.name}</h3>
              <p className="text-natural-muted mb-8 leading-relaxed font-medium">
                {service.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-natural-muted uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-natural-surface rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  45-60 min
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-natural-surface rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                  </div>
                  Insured
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 flex flex-col gap-6 items-center p-8 bg-natural-surface rounded-[24px]">
              <div className="text-4xl font-bold text-natural-text flex items-center gap-1">
                <IndianRupee className="w-8 h-8 text-secondary" /> {service.basePrice}
              </div>
              <button 
                onClick={() => setShowConfirm(service)}
                disabled={bookingLoading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                Book Now
              </button>
              <p className="text-[10px] text-natural-muted text-center font-bold uppercase tracking-widest opacity-60">Instant Assign</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-gray-900 text-white rounded-[2rem] flex items-center gap-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
          <Info className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h4 className="font-bold mb-1">Standardized Pricing</h4>
          <p className="text-sm text-gray-400">We work with partners to ensure you get the best price for the best quality service without negotiation.</p>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(null)}
              className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-natural-text mb-2">Confirm Booking</h2>
                  <p className="text-natural-muted font-medium">Safe and secure direct booking</p>
                </div>
                <button onClick={() => setShowConfirm(null)} className="p-2 hover:bg-natural-surface rounded-full">
                  <X className="w-6 h-6 text-natural-muted" />
                </button>
              </div>

              <div className="bg-natural-surface p-8 rounded-[32px] mb-8 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-natural-border/50">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {showConfirm.iconName === 'broom' ? '🧹' : 
                     showConfirm.iconName === 'bolt' ? '⚡' : 
                     showConfirm.iconName === 'plumber' ? '🔧' : 
                     showConfirm.iconName === 'tiffin' ? '🍱' : 
                     showConfirm.iconName === 'dust' ? '✨' : 
                     showConfirm.iconName === 'baby' ? '👶' : 
                     showConfirm.iconName === 'heart' ? '🤝' : '🛠️'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-natural-text">{showConfirm.name}</h4>
                    <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest">{CATEGORIES_INFO[showConfirm.category]?.name || showConfirm.category}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-natural-muted font-medium">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Estimated Duration</span>
                    </div>
                    <span className="font-bold text-natural-text">45-60 mins</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-natural-muted font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Service Location</span>
                    </div>
                    <span className="font-bold text-natural-text">Your Registered Address</span>
                  </div>

                  <div className="pt-4 border-t border-natural-border/50 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                        {profile?.isPro ? 'Pro Member Price' : 'Total Fixed Price'}
                      </span>
                      {profile?.isPro && (
                        <p className="text-[9px] text-emerald-600 font-bold italic">20% Pro Discount Applied</p>
                      )}
                      {!profile?.isPro && (
                        <p className="text-[9px] text-primary font-bold italic">No hidden charges</p>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-natural-text flex items-center">
                      <IndianRupee className="w-6 h-6 text-secondary" />
                      {profile?.isPro ? Math.round(showConfirm.basePrice * 0.8) : showConfirm.basePrice}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs text-natural-muted leading-relaxed font-medium italic">
                  * By proceeding, you agree to our service terms. A verified professional will be assigned within 15 minutes of payment.
                </p>
              </div>

              <button 
                onClick={() => handleBooking(showConfirm)}
                disabled={bookingLoading}
                className="w-full py-5 bg-primary text-white rounded-[24px] font-bold shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {bookingLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Confirm & Pay
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successBooking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-natural-text/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h2 className="text-3xl font-serif font-bold text-natural-text mb-2">Booking Confirmed!</h2>
              <p className="text-natural-muted font-medium mb-8">Your professional is being assigned.</p>

              <div className="bg-natural-surface p-6 rounded-3xl mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-natural-muted font-medium">Service</span>
                  <span className="font-bold text-natural-text">{successBooking.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-natural-muted font-medium">Amount Paid</span>
                  <span className="font-bold text-natural-text flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" /> {successBooking.price}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-natural-muted font-medium">Est. Arrival</span>
                  <span className="font-bold text-emerald-600">45-60 mins</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/booking/${successBooking.id}`)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  View Booking Details
                </button>
                <button 
                  onClick={() => setSuccessBooking(null)}
                  className="w-full py-4 bg-white border border-natural-border text-natural-text rounded-2xl font-bold hover:bg-natural-surface transition-all cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceSelection;
