import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Booking, UserProfile } from '../types';
import { motion } from 'motion/react';
import { 
  Map, 
  AdvancedMarker, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { 
  ChevronLeft, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Clock, 
  MapPin, 
  Star,
  ShieldCheck,
  Zap,
  MoreVertical
} from 'lucide-react';

const LiveTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [provider, setProvider] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerPos, setProviderPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [realUserPos, setRealUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [distance, setDistance] = useState<string>('Calculated...');
  const [duration, setDuration] = useState<string>('Estimating...');
  const [showProviderInfo, setShowProviderInfo] = useState(false);
  
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [markerRef, marker] = useAdvancedMarkerRef();

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
    if (!id) return;
    
    const unsubscribe = onSnapshot(doc(db, 'bookings', id), async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Booking;
        setBooking(data);
        setUserPos({ lat: data.location.lat, lng: data.location.lng });
        
        // Fetch provider profile
        if (data.providerId) {
          const pSnap = await getDoc(doc(db, 'profiles', data.providerId));
          if (pSnap.exists()) {
            setProvider({ uid: pSnap.id, ...pSnap.data() } as UserProfile);
          }
        }

        // Use real provider location if available
        if (data.providerLocation) {
          setProviderPos(data.providerLocation);
        } else if (!providerPos) {
           // Mock provider starting position if not set and no real location
           const offset = 0.015;
           setProviderPos({ 
             lat: data.location.lat + offset * (Math.random() > 0.5 ? 1 : -1), 
             lng: data.location.lng + offset * (Math.random() > 0.5 ? 1 : -1)
           });
        }
      }
      setLoading(false);
    });

    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [id, providerPos]);

  useEffect(() => {
    if (!providerPos || !userPos || booking?.status === 'completed' || booking?.providerLocation) return;

    const interval = setInterval(() => {
      setProviderPos(prev => {
        if (!prev) return prev;
        
        const latDiff = userPos.lat - prev.lat;
        const lngDiff = userPos.lng - prev.lng;
        const step = 0.02;
        
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          clearInterval(interval);
          return userPos;
        }

        return {
          lat: prev.lat + latDiff * step,
          lng: prev.lng + lngDiff * step
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [userPos, booking?.status]);

  useEffect(() => {
    if (!routesLib || !map || !providerPos || !userPos) return;

    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin: providerPos,
      destination: userPos,
      travelMode: 'DRIVING' as any,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#5A7D6C',
            strokeWeight: 6,
            strokeOpacity: 0.8
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        
        const dist = routes[0].distanceMeters;
        const dur = routes[0].durationMillis;
        
        if (dist) setDistance((dist / 1000).toFixed(1) + ' km');
        if (dur) setDuration(Math.ceil(Number(dur) / 60000) + ' mins');
        
        if (polylinesRef.current.length > 0 && distance === 'Calculated...') {
            map.fitBounds(routes[0].viewport!);
        }
      }
    }).catch(err => console.error("Routing error:", err));

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, providerPos, userPos, distance]);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           <p className="font-bold text-natural-muted uppercase tracking-widest text-[10px]">Initializing Tracking...</p>
        </div>
     </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
       <h1 className="text-2xl font-serif font-bold mb-4">Booking Not Found</h1>
       <button onClick={() => navigate('/home')} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold">Back Home</button>
    </div>
  );

  return (
    <div className="h-screen w-full relative overflow-hidden bg-natural-bg">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-20 p-6 pointer-events-none">
        <div className="max-w-4xl mx-auto flex justify-between items-start">
           <button 
             onClick={() => navigate(-1)}
             className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-natural-text pointer-events-auto active:scale-95 transition-all cursor-pointer"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           
           <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-natural-border flex flex-col items-center pointer-events-auto">
              <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-sm font-bold text-natural-text capitalize">{booking.status === 'pending' ? 'Assigning Pro' : 'Pro En Route'}</span>
              </div>
           </div>

           <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-natural-text pointer-events-auto cursor-pointer">
             <MoreVertical className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 z-10">
        <Map
          defaultCenter={userPos || { lat: 17.385, lng: 78.486 }}
          defaultZoom={15}
          mapId="LIVE_TRACKING_MAP"
          options={{
            disableDefaultUI: true,
            styles: [
               { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ]
          } as any}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {userPos && (
             <AdvancedMarker position={userPos}>
                <div className="relative">
                   <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center relative">
                      <MapPin className="w-5 h-5 text-primary" />
                   </div>
                   <p className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounde-lg text-[8px] font-bold shadow-sm border border-natural-border">Service Location</p>
                </div>
             </AdvancedMarker>
          )}

          {realUserPos && (
             <AdvancedMarker position={realUserPos}>
                <div className="relative">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-full animate-ping absolute inset-0" />
                   <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative">
                      <div className="w-2 h-2 bg-white rounded-full" />
                   </div>
                   <p className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold shadow-sm">Your Location</p>
                </div>
             </AdvancedMarker>
          )}

          {providerPos && (
             <AdvancedMarker 
               ref={markerRef}
               position={providerPos} 
               onClick={() => setShowProviderInfo(true)}
             >
                <div className="relative group cursor-pointer">
                   <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white z-10 flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-white" />
                   </div>
                   <div className="w-12 h-12 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 flex items-center justify-center overflow-hidden active:scale-95 transition-transform">
                      <img 
                        src={provider?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.providerId || 'cleaner'}`} 
                        alt="Provider"
                        className="w-full h-full object-cover"
                      />
                   </div>
                </div>
             </AdvancedMarker>
          )}

          {showProviderInfo && provider && (
            <InfoWindow anchor={marker} onCloseClick={() => setShowProviderInfo(false)}>
               <div className="p-1">
                  <p className="text-sm font-bold uppercase tracking-tight">{provider.displayName}</p>
                  <p className="text-[10px] text-natural-muted font-medium mb-1">
                    {provider.skills?.slice(0, 2).join(' • ') || 'Service Specialist'}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                     <ShieldCheck className="w-3 h-3" /> Fully Verified
                  </p>
               </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {/* Floating Info Cards */}
      <div className="absolute bottom-0 left-0 w-full z-20 px-6 pb-20 md:pb-10 pointer-events-none">
        <div className="max-w-xl mx-auto space-y-4">
           {/* Eta Card */}
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="bg-primary px-8 py-6 rounded-[32px] shadow-2xl flex items-center justify-between pointer-events-auto"
           >
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                    <Clock className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">Estimated Arrival</h3>
                    <p className="text-white text-3xl font-serif font-bold">{duration}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1">Distance</p>
                 <p className="text-white text-xl font-bold">{distance}</p>
              </div>
           </motion.div>

           {/* Provider Details Card */}
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="bg-white p-8 rounded-[40px] shadow-2xl border border-natural-border pointer-events-auto"
           >
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-natural-surface rounded-3xl overflow-hidden shadow-inner border border-natural-border">
                       <img 
                          src={provider?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.providerId || 'cleaner'}`} 
                          alt="Provider"
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-bold text-natural-text">{provider?.displayName || 'Service Pro'}</h4>
                          <ShieldCheck className="w-4 h-4 text-primary" />
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-secondary">
                             <Star className="w-3.5 h-3.5 fill-current" />
                             <span className="text-sm font-bold">{provider?.rating || '4.9'}</span>
                          </div>
                          <div className="h-3 w-px bg-natural-border" />
                          <span className="text-xs font-bold text-natural-muted">{provider?.totalReviews || '842'} Jobs Done</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <a 
                      href={`tel:${provider?.phoneNumber || '+910000000000'}`}
                      className="w-14 h-14 bg-natural-surface rounded-2xl flex items-center justify-center text-primary border border-natural-border hover:bg-primary hover:text-white transition-all transform active:scale-95 cursor-pointer"
                    >
                       <Phone className="w-6 h-6" />
                    </a>
                    <button className="w-14 h-14 bg-natural-surface rounded-2xl flex items-center justify-center text-primary border border-natural-border hover:bg-primary hover:text-white transition-all transform active:scale-95 cursor-pointer">
                       <MessageSquare className="w-6 h-6" />
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-natural-surface p-4 rounded-2xl border border-natural-border">
                    <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Vehicle</p>
                    <p className="text-sm font-bold text-natural-text">CleanEase Partner</p>
                    <p className="text-[10px] text-emerald-600 font-bold">Verified Provider</p>
                 </div>
                 <div className="bg-natural-surface p-4 rounded-2xl border border-natural-border cursor-pointer hover:border-primary transition-colors group">
                    <p className="text-[9px] font-bold text-natural-muted uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-xs font-bold text-natural-text line-clamp-1 group-hover:text-primary transition-colors">{booking.location.address}</p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-primary">
                       <Navigation className="w-3 h-3" /> Get Directions
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
