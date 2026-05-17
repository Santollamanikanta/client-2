import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { User, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const { setRole, profile } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (profile?.role) {
      navigate(profile.role === 'provider' ? '/dashboard' : '/home');
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How will you use CleanEase?</h1>
          <p className="text-gray-600">Choose your path to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <motion.button
            whileHover={{ y: -8 }}
            onClick={() => setRole('homeowner')}
            className="bg-white p-12 rounded-[32px] border border-natural-border hover:border-primary transition-all shadow-xl shadow-natural-muted/5 group cursor-pointer"
          >
            <div className="w-20 h-20 bg-natural-surface rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <User className="text-primary w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-natural-text mb-4 flex items-center gap-2">
              I need help
              <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </h2>
            <p className="text-natural-muted leading-relaxed">
              Book verified local experts for any household task. Fast, safe and reliable services at your fingertips.
            </p>
          </motion.button>

          <motion.button
            whileHover={{ y: -8 }}
            onClick={() => setRole('provider')}
            className="bg-white p-12 rounded-[32px] border border-natural-border hover:border-secondary transition-all shadow-xl shadow-natural-muted/5 group cursor-pointer"
          >
            <div className="w-20 h-20 bg-natural-surface rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Briefcase className="text-secondary w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-natural-text mb-4 flex items-center gap-2">
              I want to work
              <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </h2>
            <p className="text-natural-muted leading-relaxed">
              Join our platform to find jobs near you, manage your schedule, and grow your earnings.
            </p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
