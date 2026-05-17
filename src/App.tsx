import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogIn, User as UserIcon, Home, Calendar, MessageSquare, Menu, X, Plus, ShieldCheck, MapPin, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import BottomNav from './components/BottomNav';
import WhatsAppButton from './components/WhatsAppButton';
import { useNotifications } from './hooks/useNotifications';
import { APIProvider } from '@vis.gl/react-google-maps';

// import { isSupabaseConfigured } from './lib/supabase';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

// Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const RoleSelection = React.lazy(() => import('./pages/RoleSelection'));
const HomeownerHome = React.lazy(() => import('./pages/HomeownerHome'));
const ProviderHome = React.lazy(() => import('./pages/ProviderHome'));
const BookingDetail = React.lazy(() => import('./pages/BookingDetail'));
const ServiceSelection = React.lazy(() => import('./pages/ServiceSelection'));
const Profile = React.lazy(() => import('./pages/Profile'));
const BookingHistory = React.lazy(() => import('./pages/BookingHistory'));
const BookingConfirmation = React.lazy(() => import('./pages/BookingConfirmation'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const WorkerProfile = React.lazy(() => import('./pages/WorkerProfile'));
const ProMembership = React.lazy(() => import('./pages/ProMembership'));
const LiveTracking = React.lazy(() => import('./pages/LiveTracking'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-natural-bg">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-primary/20 animate-pulse">
        CE
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-serif font-bold text-natural-text">CleanEase</h2>
      </div>
    </div>
  </div>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const Navbar = () => {
  const { user, profile, logout, signIn, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-natural-border h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight text-primary flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl">
            CE
          </div>
          CleanEase
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              {profile?.role === 'homeowner' && (
                <>
                  <Link to="/home" className="text-sm font-semibold text-natural-muted hover:text-primary transition-colors">Find Help</Link>
                  <Link to="/history" className="text-sm font-semibold text-natural-muted hover:text-primary transition-colors">My Bookings</Link>
                </>
              )}
              {profile?.role === 'provider' && (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-natural-muted hover:text-primary transition-colors">Jobs</Link>
                  <Link to="/history" className="text-sm font-semibold text-natural-muted hover:text-primary transition-colors">History</Link>
                </>
              )}
              <div className="h-4 w-px bg-natural-border" />
              <Link to="/notifications" className="relative p-2 text-natural-muted hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </Link>
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-natural-text group-hover:text-primary transition-colors">{profile?.displayName?.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest leading-none">View Profile</p>
                </div>
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-natural-border group-hover:border-primary transition-all" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-natural-surface border border-natural-border flex items-center justify-center group-hover:border-primary transition-all">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                )}
              </Link>
              <button onClick={logout} className="text-sm font-semibold text-natural-muted hover:text-red-500 transition-colors cursor-pointer">Sign Out</button>
            </>
          ) : (
            <button 
              onClick={signIn}
              className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 md:hidden"
          >
            {user ? (
              <>
                <Link to="/home" onClick={() => setIsOpen(false)} className="text-lg font-medium p-2">Dashboard</Link>
                <button onClick={() => { logout(); setIsOpen(false); }} className="text-lg font-medium p-2 text-left text-red-500">Sign Out</button>
              </>
            ) : (
              <button 
                onClick={() => { signIn(); setIsOpen(false); }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Sign In with Google
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const PrivateRoute = ({ children, allowNoProfile = false, isAdminRequired = false }: { children: React.ReactNode, allowNoProfile?: boolean, isAdminRequired?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" />;
  if (isAdminRequired && !isAdmin) return <Navigate to="/home" />;
  if (user && !profile && !allowNoProfile) return <Navigate to="/role-selection" />;
  
  return <>{children}</>;
};

const AppContent = () => {
  useNotifications();
  const location = useLocation();
  const [showSetup, setShowSetup] = React.useState(false);

  // If we have fallbacks, isSupabaseConfigured will be true.
  // We only show setup if they explicitly want to see how to move to secrets or if auth fails.
  
  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-bg p-4 text-center">
        <div className="card-natural p-10 max-w-lg shadow-2xl">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-natural-text mb-2">Connect Your Database</h2>
            <p className="text-natural-muted mb-8 leading-relaxed">
              I've applied your keys as a temporary fallback. To make it permanent, add them to your project secrets.
            </p>
            
            <div className="text-left bg-natural-surface p-6 rounded-2xl border border-natural-border mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Secret Names</h3>
              <ul className="text-xs text-natural-text space-y-2 font-medium">
                <li><code>VITE_FIREBASE_PROJECT_ID</code></li>
                <li><code>VITE_FIREBASE_API_KEY</code></li>
              </ul>
            </div>

          <button 
            onClick={() => setShowSetup(false)}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold"
          >
            Go to App
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidKey) {
    console.warn("Google Maps API Key is missing. Maps will be disabled.");
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="gmp_mcp_codeassist_v1_aistudio" version="weekly">
      <div className="min-h-screen bg-natural-bg pt-16 pb-20 md:pb-0">
        <Navbar />
        <React.Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={
                <PageTransition>
                  <LandingPage />
                </PageTransition>
              } />
            <Route path="/role-selection" element={
              <PrivateRoute allowNoProfile>
                 <RoleSelection />
              </PrivateRoute>
            } />
            <Route path="/pro" element={<ProMembership />} />
            <Route path="/home" element={
              <PrivateRoute>
                <HomeownerHome />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <ProviderHome />
              </PrivateRoute>
            } />
            <Route path="/services" element={
              <PrivateRoute>
                <ServiceSelection />
              </PrivateRoute>
            } />
            <Route path="/worker/:id" element={
              <PrivateRoute>
                <WorkerProfile />
              </PrivateRoute>
            } />
            <Route path="/booking/:id" element={
              <PrivateRoute>
                <BookingDetail />
              </PrivateRoute>
            } />
            <Route path="/booking-confirmation/:id" element={
              <PrivateRoute>
                <BookingConfirmation />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/history" element={
              <PrivateRoute>
                <BookingHistory />
              </PrivateRoute>
            } />
            <Route path="/live-tracking/:id" element={
              <PrivateRoute>
                <LiveTracking />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute isAdminRequired>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AnimatePresence>
        </React.Suspense>
        <BottomNav />
        <WhatsAppButton />
      </div>
    </APIProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
