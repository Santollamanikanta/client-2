import React from 'react';
import { Mail, Phone } from 'lucide-react';

const SupportSection = () => {
  return (
    <div className="bg-natural-text text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden mt-12 mb-12">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
      <div className="relative z-10">
        <h3 className="text-2xl font-serif font-bold mb-4">Need Help?</h3>
        <p className="text-gray-400 text-sm mb-8 font-medium leading-relaxed max-w-md">
          Our customer support is available 24/7 for any queries regarding bookings or your profile.
        </p>
        <div className="flex flex-wrap gap-4">
          <a 
            href="mailto:support@quickseva.com"
            className="px-6 py-4 bg-primary text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
          <a 
            href="tel:+919502337968" 
            className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            +91 95023 37968
          </a>
          <a 
            href="tel:+918790934547" 
            className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            +91 87909 34547
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
