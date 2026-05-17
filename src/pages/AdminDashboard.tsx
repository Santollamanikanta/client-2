import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Booking, UserProfile, Service } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, ShoppingBag, TrendingUp, Search, Trash2, ExternalLink, Activity, CheckCircle2, AlertCircle, Plus, X, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    category: 'cleaning',
    basePrice: 0,
    description: '',
    iconName: 'broom'
  });

  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const isMapsConfigured = Boolean(API_KEY) && API_KEY.startsWith('AIza') && API_KEY.length > 20;

  useEffect(() => {
    // Bookings subscription
    const bookingsQuery = query(collection(db, 'bookings'), limit(100));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(docs);
      setLoading(false);
    });

    // Users subscription
    const usersQuery = query(collection(db, 'profiles'), limit(50));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[]);
    });

    // Services subscription
    const servicesQuery = query(collection(db, 'services'));
    const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeUsers();
      unsubscribeServices();
    };
  }, []);

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Permanently remove this user profile?')) {
      try {
        await deleteDoc(doc(db, 'profiles', uid));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Remove this service from the catalog?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddService = async () => {
    try {
      const id = newService.name?.toLowerCase().replace(/\s+/g, '-') || Date.now().toString();
      await setDoc(doc(db, 'services', id), {
        ...newService,
        id,
        createdAt: new Date().toISOString()
      });
      setShowAddService(false);
      setNewService({ name: '', category: 'cleaning', basePrice: 0, description: '', iconName: 'broom' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedServices = async () => {
    const defaultServices = [
      { name: 'House Cleaning Package', category: 'cleaning', basePrice: 199, description: 'Basic mopping, sweeping and dusting for your home.', iconName: 'broom' },
      { name: 'Mopping Service', category: 'mopping', basePrice: 49, description: 'Professional wet mopping of all floors.', iconName: 'broom' },
      { name: 'Sweeping Service', category: 'sweeping', basePrice: 59, description: 'Complete dry sweeping of the premises.', iconName: 'broom' },
      { name: 'Dusting Service', category: 'dusting', basePrice: 39, description: 'Detailed dusting of furniture and electronics.', iconName: 'dust' },
      { name: 'Fan Cleaning', category: 'fan', basePrice: 29, description: 'Ceiling and table fan deep cleaning.', iconName: 'bolt' },
      { name: 'Wardrobe Cleaning', category: 'wardrobe', basePrice: 39, description: 'Internal organization and dusting of wardrobes.', iconName: 'dust' },
      { name: 'Verified Child Care', category: 'childcare', basePrice: 499, description: 'Verified professional child care at your home.', iconName: 'baby' },
      { name: 'Kitchen Cleaning', category: 'kitchen', basePrice: 99, description: 'Standard kitchen cleaning and organization.', iconName: 'broom' },
      { name: 'Cooler Cleaning', category: 'cooler', basePrice: 79, description: 'Water change and internal pad cleaning.', iconName: 'bolt' },
      { name: 'Door Cleaning', category: 'door', basePrice: 29, description: 'Polish and dust removal from all room doors.', iconName: 'broom' },
    ];

    try {
      setLoading(true);
      const batch = writeBatch(db);
      defaultServices.forEach(service => {
        const id = service.name.toLowerCase().replace(/\s+/g, '-');
        const docRef = doc(db, 'services', id);
        batch.set(docRef, {
          ...service,
          id,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      alert('Successfully seeded service catalog');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await setDoc(doc(db, 'bookings', bookingId), { 
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const stats = {
    totalRevenue: bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
    activeUsers: users.length,
    totalBookings: bookings.length,
    completedJobs: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-natural-text mb-2">Platform Overview</h1>
          <p className="text-natural-muted font-medium italic">Owner's Command Center</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold uppercase tracking-widest text-[10px]">
          <Shield className="w-4 h-4" />
          Admin Mode
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Total Volume', value: `₹${stats.totalRevenue}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Registered Users', value: stats.activeUsers.toString(), icon: Users, color: 'text-primary', bg: 'bg-natural-surface' },
            { label: 'Total Bookings', value: stats.totalBookings.toString(), icon: ShoppingBag, color: 'text-secondary', bg: 'bg-natural-surface' },
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

        {/* System Health */}
        <div className="card-natural p-8 bg-natural-text text-white">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest">System Health</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Firebase
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium">
                {isMapsConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                Google Maps
              </div>
              <span className={`text-[10px] font-bold ${isMapsConfigured ? 'text-emerald-400' : 'text-amber-400'} uppercase tracking-widest`}>
                {isMapsConfigured ? 'Healthy' : 'AIza Key Required'}
              </span>
            </div>
            {!isMapsConfigured && (
              <p className="text-[10px] text-white/60 leading-relaxed mt-4 italic">
                To add your key: Open <strong>Settings</strong> (⚙️) → <strong>Secrets</strong> → type <code>GOOGLE_MAPS_PLATFORM_KEY</code> → paste key → Enter.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Provider Map */}
      {isMapsConfigured && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-emerald-500" />
              Active Provider Fleet
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-natural-muted uppercase">Live Updates</span>
            </div>
          </div>
          <div className="bg-white rounded-[40px] border border-natural-border shadow-soft h-[500px] overflow-hidden relative">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                center={{ lat: 17.3850, lng: 78.4867 }}
                zoom={12}
                mapId="ADMIN_PROVIDER_TRACKER"
                style={{ width: '100%', height: '100%' }}
              >
                {users.filter(u => u.role === 'provider' && u.location).map(provider => (
                  <AdvancedMarker 
                    key={provider.uid} 
                    position={provider.location!}
                  >
                    <div className="relative group cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl border-2 ${provider.isOnline ? 'border-emerald-500' : 'border-gray-300'} bg-white overflow-hidden shadow-lg transition-transform hover:scale-125`}>
                        <img 
                          src={provider.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.displayName}`} 
                          alt="Pro" 
                          className={`w-full h-full object-cover ${provider.isOnline ? '' : 'grayscale'}`}
                        />
                      </div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-lg shadow-md border border-natural-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-[8px] font-bold text-natural-text uppercase">{provider.displayName}</p>
                         <p className={`text-[6px] font-bold uppercase ${provider.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                           {provider.isOnline ? 'Online' : 'Offline'}
                         </p>
                      </div>
                    </div>
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted">Live Transaction Feed</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-natural-border rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-natural-border overflow-hidden shadow-soft">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-natural-surface border-b border-natural-border">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Service</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-natural-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border">
                {bookings.filter(b => b.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())).map((booking) => (
                  <tr key={booking.id} className="hover:bg-natural-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-natural-text text-sm">{booking.serviceName}</div>
                      <div className="text-[10px] text-natural-muted font-mono">{booking.id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-natural-text text-sm">₹{booking.totalPrice}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'pending-approval' ? 'bg-purple-100 text-purple-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {booking.status === 'pending-approval' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'pending')}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Approve Booking"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                              className="p-2 bg-red-50 text-red-600 rounded-lg shadow-sm border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Reject Booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <Link to={`/booking/${booking.id}`} className="p-2 hover:bg-white rounded-lg text-primary shadow-sm border border-transparent hover:border-natural-border">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 shadow-sm border border-transparent hover:border-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Directory */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8">User Directory</h2>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.uid} className="bg-white p-6 rounded-2xl border border-natural-border flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-natural-surface rounded-xl flex items-center justify-center font-bold text-primary">
                    {user.displayName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-natural-text text-sm">{user.displayName}</div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-primary/60">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDeleteUser(user.uid)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-primary/5 rounded-3xl border border-dashed border-primary/20">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                 <ShoppingBag className="w-4 h-4" />
                 Service Catalog
               </h3>
               <div className="flex gap-2">
                 <button 
                   onClick={handleSeedServices}
                   className="px-4 py-2 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-secondary/20 transition-all border border-secondary/20"
                 >
                   Seed Data
                 </button>
                 <button 
                   onClick={() => setShowAddService(true)}
                   className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                 >
                   Add New
                 </button>
               </div>
            </div>

            <p className="text-[10px] text-natural-muted leading-relaxed font-medium mb-6">
              Manage live service categories available to customers.
            </p>

            <div className="space-y-3">
              {services.map(service => (
                <div key={service.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-natural-border shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-natural-surface rounded-lg flex items-center justify-center text-xl">
                      {service.iconName === 'broom' ? '🧹' : 
                       service.iconName === 'bolt' ? '⚡' : 
                       service.iconName === 'plumber' ? '🔧' : 
                       service.iconName === 'tiffin' ? '🍱' : 
                       service.iconName === 'dust' ? '✨' : 
                       service.iconName === 'baby' ? '👶' : 
                       service.iconName === 'heart' ? '🤝' : '🛠️'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-natural-text block">{service.name}</span>
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">₹{service.basePrice}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {services.length === 0 && (
                <div className="text-[10px] text-natural-muted text-center py-4 italic border border-dashed border-natural-border rounded-xl">
                  No services in database. Click 'Add New' to seed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      <AnimatePresence>
        {showAddService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddService(false)}
              className="absolute inset-0 bg-natural-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-natural-text">New Service</h2>
                <button onClick={() => setShowAddService(false)} className="p-2 hover:bg-natural-surface rounded-full">
                  <X className="w-5 h-5 text-natural-muted" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Service Name</label>
                  <input 
                    type="text" 
                    value={newService.name}
                    onChange={e => setNewService({...newService, name: e.target.value})}
                    className="w-full px-6 py-4 bg-natural-surface border border-natural-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-xs"
                    placeholder="e.g. Bathroom Deep Clean"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Category</label>
                    <select 
                      value={newService.category}
                      onChange={e => setNewService({...newService, category: e.target.value})}
                      className="w-full px-6 py-4 bg-natural-surface border border-natural-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-[10px] appearance-none"
                    >
                      <option value="cleaning">Deep Cleaning</option>
                      <option value="repairs">Electric Repairs</option>
                      <option value="plumbing">Plumbing Works</option>
                      <option value="cooking">Cooking & Tiffin</option>
                      <option value="childcare">Child Care</option>
                      <option value="caretaker">Caretaker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Base Price (₹)</label>
                    <input 
                      type="number" 
                      value={newService.basePrice}
                      onChange={e => setNewService({...newService, basePrice: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 bg-natural-surface border border-natural-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Description</label>
                  <textarea 
                    value={newService.description}
                    onChange={e => setNewService({...newService, description: e.target.value})}
                    className="w-full px-6 py-4 bg-natural-surface border border-natural-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium h-24 text-xs"
                    placeholder="Describe the service..."
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                   {['broom', 'bolt', 'plumber', 'tiffin', 'dust', 'baby', 'heart'].map(icon => (
                     <button 
                       key={icon}
                       onClick={() => setNewService({...newService, iconName: icon})}
                       className={`p-4 rounded-xl border transition-all ${newService.iconName === icon ? 'border-primary bg-primary/5' : 'border-natural-border hover:bg-natural-surface'}`}
                     >
                       {icon === 'broom' ? '🧹' : 
                        icon === 'bolt' ? '⚡' : 
                        icon === 'plumber' ? '🔧' : 
                        icon === 'tiffin' ? '🍱' : 
                        icon === 'dust' ? '✨' : 
                        icon === 'baby' ? '👶' : '🤝'}
                     </button>
                   ))}
                </div>

                <button 
                  onClick={handleAddService}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all font-serif italic text-lg"
                >
                  Publish Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
