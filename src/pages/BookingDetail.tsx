import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Booking, ChatMessage, UserProfile } from '../types';
import { sendNotificationToUser } from '../hooks/useNotifications';
import { 
  ChevronLeft, MapPin, Clock, Send, Phone, 
  CheckCircle2, Star, ShieldCheck,
  CreditCard, Banknote, Target, ExternalLink,
  MessageSquare, Star as StarIcon, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MAPS_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(MAPS_KEY) && MAPS_KEY.startsWith('AIza') && MAPS_KEY.length > 20;

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [realUserPos, setRealUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [providerPos, setProviderPos] = useState<{lat: number, lng: number} | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRealUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    // Booking subscription
    const bookingDocRef = doc(db, 'bookings', id);
    const unsubscribeBooking = onSnapshot(bookingDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Booking;
        setBooking(data);
        
        if (data.providerLocation) {
          setProviderPos(data.providerLocation);
        }

        const otherId = profile?.role === 'homeowner' ? data.providerId : data.customerId;
        if (otherId && (!otherParty || otherParty.uid !== otherId)) {
          const uDocRef = doc(db, 'profiles', otherId);
          const uDocSnap = await getDoc(uDocRef);
          if (uDocSnap.exists()) setOtherParty({ uid: uDocSnap.id, ...uDocSnap.data() } as UserProfile);
        }
      } else {
        navigate('/');
      }
    });

    // Messages subscription
    const messagesQuery = query(
      collection(db, 'messages'),
      where('bookingId', '==', id)
    );
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
      docs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(docs);
    });

    return () => {
      unsubscribeBooking();
      unsubscribeMessages();
    };
  }, [id, user, profile, navigate, otherParty]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!booking) {
        setBooking({
           id: id || 'fallback',
           customerId: user?.uid || '',
           serviceId: 's1',
           serviceName: 'CleanEase Service',
           category: 'cleaning',
           status: 'pending',
           scheduledAt: new Date().toISOString(),
           location: profile?.location as any || { lat: 17.385, lng: 78.486, address: 'Refreshing location...' },
           totalPrice: 0,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           paymentMethod: 'cash',
           paymentStatus: 'pending'
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [booking, id, user, profile]);

  useEffect(() => {
    if (booking?.status === 'assigned' || booking?.status === 'arriving') {
      // Mock provider starting position
      if (!providerPos) {
        setProviderPos({
          lat: booking.location.lat + 0.015,
          lng: booking.location.lng - 0.012
        });
      }
    }
  }, [booking?.status, booking?.location, providerPos]);

  useEffect(() => {
    if (!providerPos || !booking || booking.status === 'completed' || booking.providerLocation) return;
    if (booking.status === 'pending' || booking.status === 'assigned') return;

    const interval = setInterval(() => {
      setProviderPos(prev => {
        if (!prev) return prev;
        const latTarget = booking.location.lat;
        const lngTarget = booking.location.lng;
        
        const latDiff = latTarget - prev.lat;
        const lngDiff = lngTarget - prev.lng;
        
        // Slightly faster movement for demo purposes
        const step = 0.15; 
        
        if (Math.abs(latDiff) < 0.0005 && Math.abs(lngDiff) < 0.0005) {
          return { lat: latTarget, lng: lngTarget }; // Snapped to target
        }
        
        return {
          lat: prev.lat + latDiff * step,
          lng: prev.lng + lngDiff * step
        };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [providerPos, booking]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user) return;

    const currentMsg = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        bookingId: id,
        senderId: user.uid,
        text: currentMsg,
        createdAt: new Date().toISOString(),
      });

      // If no other party, trigger AI bot
      if (!otherParty && profile?.role === 'homeowner') {
        setIsBotTyping(true);
        try {
          const response = await fetch('/api/chat-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: currentMsg,
              context: { 
                bookingId: id, 
                status: booking?.status, 
                service: booking?.serviceName,
                totalPrice: booking?.totalPrice
              }
            })
          });
          const data = await response.json();
          if (data.text) {
             await addDoc(collection(db, 'messages'), {
                bookingId: id,
                senderId: 'ai-bot',
                text: data.text,
                createdAt: new Date().toISOString(),
             });
          }
        } catch (botErr) {
          console.error("Bot failed:", botErr);
        } finally {
          setIsBotTyping(false);
        }
      }

      // Notify other party
      const otherId = profile?.role === 'homeowner' ? booking?.providerId : booking?.customerId;
      if (otherId) {
        await sendNotificationToUser(
          otherId,
          `New message from ${profile?.displayName}`,
          currentMsg.length > 50 ? currentMsg.substring(0, 50) + '...' : currentMsg,
          { bookingId: id }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (status: Booking['status']) => {
    if (!id || !booking) return;

    // Optimistic UI update
    const oldStatus = booking.status;
    setBooking(prev => prev ? { ...prev, status } : null);

    try {
      await updateDoc(doc(db, 'bookings', id), {
        status,
        updatedAt: new Date().toISOString(),
      });

      // Notify customer if provider updates status (non-blocking)
      if (profile?.role === 'provider' && booking.customerId) {
        sendNotificationToUser(
          booking.customerId,
          'Service Update',
          `Your service is now ${status.replace('-', ' ')}`,
          { bookingId: id, status }
        ).catch(err => console.error("Notification failed:", err));
      }
    } catch (err) {
      console.error(err);
      // Revert if failed
      setBooking(prev => prev ? { ...prev, status: oldStatus } : null);
      alert('Failed to update status. Please check your connection.');
    }
  };

  const handleCall = () => {
    alert(`Calling ${otherParty?.displayName || 'Service Partner'}... This would open the dialer on a real mobile device.`);
  };

  const submitReview = async () => {
    if (!id || !booking || !user || !booking.providerId) return;
    setIsSubmittingReview(true);
    try {
      const reviewData = {
        bookingId: id,
        customerId: user.uid,
        providerId: booking.providerId,
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString(),
      };
      
      const res = await addDoc(collection(db, 'reviews'), reviewData);
      
      await updateDoc(doc(db, 'bookings', id), {
        reviewId: res.id
      });

      // Update provider's overall rating (simplified)
      const providerRef = doc(db, 'profiles', booking.providerId);
      const providerSnap = await getDoc(providerRef);
      if (providerSnap.exists()) {
        const pData = providerSnap.data();
        const currentRating = pData.rating || 5;
        const totalReviews = pData.totalReviews || 1;
        const newRating = ((currentRating * totalReviews) + reviewRating) / (totalReviews + 1);
        
        await updateDoc(providerRef, {
          rating: Number(newRating.toFixed(1)),
          totalReviews: totalReviews + 1
        });
      }

      alert('Thank you for your feedback!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-8">
        <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-serif font-bold text-natural-text animate-pulse">Retrieving Booking...</h2>
          <p className="text-natural-muted font-bold uppercase tracking-widest text-xs">This will only take a moment</p>
        </div>
      </div>
    );
  }

  const steps: Booking['status'][] = ['pending', 'assigned', 'arriving', 'at-location', 'in-progress', 'completed'];
  const currentStepIndex = steps.indexOf(booking.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Left Column: Details & Chat */}
      <div className="lg:col-span-2 space-y-12">
        <button 
          onClick={() => navigate(profile?.role === 'provider' ? '/dashboard' : '/home')}
          className="flex items-center gap-2 text-natural-muted hover:text-natural-text transition-colors font-bold uppercase tracking-widest text-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Status Tracker */}
        <div className="bg-white p-10 rounded-[40px] border border-natural-border shadow-soft">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-serif font-bold text-natural-text">Service Tracking</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold px-4 py-2 bg-primary/10 text-primary rounded-full uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              {booking.status.toUpperCase()}
            </div>
          </div>

          <div className="flex justify-between items-center relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-natural-surface -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-1000" 
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isPast ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-2 border-natural-border text-natural-muted/30'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-6 h-6" /> : (idx + 1)}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-primary' : 'text-natural-muted'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Component */}
        <div className="bg-white rounded-[40px] border border-natural-border shadow-soft overflow-hidden flex flex-col h-[600px]">
          <div className="p-8 border-b border-natural-surface flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={otherParty?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full border-2 border-natural-surface"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-natural-text text-lg">{otherParty?.displayName || 'Service Partner'}</h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active Now</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCall}
                className="p-3 bg-natural-surface hover:bg-natural-border rounded-2xl transition-colors cursor-pointer"
              >
                <Phone className="w-5 h-5 text-natural-muted" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-natural-bg/30">
            {messages.map((msg) => {
              const isMe = msg.senderId === user.uid;
              const isBot = msg.senderId === 'ai-bot';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-[24px] text-sm font-medium shadow-sm leading-relaxed ${
                    isMe ? 'bg-primary text-white rounded-br-none' : 
                    isBot ? 'bg-secondary text-white rounded-bl-none' :
                    'bg-white text-natural-text border border-natural-border rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {isBotTyping && (
              <div className="flex justify-start">
                <div className="bg-secondary/10 text-secondary p-4 rounded-2xl animate-pulse text-xs font-bold uppercase tracking-widest">
                  CleanEase Bot is thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-natural-surface flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-natural-surface border border-natural-border rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <button className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>

        {/* Review Section */}
        {booking.status === 'completed' && profile?.role === 'homeowner' && !booking.reviewId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[40px] border border-natural-border shadow-soft"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <StarIcon className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-natural-text">Rate your Experience</h2>
                <p className="text-natural-muted font-medium">How was the service provided by {otherParty?.displayName}?</p>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    reviewRating >= star ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-natural-surface text-natural-muted'
                  }`}
                >
                  <StarIcon className={`w-8 h-8 ${reviewRating >= star ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>

            <textarea 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tell us more about the service... (optional)"
              className="w-full bg-natural-surface border border-natural-border rounded-3xl p-6 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all min-h-[120px] mb-8"
            />

            <button 
              onClick={submitReview}
              disabled={isSubmittingReview}
              className="w-full py-5 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/20 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </motion.div>
        )}

        {booking.status === 'completed' && booking.reviewId && (
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900">Feedback Received</h4>
              <p className="text-sm text-emerald-700">Thank you for helping us maintain high quality standards.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Provider & Map */}
      <div className="space-y-12">
        {/* Person Card */}
        <div className="card-natural p-10 flex flex-col items-center text-center relative overflow-hidden">
          {booking.status === 'pending' && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div 
                animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/20 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 2.5], opacity: [0.2, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full"
              />
            </div>
          )}
          
          <h3 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-10 w-full relative z-10">
            {profile?.role === 'homeowner' ? 'Verified Professional' : 'Customer Profile'}
          </h3>

          <AnimatePresence mode="wait">
            {otherParty ? (
              <motion.div 
                key="provider-active"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative z-10"
              >
                <Link to={`/worker/${otherParty.uid}`} className="relative mb-6 group cursor-pointer inline-block">
                  <img 
                    src={otherParty.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-[40px] border-8 border-natural-surface object-cover shadow-soft group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-secondary text-white w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xl ring-4 ring-white shadow-lg">
                     {otherParty.displayName.slice(0, 1)}
                  </div>
                </Link>
                <Link to={`/worker/${otherParty.uid}`} className="text-2xl font-serif font-bold text-natural-text mb-2 hover:text-primary transition-colors block">
                  {otherParty.displayName}
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-secondary mb-10">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-sm font-bold">4.9 • Premium Provider</span>
                </div>
                
                <div className="w-full space-y-4">
                    {profile?.role === 'provider' && booking.status === 'assigned' && (
                      <button 
                       onClick={() => updateStatus('arriving')}
                       className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                      >
                        Start Travel
                      </button>
                    )}
                    {profile?.role === 'provider' && booking.status === 'arriving' && (
                      <button 
                       onClick={() => updateStatus('at-location')}
                       className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                      >
                        I've Arrived at Site
                      </button>
                    )}
                    {profile?.role === 'provider' && booking.status === 'at-location' && (
                      <button 
                       onClick={() => updateStatus('in-progress')}
                       className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                      >
                        Start Service Work
                      </button>
                    )}
                    {profile?.role === 'provider' && booking.status === 'in-progress' && (
                      <button 
                       onClick={() => updateStatus('completed')}
                       className="w-full py-5 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/20 hover:opacity-90 transition-all cursor-pointer"
                      >
                        Confirm Completion
                      </button>
                    )}
                    
                    {profile?.role === 'homeowner' && (booking.status === 'arriving' || booking.status === 'assigned') && (
                       <Link 
                        to={`/track/${booking.id}`}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                       >
                         <Target className="w-5 h-5" />
                         Live Tracking
                       </Link>
                    )}

                    {booking.status === 'pending' && (
                      <button className="w-full py-5 bg-natural-surface text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-colors cursor-pointer border border-natural-border">
                        Cancel Booking
                      </button>
                    )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="provider-searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 space-y-6 relative z-10"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <ShieldCheck className="text-primary w-10 h-10" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
                  />
                </div>
                <div className="space-y-2 px-4">
                  <p className="text-natural-text text-sm font-bold uppercase tracking-widest">Searching Professionals</p>
                  <p className="text-natural-muted text-xs leading-relaxed">We're finding the best verified expert near your location in Hyderabad...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map */}
        <div className="bg-white rounded-[40px] border border-natural-border shadow-soft overflow-hidden h-[350px] relative group">
          <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold uppercase tracking-widest border border-natural-border flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Tracking
          </div>
          
          <Link 
            to={`/track/${booking.id}`}
            className="absolute top-6 right-6 z-10 p-2 bg-white/90 backdrop-blur-md rounded-xl border border-natural-border hover:bg-primary hover:text-white transition-all shadow-md group-hover:scale-110"
            title="Expand Tracking"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          {hasValidKey ? (
            <APIProvider apiKey={MAPS_KEY} version="weekly" libraries={['marker']}>
              <Map
                center={booking.location}
                zoom={14}
                mapId="QUICK_SEVA_MAP"
                style={{ width: '100%', height: '100%' }}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
              >
                <AdvancedMarker position={booking.location}>
                  <Pin background={'#5A7D6C'} borderColor={'#fff'} glyphColor={'#fff'} scale={1.2} />
                </AdvancedMarker>
                {providerPos && (
                  <AdvancedMarker position={providerPos}>
                     <div className="relative group">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-xl border-2 border-emerald-500 overflow-hidden group-hover:scale-110 transition-transform">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.providerId || 'cleaner'}`} 
                            alt="Pro"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-md border border-natural-border whitespace-nowrap text-[8px] font-bold uppercase tracking-widest">
                          Pro En Route
                        </div>
                     </div>
                  </AdvancedMarker>
                )}
                {realUserPos && (
                   <AdvancedMarker position={realUserPos}>
                      <div className="relative">
                         <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-ping absolute inset-0" />
                         <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative" />
                      </div>
                   </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full bg-natural-surface flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-sm font-bold text-natural-text mb-2">Maps API Key Required</h3>
              <p className="text-[10px] text-natural-muted leading-relaxed max-w-[250px]">
                To track your provider, please add a valid <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> in Settings → Secrets.
                <br /><br />
                <span className="text-secondary font-bold">Note:</span> The key should start with "AIza". If you provided a Client ID ending in ".apps.googleusercontent.com", that is an OAuth ID and will not work here.
              </p>
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start" 
                target="_blank" 
                rel="noopener"
                className="mt-4 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                Get Key
              </a>
            </div>
          )}
        </div>

        {/* Pricing Card */}
        <div className="bg-natural-text text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
           <h3 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-10 w-full border-b border-white/10 pb-4">Fare Details</h3>
           <div className="space-y-6">
             <div className="flex justify-between text-sm font-medium">
               <span className="text-gray-400">Service Fee</span>
               <span className="text-white">₹{booking.totalPrice}</span>
             </div>
             <div className="flex justify-between text-sm font-medium">
               <span className="text-gray-400">Platform & Safety</span>
               <span className="text-white">₹49</span>
             </div>
             <div className="pt-4 border-t border-white/5 flex gap-10">
                <div>
                  <h4 className="text-[9px] font-bold text-natural-muted uppercase tracking-wider mb-2">Method</h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    {booking.paymentMethod === 'cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                    {booking.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                  </div>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-natural-muted uppercase tracking-wider mb-2">Status</h4>
                  <div className={`text-xs font-bold uppercase tracking-widest ${booking.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-primary'}`}>
                    {booking.paymentStatus || 'confirmed'}
                  </div>
                </div>
              </div>
             <div className="pt-6 flex justify-between items-end">
               <span className="text-xs font-bold uppercase tracking-widest text-primary">Grand Total</span>
               <span className="text-4xl font-bold font-serif">₹{booking.totalPrice + 49}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
