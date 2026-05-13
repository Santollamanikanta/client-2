import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-red-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-8xl font-serif font-black text-natural-text mb-4">Oops!</h1>
          <h2 className="text-2xl font-serif font-bold text-natural-text mb-6">Service or Request Not Found</h2>
          <p className="text-natural-muted font-medium leading-relaxed mb-12">
            The service you're looking for might have been taken by another partner, or the link has moved. Let's get you back to your workspace.
          </p>
          
          <div className="flex flex-col gap-4">
            <Link 
              to="/"
              className="px-10 py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="px-10 py-5 bg-white border border-natural-border text-natural-text rounded-2xl font-bold hover:bg-natural-surface transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
