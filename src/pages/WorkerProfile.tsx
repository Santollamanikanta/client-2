import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, Review } from '../types';
import { motion } from 'motion/react';
import { Star, MapPin, ShieldCheck, Briefcase, ChevronLeft, Award, User as UserIcon } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const WorkerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'profiles', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const workerData = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          setWorker(workerData);
          
          // Fetch real reviews
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('providerId', '==', id)
          );
          const reviewsSnap = await getDocs(reviewsQuery);
          const docs = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
          docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReviews(docs);
        }
      } catch (err) {
        console.error("Error fetching worker data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkerData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!worker) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-natural-text mb-4">Worker not found</h2>
      <button onClick={() => navigate(-1)} className="text-primary font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-natural-muted hover:text-natural-text transition-colors font-bold uppercase tracking-widest text-xs mb-10 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white p-8 rounded-[40px] border border-natural-border shadow-soft flex flex-col items-center text-center">
            <div className="relative mb-6">
              <img 
                src={worker.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed= Felix'} 
                alt={worker.displayName} 
                className="w-32 h-32 rounded-[40px] border-4 border-natural-surface object-cover shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-white">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
            </div>
            
            <h1 className="text-2xl font-serif font-bold text-natural-text mb-1">{worker.displayName}</h1>
            <div className="flex items-center gap-1.5 text-secondary mb-6 justify-center">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">{worker.rating || 4.9} • Premium Partner</span>
            </div>

            <div className="w-full pt-6 border-t border-natural-surface space-y-4">
              <div className="flex items-center gap-3 text-natural-muted">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Hyderabad Central</span>
              </div>
              <div className="flex items-center gap-3 text-natural-muted">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Pro Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Area */}
        <div className="md:col-span-2 space-y-12">
          {/* About & Skills */}
          <section className="bg-white p-10 rounded-[40px] border border-natural-border shadow-soft">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Expertise & Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {(worker.skills || ['General Cleaning', 'Home Maintenance', 'Safety Audit']).map((skill, i) => (
                <span key={i} className="px-5 py-2.5 bg-natural-surface border border-natural-border rounded-xl text-xs font-bold text-natural-text">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-8 text-sm text-natural-muted leading-relaxed font-medium">
              Professional with over 3 years of experience in high-end residential services. Specializing in detail-oriented tasks and safety-first approaches. Committed to providing premium experiences for every home.
            </p>
          </section>

          {/* Experience Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-primary p-8 rounded-[40px] text-white text-center">
              <div className="text-3xl font-serif font-bold mb-1">150+</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Jobs Completed</div>
            </div>
            <div className="bg-natural-text p-8 rounded-[40px] text-white text-center">
              <div className="text-3xl font-serif font-bold mb-1">98%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Success Rate</div>
            </div>
          </div>

          {/* Recent Reviews */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-natural-muted mb-8">Community Feedback</h2>
            <div className="space-y-6">
              {reviews.length > 0 ? reviews.map(review => (
                <div key={review.id} className="bg-white p-8 rounded-3xl border border-natural-border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-natural-surface rounded-full flex items-center justify-center font-bold text-[10px] text-primary">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-natural-text">Verified Customer</span>
                    </div>
                    <div className="flex gap-1 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-xs text-natural-muted font-medium italic mb-2">"{review.comment}"</p>}
                  <span className="text-[8px] font-bold uppercase tracking-widest text-natural-muted opacity-60">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) : (
                <div className="bg-natural-surface/50 p-8 rounded-3xl border border-dashed border-natural-border text-center">
                  <p className="text-xs text-natural-muted font-bold uppercase tracking-widest">No reviews yet</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
