import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Booking, ChatMessage, UserProfile } from '../types';
import { sendNotificationToUser } from '../hooks/useNotifications';
import { 
  ChevronLeft, MapPin, Clock, Send, Phone, MessageSquare, 
  CheckCircle2, AlertCircle, Calendar, Star, MoreVertical, ShieldCheck 
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherParty, setOtherParty] = useState<UserProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const unsubBooking = onSnapshot(doc(db, 'bookings', id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Booking;
        setBooking({ id: snapshot.id, ...data });

        // Fetch other party profile
        const otherId = profile?.role === 'homeowner' ? data.providerId : data.customerId;
        if (otherId) {
          onSnapshot(doc(db, 'users', otherId), (uSnap) => {
            if (uSnap.exists()) setOtherParty(uSnap.data() as UserProfile);
          }, (err) => console.error("User Profile Snapshot Error:", err));
        }
      } else {
        navigate('/');
      }
    }, (err) => console.error("Booking Snapshot Error:", err));

    const qChats = query(
      collection(db, 'bookings', id, 'messages')
    );
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      docs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(docs);
    }, (err) => console.error("Chat Snapshot Error:", err));

    return () => {
      unsubBooking();
      unsubChats();
    };
  }, [id, user, profile, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user) return;

    try {
      await addDoc(collection(db, 'bookings', id, 'messages'), {
        senderId: user.uid,
        text: newMessage,
        createdAt: new Date().toISOString(),
      });

      // Notify other party
      const otherId = profile?.role === 'homeowner' ? booking?.providerId : booking?.customerId;
      if (otherId) {
        await sendNotificationToUser(
          otherId,
          `New message from ${profile?.displayName}`,
          newMessage.length > 50 ? newMessage.substring(0, 50) + '...' : newMessage,
          { bookingId: id }
        );
      }

      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (status: Booking['status']) => {
    if (!id || !booking) return;
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status,
        updatedAt: serverTimestamp(),
      });

      // Notify customer if provider updates status
      if (profile?.role === 'provider' && booking.customerId) {
        await sendNotificationToUser(
          booking.customerId,
          'Service Update',
          `Your service is now ${status.replace('-', ' ')}`,
          { bookingId: id, status }
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCall = () => {
    alert(`Calling ${otherParty?.displayName || 'Service Partner'}... This would open the dialer on a real mobile device.`);
  };

  if (!booking) return null;

  const steps: Booking['status'][] = ['pending', 'assigned', 'in-progress', 'completed'];
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
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-5 rounded-[24px] text-sm font-medium shadow-sm leading-relaxed ${
                    isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-natural-text border border-natural-border rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
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
      </div>

      {/* Right Column: Provider & Map */}
      <div className="space-y-12">
        {/* Person Card */}
        <div className="card-natural p-10 flex flex-col items-center text-center">
          <h3 className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-10 w-full">
            {profile?.role === 'homeowner' ? 'Verified Professional' : 'Customer Profile'}
          </h3>
          {otherParty ? (
            <>
              <Link to={`/worker/${otherParty.uid}`} className="relative mb-6 group cursor-pointer block">
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
              <div className="flex items-center gap-1.5 text-secondary mb-10">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm font-bold">4.9 • Premium Provider</span>
              </div>
              
              <div className="w-full space-y-4">
                 {profile?.role === 'provider' && booking.status === 'assigned' && (
                   <button 
                    onClick={() => updateStatus('in-progress')}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
                   >
                     Start Service
                   </button>
                 )}
                 {profile?.role === 'provider' && booking.status === 'in-progress' && (
                   <button 
                    onClick={() => updateStatus('completed')}
                    className="w-full py-5 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/20 hover:opacity-90 transition-all cursor-pointer"
                   >
                     Finish & Complete
                   </button>
                 )}
                 {booking.status === 'pending' && (
                   <button className="w-full py-5 bg-natural-surface text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-colors cursor-pointer border border-natural-border">
                     Cancel Booking
                   </button>
                 )}
              </div>
            </>
          ) : (
            <div className="py-12 space-y-6">
              <div className="w-20 h-20 bg-natural-surface rounded-full flex items-center justify-center mx-auto animate-pulse">
                <ShieldCheck className="text-primary w-10 h-10 opacity-30" />
              </div>
              <p className="text-natural-muted text-sm font-medium px-4">Matching you with a verified pro near your location...</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-[40px] border border-natural-border shadow-soft overflow-hidden h-[350px] relative">
          <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-bold uppercase tracking-widest border border-natural-border">
            Live Tracking
          </div>
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
