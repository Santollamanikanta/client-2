import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../types';
import { notifyProvidersInArea, notifyAdmin } from '../hooks/useNotifications';
import { ChevronLeft, Info, Star, ShieldCheck, Clock, MapPin, IndianRupee, X, CreditCard, Banknote, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddressAutocomplete from '../components/AddressAutocomplete';

const MOCK_SERVICES: Record<string, Service[]> = {
  cleaning: [
    { id: 'c1', name: 'House Cleaning Package', category: 'cleaning', basePrice: 199, description: 'Basic mopping, sweeping and dusting for your home.', iconName: 'broom' },
    { id: 'c2', name: 'Kitchen Deep Cleaning', category: 'cleaning', basePrice: 149, description: 'Exhaustive cleaning of tiles, cabinets and surfaces.', iconName: 'broom' },
  ],
  mopping: [
    { id: 'm1', name: 'Standard Mopping', category: 'mopping', basePrice: 49, description: 'Professional wet mopping of all floors.', iconName: 'broom' },
  ],
  sweeping: [
    { id: 'sw1', name: 'Full Sweeping', category: 'sweeping', basePrice: 59, description: 'Complete dry sweeping of the premises.', iconName: 'broom' },
  ],
  dusting: [
    { id: 'd1', name: 'Detailed Dusting', category: 'dusting', basePrice: 39, description: 'Detailed dusting of furniture and electronics.', iconName: 'dust' },
  ],
  fan: [
    { id: 'f1', name: 'Fan Deep Cleaning', category: 'fan', basePrice: 29, description: 'Ceiling and table fan deep cleaning.', iconName: 'bolt' },
  ],
  wardrobe: [
    { id: 'w1', name: 'Wardrobe Organization', category: 'wardrobe', basePrice: 39, description: 'Internal organization and dusting of wardrobes.', iconName: 'dust' },
  ],
  childcare: [
    { id: 'cc1', name: 'Verified Child Care', category: 'childcare', basePrice: 499, description: 'Verified professional child care at your home.', iconName: 'baby' },
  ],
  kitchen: [
    { id: 'k1', name: 'Kitchen Cleaning', category: 'kitchen', basePrice: 99, description: 'Standard kitchen cleaning and organization.', iconName: 'broom' },
  ],
  cooler: [
    { id: 'cl1', name: 'Cooler Cleaning', category: 'cooler', basePrice: 79, description: 'Water change and internal pad cleaning.', iconName: 'bolt' },
  ],
  door: [
    { id: 'dr1', name: 'Door Cleaning', category: 'door', basePrice: 29, description: 'Polish and dust removal from all room doors.', iconName: 'broom' },
  ],
};

const CATEGORIES_INFO: Record<string, { name: string, icon: string }> = {
  cleaning: { name: 'House Cleaning', icon: '🧹' },
  mopping: { name: 'Mopping', icon: '✨' },
  sweeping: { name: 'Sweeping', icon: '🧹' },
  dusting: { name: 'Dusting', icon: '✨' },
  fan: { name: 'Fan Cleaning', icon: '⚡' },
  wardrobe: { name: 'Wardrobe', icon: '🚪' },
  childcare: { name: 'Child Care', icon: '👶' },
  kitchen: { name: 'Kitchen', icon: '🍱' },
  cooler: { name: 'Cooler', icon: '❄️' },
  door: { name: 'Door', icon: '🚪' },
};

const ServiceSelection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'cleaning';
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Service | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLocation, setBookingLocation] = useState({ 
    address: profile?.address || 'Hyderabad, India', 
    lat: 17.3850, 
    lng: 78.4867 
  });
  const [showAddressEdit, setShowAddressEdit] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');

  const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 6;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return {
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${displayHour}:00 ${period}`
    };
  });

  useEffect(() => {
    if (profile?.address) {
      setBookingLocation(prev => ({ ...prev, address: profile.address || prev.address }));
    }
  }, [profile]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      
      const timeout = new Promise<Service[]>((resolve) => 
        setTimeout(() => resolve(MOCK_SERVICES[category] || []), 500)
      );

      const fetchTask = (async () => {
        try {
          const q = query(collection(db, 'services'), where('category', '==', category));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            return MOCK_SERVICES[category] || [];
          } else {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
          }
        } catch (err) {
          return MOCK_SERVICES[category] || [];
        }
      })();

      const results = await Promise.race([fetchTask, timeout]);
      setServices(results);
      setLoading(false);
    };
    fetchServices();
  }, [category]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async (service: Service) => {
    if (!user) return;
    setBookingLoading(true);
    try {
      const basePrice = service.basePrice;
      const discount = profile?.isPro ? Math.round(basePrice * 0.2) : 0;
      const finalPrice = basePrice - discount;

      const createBookingData = (extra: any) => ({
        customerId: user.uid,
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        status: 'pending-approval',
        scheduledAt: new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString(),
        location: { 
          lat: bookingLocation.lat, 
          lng: bookingLocation.lng, 
          address: bookingLocation.address 
        },
        totalPrice: finalPrice,
        isProBooking: profile?.isPro || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...extra
      });

      if (paymentMethod === 'online') {
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          alert('Razorpay SDK failed to load. Are you online?');
          return;
        }

        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: finalPrice,
            receipt: `rcpt_${Date.now()}`
          }),
        });

        if (!orderRes.ok) throw new Error('Payment service error');

        const orderData = await orderRes.json();
        if (!orderData.success) throw new Error('Failed to create payment order');

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: "INR",
          name: "CleanEase",
          description: `Booking for ${service.name}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              const docRef = await addDoc(collection(db, 'bookings'), createBookingData({
                  paymentMethod: 'online',
                  paymentStatus: 'paid',
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
              }));

              await notifyAdmin(`New Booking: ₹${finalPrice}`, `A new ${service.name} request was paid: ${response.razorpay_payment_id}`);
              await notifyProvidersInArea(service.category, `New ${service.name} Job`, `A new request is available near you for ₹${finalPrice}`, { bookingId: docRef.id });
              
              navigate(`/booking-confirmation/${docRef.id}`);
            }
          },
          prefill: {
            name: profile?.displayName || user.displayName || 'User',
            email: user.email,
            contact: profile?.phoneNumber || ""
          },
          theme: { color: "#5A7D6C" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Cash Flow
        // Create an optimistic reference or use a timeout to prevent hanging
        const bookingData = createBookingData({
            paymentMethod: 'cash',
            paymentStatus: 'pending',
        });

        // Fire notifications in background - DO NOT AWAIT
        notifyAdmin(`New Cash Booking: ₹${finalPrice}`, `A new ${service.name} request (Cash) was created by ${user.uid}`).catch(console.error);
        
        try {
          // Set a race between the write and a 3s timeout
          const writeTask = addDoc(collection(db, 'bookings'), bookingData);
          const timeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          );

          const docRef = await Promise.race([writeTask, timeout]) as any;
          
          // Fire area notification now we have ID
          notifyProvidersInArea(service.category, `New ${service.name} Job (Cash)`, `A new cash request is available near you for ₹${finalPrice}`, { bookingId: docRef.id }).catch(console.error);
          
          navigate(`/booking-confirmation/${docRef.id}`);
        } catch (err: any) {
          if (err.message === 'timeout') {
            console.warn("Booking write timed out but might succeed later. Proceeding optimistically.");
            // Generate a local ID or just take them to a history page if we can't confirm
            // For now, let's just alert a slightly better message or try one more time fast
            alert('Booking is taking longer than expected. Please check your history in a moment.');
            navigate('/history');
          } else {
            throw err;
          }
        }
      }
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
        <h1 className="text-5xl font-serif font-bold text-natural-text mb-4">CleanEase Hyderabad</h1>
        <p className="text-natural-muted font-medium italic">Premium household services at your doorstep.</p>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-natural-muted font-bold uppercase tracking-widest text-xs">Curating services for you...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-natural-surface rounded-[40px] border border-dashed border-natural-border">
            <p className="text-natural-muted font-medium mb-4">No services available in this category yet.</p>
            <button onClick={() => navigate('/home')} className="text-primary font-bold hover:underline">Explore other categories</button>
          </div>
        ) : services.map((service) => (
          <motion.div 
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[32px] border border-natural-border shadow-soft hover:shadow-xl transition-all flex flex-col md:flex-row gap-10 items-start"
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
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer text-sm"
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
                <button onClick={() => setShowConfirm(null)} className="p-2 hover:bg-natural-surface rounded-full cursor-pointer">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Preferred Date</label>
                       <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-natural-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Time (6AM - 8PM)</label>
                       <select 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-natural-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                       >
                         {TIME_SLOTS.map(slot => (
                           <option key={slot.value} value={slot.value}>{slot.label}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-natural-muted font-medium">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Estimated Duration</span>
                    </div>
                    <span className="font-bold text-natural-text">45-60 mins</span>
                  </div>

                  <div className="flex justify-between items-start text-xs">
                    <div className="flex items-center gap-2 text-natural-muted font-medium pt-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Service Location</span>
                    </div>
                    <div className="text-right flex-1 ml-4 text-xs">
                      {showAddressEdit ? (
                        <div className="mt-2 text-xs">
                           <AddressAutocomplete 
                              defaultValue={bookingLocation.address}
                              onAddressSelect={(address, lat, lng) => {
                                setBookingLocation({ address, lat, lng });
                                setShowAddressEdit(false);
                              }}
                              className="!py-2 !pl-10 !text-[10px]"
                           />
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowAddressEdit(true)}
                          className="flex items-center gap-2 font-bold text-natural-text hover:text-primary transition-colors text-right ml-auto cursor-pointer"
                        >
                          <span className="line-clamp-2">{bookingLocation.address}</span>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                <h4 className="text-xs font-bold text-natural-muted uppercase tracking-widest mb-4">Payment Method</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-natural-border text-natural-muted hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Online (UPI/Card)</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-natural-border text-natural-muted hover:border-primary/50'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cash Pay</span>
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] text-natural-muted leading-relaxed font-medium italic">
                  * By proceeding, you agree to our service terms. A verified professional will be assigned within 15 minutes of {paymentMethod === 'online' ? 'payment' : 'booking'}.
                </p>
              </div>

              <button 
                onClick={() => handleBooking(showConfirm)}
                disabled={bookingLoading}
                className="w-full py-5 bg-primary text-white rounded-[24px] font-bold shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {bookingLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {paymentMethod === 'online' ? (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Confirm & Pay Online
                      </>
                    ) : (
                      <>
                        <Banknote className="w-5 h-5" />
                        Confirm & Pay Cash
                      </>
                    )}
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceSelection;
