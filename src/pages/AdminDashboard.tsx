import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Booking, UserProfile, Service } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, ShoppingBag, TrendingUp, Search, Trash2, ExternalLink, Activity, CheckCircle2, AlertCircle, Map as MapIcon, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(50));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'bookings'));

    const qUsers = query(collection(db, 'users'), limit(50));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.LIST, 'services'));

    return () => {
      unsubBookings();
      unsubUsers();
      unsubServices();
    };
  }, []);

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Permanently remove this user? This will not delete their Auth account, only their platform profile.')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Remove this service from the catalog?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
      }
    }
  };

  const handleAddService = async () => {
    try {
      const id = newService.name?.toLowerCase().replace(/\s+/g, '-') || Date.now().toString();
      await setDoc(doc(db, 'services', id), {
        ...newService,
        id,
        createdAt: serverTimestamp()
      } as any);
      setShowAddService(false);
      setNewService({ name: '', category: 'cleaning', basePrice: 0, description: '', iconName: 'broom' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    }
  };

  const handleSeedServices = async () => {
    const defaultServices = [
      { name: 'Deep Home Cleaning', category: 'cleaning', basePrice: 1999, description: 'Deep cleaning for every corner of your home.', iconName: 'broom' },
      { name: 'Electric Repair Package', category: 'repairs', basePrice: 599, description: 'Standard electrical safety audit and minor fixes.', iconName: 'bolt' },
      { name: 'Standard Plumbing', category: 'plumbing', basePrice: 499, description: 'Fixing common household leaks and clogs.', iconName: 'plumber' },
      { name: 'Tiffin Meal Plan', category: 'cooking', basePrice: 1200, description: 'Daily home-style meal prep service.', iconName: 'tiffin' },
      { name: 'Specialized Dusting', category: 'dusting', basePrice: 399, description: 'Detailed dusting of blinds, shelves and furniture.', iconName: 'dust' },
      { name: 'Background Verified Child Care', category: 'childcare', basePrice: 1500, description: 'Safe and monitored care for your little ones.', iconName: 'baby' },
      { name: 'Full-time Care Taker', category: 'caretaker', basePrice: 2000, description: 'Dedicated personal assistance for seniors or patients.', iconName: 'heart' },
    ];

    try {
      setLoading(true);
      for (const service of defaultServices) {
        const id = service.name.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'services', id), {
          ...service,
          id,
          createdAt: serverTimestamp()
        });
      }
      alert('Successfully seeded service catalog');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    } finally {
      setLoading(false);
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
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-natural-surface/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-natural-text text-sm">{(booking as any).serviceName}</div>
                      <div className="text-[10px] text-natural-muted font-mono">{booking.id}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-natural-text text-sm">₹{booking.totalPrice}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
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
              <div key={(user as any).id || user.uid} className="bg-white p-6 rounded-2xl border border-natural-border flex items-center justify-between group">
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
                    onClick={() => handleDeleteUser((user as any).id || user.uid)}
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
