import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserCheck, MapPin, CheckCircle2, ShieldCheck, Zap, Clock } from 'lucide-react';

const AIVideoDemo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-natural-text overflow-hidden flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary rounded-full blur-2xl"
              />
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 relative z-10">
                <Search className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white text-sm font-bold uppercase tracking-[0.3em] mt-8"
            >
              Scanning for Pros...
            </motion.p>
            <div className="flex gap-2 mt-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary/40" />
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-natural-surface rounded-2xl overflow-hidden shadow-inner border border-natural-border">
                    <img 
                      src="https://i.pravatar.cc/150?img=12" 
                      alt="Provider" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-natural-text mb-1">Rajesh Kumar</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex text-secondary">
                      {[...Array(5)].map((_, i) => <Zap key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span className="text-[10px] font-bold text-natural-muted">4.9 (240 task)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-full bg-natural-surface rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-natural-muted">
                  <span>Aadhar Verified</span>
                  <span className="text-emerald-600">Matched 100%</span>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-natural-border flex gap-4">
                 <div className="flex-1 h-12 bg-natural-surface rounded-xl flex items-center justify-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-natural-text">Available Now</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full p-10 flex flex-col"
          >
            <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden">
               {/* Map Grid */}
               <div className="absolute inset-0" 
                    style={{ backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
               {/* Moving Marker */}
               <motion.div 
                 initial={{ x: 50, y: 50 }}
                 animate={{ x: 250, y: 150 }}
                 transition={{ duration: 3.5, ease: "linear" }}
                 className="absolute z-20"
               >
                 <div className="relative">
                   <motion.div 
                     animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                     className="absolute -inset-4 bg-primary/40 rounded-full blur-md"
                   />
                   <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20">
                     <MapPin className="w-5 h-5 text-white" />
                   </div>
                 </div>
               </motion.div>

               {/* Destination */}
               <div className="absolute right-20 top-20">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                 <div className="w-4 h-4 bg-emerald-400 rounded-full absolute inset-0" />
               </div>

               {/* Info Overlay */}
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-natural-surface rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-0.5">Estimated Arrival</div>
                       <div className="text-sm font-bold text-natural-text">4 mins (1.2 km)</div>
                     </div>
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                     On Route
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-32 h-32 bg-emerald-500 rounded-[40px] flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
              </motion.div>
            </div>
            <h4 className="text-white text-2xl font-serif font-bold mt-8 mb-2">Service Completed</h4>
            <p className="text-white/60 text-sm font-medium">Safe payment successful</p>
            
            <div className="flex gap-1 mt-6">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <Zap className="w-5 h-5 text-secondary fill-current" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="absolute bottom-8 flex gap-3">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AIVideoDemo;
