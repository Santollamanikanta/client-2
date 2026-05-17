import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Per requirement: Secure login for exactly 2 admin accounts
    // The check for specific emails can happen here or via Firestore rules
    // Admin accounts mentioned: manikanta10516@gmail.com, admin@cleanease.in
    
    try {
      if (email !== 'manikanta10516@gmail.com' && email !== 'admin@cleanease.in') {
        throw new Error('Access denied. This account is not an authorized administrator.');
      }
      
      await signInWithEmail(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-natural-surface flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-natural-border"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-natural-text mb-2">Admin Portal</h1>
          <p className="text-natural-muted font-medium italic">CleanEase – Hyderabad Home Services</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted ml-1">Admin Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                placeholder="admin@cleanease.in"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-natural-muted ml-1">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Authorize Session
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-natural-muted font-medium italic">
          Restricted area. Unauthorized access attempts are logged.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
