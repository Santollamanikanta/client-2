import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Clock, IndianRupee, Star, ChevronRight, CheckCircle2, Play, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

import AIVideoDemo from '../components/AIVideoDemo';

import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const LandingPage = () => {
  const { signIn, user, profile } = useAuth();

  const services = [
    { name: 'Deep Cleaning', icon: '🧹', tag: 'Top Rated' },
    { name: 'Electric Repairs', icon: '⚡', tag: 'Expert' },
    { name: 'Plumbing Works', icon: '🔧', tag: 'Fast' },
    { name: 'Cooking & Tiffin', icon: '🍳', tag: 'Premium' },
  ];

  return (
    <div className="flex flex-col bg-natural-bg">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-natural-surface rounded-l-[120px] -z-10 translate-x-20" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-natural-border rounded-full shadow-sm mb-8">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">Available across Hyderabad</span>
            </div>
            
            <h1 className="text-7xl lg:text-8xl font-serif text-natural-text leading-[0.9] mb-8 font-bold tracking-tighter">
              The <span className="text-primary">CleanEase</span><br />
              Household<br />
              Standard.
            </h1>
            
            <p className="text-lg text-natural-muted mb-12 max-w-lg leading-relaxed font-medium">
              We've refined domestic help into a premium, transparent experience. Verified experts, upfront pricing, and real-time tracking for every service.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              {user ? (
                <div className="flex gap-4">
                  <Link 
                    to={profile?.role === 'provider' ? '/dashboard' : '/home'}
                    className="px-10 py-5 bg-natural-text text-white rounded-2xl font-bold shadow-2xl shadow-natural-text/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {profile?.role === 'provider' ? 'Worker Dashboard' : 'Book Now'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  {!profile?.role && (
                    <Link 
                      to="/role-selection"
                      className="px-10 py-5 bg-white text-natural-text border border-natural-border rounded-2xl font-bold shadow-soft hover:bg-natural-surface transition-all flex items-center gap-3"
                    >
                      Choose Role
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={signIn}
                    className="px-10 py-5 bg-natural-text text-white rounded-2xl font-bold shadow-2xl shadow-natural-text/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-14 h-14 bg-white border border-natural-border rounded-full flex items-center justify-center group-hover:bg-natural-surface transition-all shadow-sm">
                  <Play className="w-5 h-5 text-primary fill-current ml-1" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-natural-text">Watch How it Works</span>
              </button>
            </div>

            <div className="mt-16 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-natural-surface flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://i.pravatar.cc/100?img=${i+10}`} 
                      alt="User" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-1 text-secondary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="text-[10px] font-bold text-natural-muted uppercase tracking-widest mt-1">Nature of the person: Verified & Kind</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 relative">
            <div className="space-y-6 pt-12">
              {services.slice(0, 2).map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="card-natural p-8 hover:border-primary/40 transition-all group flex flex-col items-center text-center gap-4"
                >
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-2">{s.tag}</span>
                  <div className="w-20 h-20 bg-natural-surface rounded-[24px] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h4 className="font-bold text-natural-text text-lg">{s.name}</h4>
                </motion.div>
              ))}
            </div>
            <div className="space-y-6">
              {services.slice(2, 4).map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="card-natural p-8 hover:border-secondary/40 transition-all group flex flex-col items-center text-center gap-4"
                >
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">{s.tag}</span>
                  <div className="w-20 h-20 bg-natural-surface rounded-[24px] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h4 className="font-bold text-natural-text text-lg">{s.name}</h4>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Moving Trust Bar */}
      <div className="py-12 bg-white border-y border-natural-border overflow-hidden">
        <motion.div 
          animate={{ x: [-1500, 0] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          className="flex whitespace-nowrap gap-24 grayscale opacity-40 items-center"
        >
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="text-2xl font-serif font-black italic tracking-tighter uppercase shrink-0">Verified Homes</span>
              <span className="text-2xl font-serif font-black italic tracking-tighter uppercase shrink-0">SafePay</span>
              <span className="text-2xl font-serif font-black italic tracking-tighter uppercase shrink-0 text-primary opacity-100 grayscale-0">Hyderabad Hub</span>
              <span className="text-2xl font-serif font-black italic tracking-tighter uppercase shrink-0">ProTrack</span>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 bg-natural-surface/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-4">The Process</h2>
            <h3 className="text-5xl font-serif font-bold text-natural-text">How CleanEase Works</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-[60px] blur-2xl group-hover:bg-primary/10 transition-all" />
              <div className="relative aspect-video bg-natural-text rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                <AIVideoDemo />
                <div className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Visualization Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {[
                { 
                  title: 'Select Service', 
                  desc: 'Choose from our range of verified home services including specialized dusting, child care, and expert care taking.',
                  icon: '01'
                },
                { 
                  title: 'Instant Matching', 
                  desc: 'Our AI algorithm matches you with the highest-rated professional in your vicinity within 15 minutes.',
                  icon: '02'
                },
                { 
                  title: 'Real-time Tracking', 
                  desc: 'Track your service partner live as they navigate to your location with precision routing.',
                  icon: '03'
                },
                { 
                  title: 'Quality Assured', 
                  desc: 'Pay only after satisfaction. Every service is protected by our household guarantee.',
                  icon: '04'
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 group">
                  <div className="text-4xl font-serif font-black text-primary/20 group-hover:text-primary/100 transition-colors">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-natural-text mb-2">{step.title}</h4>
                    <p className="text-natural-muted font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value prop Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
               <div className="aspect-[4/5] bg-natural-surface rounded-[60px] overflow-hidden relative">
                 <img 
                   src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=1000" 
                   alt="Professional Household Expert" 
                   referrerPolicy="no-referrer"
                   className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-natural-text/40 to-transparent" />
                 <div className="absolute bottom-10 left-10">
                   <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
                     Verified Pro
                   </div>
                 </div>
               </div>
               
               <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-[40px] shadow-2xl border border-natural-border max-w-[300px] z-20">
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                     <Shield className="w-6 h-6" />
                   </div>
                   <div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Safety First</div>
                     <div className="text-xs font-bold text-natural-text">Pro Verification</div>
                   </div>
                 </div>
                 <p className="text-[10px] text-natural-muted font-medium leading-relaxed">
                   Every provider completes a rigorous 4-step verification including Aadhar validation and nature of persons.
                 </p>
               </div>

               {/* Decorative floating element */}
               <div className="absolute top-10 -left-10 w-24 h-24 bg-secondary/10 rounded-[30px] -z-10 animate-spin-slow" />
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6">Expertise & Safety</h2>
              <h3 className="text-5xl font-serif font-bold text-natural-text leading-tight mb-8">Household help, reimagined for you.</h3>
              <div className="space-y-10">
                {[
                  { title: 'Identity Verification', desc: 'Secure Aadhar and criminal record checks for every professional.', img: 'https://images.unsplash.com/photo-1633613286991-611fe299c4be?auto=format&fit=crop&q=80&w=200' },
                  { title: 'Quality Assurance', desc: 'Continuous performance monitoring based on community feedback.', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=200' },
                  { title: 'Secure Handling', desc: 'Digital payments and full insurance coverage for every task.', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=200' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group items-start">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-natural-border shadow-sm group-hover:border-primary/40 transition-all">
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-natural-text mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-sm text-natural-muted leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hyderabad Coverage Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="mt-32 p-8 md:p-16 bg-primary/5 rounded-[60px] border border-primary/10 overflow-hidden relative"
          >
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Now Live in Hyderabad
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-natural-text mb-6">
                  Complete Service Coverage Across the City
                </h2>
                <p className="text-natural-muted font-medium mb-8 leading-relaxed max-w-md">
                  From Jubilee Hills to Gachibowli, we bring premium home services to your doorstep with guaranteed professional matching.
                </p>
                <div className="flex flex-wrap gap-4">
                   <Link to="/role-selection" className="btn-primary inline-flex items-center gap-3 px-8 group">
                      Explore Services
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-white rounded-[40px] shadow-2xl p-4 rotate-3 border border-natural-border relative z-10">
                  <div className="w-full h-full bg-natural-surface rounded-[32px] flex items-center justify-center overflow-hidden relative">
                     <Map
                        defaultCenter={{ lat: 17.4065, lng: 78.4772 }}
                        defaultZoom={11}
                        gestureHandling={'none'}
                        disableDefaultUI={true}
                        mapId="LANDING_PREVIEW_MAP"
                        className="w-full h-full"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                     >
                        <AdvancedMarker position={{ lat: 17.4399, lng: 78.4484 }}>
                           <div className="w-8 h-8 bg-white rounded-xl shadow-lg border-2 border-primary flex items-center justify-center animate-bounce">
                              <MapPin className="w-4 h-4 text-primary" />
                           </div>
                        </AdvancedMarker>
                        <AdvancedMarker position={{ lat: 17.4447, lng: 78.3789 }}>
                           <div className="w-6 h-6 bg-emerald-500 rounded-lg shadow-lg flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                           </div>
                        </AdvancedMarker>
                     </Map>
                     <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
                     <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-natural-border shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold text-natural-text uppercase tracking-widest">Active Tracking</span>
                     </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-natural-border -rotate-6 hidden md:block z-20">
                   <p className="text-xs font-bold text-primary mb-1">Response Time</p>
                   <p className="text-2xl font-serif font-bold text-natural-text">~45 Mins</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto bg-primary py-24 rounded-[80px] text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
          <h2 className="text-5xl lg:text-6xl font-serif text-white font-bold mb-8 relative z-10">Ready for a better home?</h2>
          <button 
            onClick={signIn}
            className="px-12 py-6 bg-white text-primary rounded-3xl font-bold text-lg shadow-2xl hover:scale-105 transition-all relative z-10 cursor-pointer"
          >
            Get Help Instantly
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;

