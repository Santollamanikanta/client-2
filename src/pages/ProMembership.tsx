import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, Zap, Star, ArrowRight, IndianRupee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const ProMembership = () => {
  const { signIn, user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinPro = async () => {
    if (!user) {
      signIn();
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPro: true,
        proJoinedAt: new Date().toISOString()
      });
      alert('Welcome to Quick Seva Pro! Your 20% discount is now active.');
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Failed to join Pro. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { title: 'Unlimited Free Visits', desc: 'Pay only for the service, zero visiting charges forever.', icon: <Zap className="w-6 h-6" /> },
    { title: '20% Flat Discount', desc: 'Save on every booking across all categories.', icon: <IndianRupee className="w-6 h-6" /> },
    { title: 'Priority Assignment', desc: 'Get matched with top-rated partners in under 5 minutes.', icon: <Star className="w-6 h-6" /> },
    { title: 'Full Insurance', desc: 'Every Pro task is covered up to ₹10,000 for peace of mind.', icon: <Shield className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-natural-bg pb-24">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-[120px] -z-10" />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-8">
              <Shield className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Exclusive Membership</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-serif font-bold text-natural-text mb-6">Quick Seva <span className="text-primary italic">Pro</span></h1>
            <p className="text-lg text-natural-muted max-w-2xl mx-auto font-medium mb-12">
              Elevate your home management experience with unlimited savings and priority care.
            </p>
          </motion.div>

          <div className="max-w-md mx-auto bg-natural-text p-10 rounded-[40px] shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
              Most Popular
            </div>
            <div className="text-white mb-8 border-b border-white/10 pb-8">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold opacity-60">₹</span>
                <span className="text-6xl font-bold">299</span>
                <span className="text-xl font-bold opacity-60">/mo</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cancel Anytime</p>
            </div>
            
            <ul className="space-y-4 mb-10 text-left">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  {b.title}
                </li>
              ))}
            </ul>

            <button 
              onClick={handleJoinPro}
              disabled={loading || profile?.isPro}
              className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {profile?.isPro ? 'Already a Pro member' : 'Try for ₹299/mo'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Detailed */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-16 text-center">Why join Pro?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white p-10 rounded-[40px] border border-natural-border shadow-soft hover:border-primary/40 transition-all">
              <div className="w-14 h-14 bg-natural-surface rounded-2xl flex items-center justify-center text-primary mb-6">
                {b.icon}
              </div>
              <h4 className="text-lg font-bold text-natural-text mb-2">{b.title}</h4>
              <p className="text-xs text-natural-muted leading-relaxed font-medium">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProMembership;
