import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Booking, Service } from '../types';
import { Search, MapPin, Clock, Star, Droplets, UserCheck, ShieldCheck, ChevronRight, Plus, Zap, ChefHat, Hammer } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import MapDisplay from '../components/MapDisplay';
import { cn } from '../lib/utils';
import SupportSection from '../components/SupportSection';

const CATEGORIES = [
  { id: 'cleaning', name: 'Deep Cleaning', icon: Droplets, color: 'text-primary', bg: 'bg-natural-surface' },
];

const HomeownerHome = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const q = query(collection(db, 'services'), limit(4));
        const snap = await getDocs(q);
        setPopularServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle Firestore Timestamp
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
        return { id: doc.id, ...data, createdAt } as Booking;
      });
      // Sort in memory
      docs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setBookings(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Search Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-serif text-natural-text mb-6 font-bold">Namaste, {profile?.displayName?.split(' ')[0] || 'Friend'}</h1>
        <p className="text-natural-muted mb-8 -mt-4 font-medium">What can we help you with today?</p>
        <div className="relative max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-natural-muted/50 w-5 h-5" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for 'Deep Cleaning', 'Electric Repairs', 'Plumbing Works'..."
            className="w-full pl-16 pr-6 py-4 bg-white border border-natural-border rounded-full shadow-soft focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-natural-muted/40 font-medium"
          />
        </div>
      </div>

        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-6">Service Categories</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredCategories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/services?category=${cat.id}`}
              className="bg-natural-surface p-10 rounded-[40px] border border-natural-border hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all group flex items-center gap-8"
            >
              <div className={`w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <cat.icon className={`${cat.color} w-10 h-10`} />
              </div>
              <div>
                <h3 className="font-bold text-natural-text text-2xl mb-2">{cat.name}</h3>
                <p className="text-xs text-natural-muted uppercase tracking-widest font-black flex items-center gap-2">
                  Book Now 
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
          ))}
        </div>

      {popularServices.length > 0 && (
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8 text-center font-serif italic">Live Service Coverage in Hyderabad</h2>
          <MapDisplay 
            center={profile?.location as any || { lat: 17.3850, lng: 78.4867 }}
            markers={popularServices.map(s => ({
              id: s.id,
              position: { lat: 17.3850 + (Math.random() - 0.5) * 0.02, lng: 78.4867 + (Math.random() - 0.5) * 0.02 },
              title: s.name
            }))}
          />
        </div>
      )}

      {popularServices.length > 0 && (
        <div className="mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8">Popular Nearby</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularServices.map(service => (
              <Link 
                key={service.id} 
                to={`/services?category=${service.category}`}
                className="bg-white p-6 rounded-3xl border border-natural-border hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-natural-surface rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {service.iconName === 'broom' ? '🧹' : 
                   service.iconName === 'bolt' ? '⚡' : 
                   service.iconName === 'plumber' ? '🔧' : 
                   service.iconName === 'tiffin' ? '🍱' : 
                   service.iconName === 'dust' ? '✨' : 
                   service.iconName === 'baby' ? '👶' : 
                   service.iconName === 'heart' ? '🤝' : '🛠️'}
                </div>
                <h3 className="font-bold text-natural-text mb-1">{service.name}</h3>
                <p className="text-[10px] text-natural-muted uppercase font-bold tracking-widest mb-4 italic">₹{service.basePrice} Base</p>
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span>New</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active Bookings */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted">Active Booking</h2>
          <Link to="/history" className="text-sm font-bold text-secondary hover:underline">View all history</Link>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => (
              <Link 
                key={booking.id} 
                to={`/booking/${booking.id}`}
                className="bg-white p-10 rounded-[32px] border border-natural-border shadow-soft hover:shadow-md transition-all relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-natural-surface rounded-full flex items-center justify-center">
                    <Clock className="text-primary w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-natural-text">{(booking as any).serviceName || 'Service Request'}</h4>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-natural-muted mb-1">Booking ID</p>
                  <p className="text-lg font-mono font-bold">#QS-{booking.id.slice(0, 5).toUpperCase()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-blue-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No active bookings</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Get started by choosing a service from above items.</p>
          </div>
        )}
      </div>

      {/* Featured Packs */}
      <section className="bg-blue-600 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold mb-4 italic">Quick Seva Pro</h2>
          <p className="text-blue-100 mb-8 leading-relaxed">
            Get unlimited free visits and 20% off on all services with our Pro membership.
          </p>
          <Link to="/pro" className="inline-block px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors">
            Try for ₹299/mo
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50" />
      </section>

      <SupportSection />
    </div>
  );
};

export default HomeownerHome;
