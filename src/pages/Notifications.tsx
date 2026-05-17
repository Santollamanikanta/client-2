import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, ChevronRight, MailOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'alert' | 'message';
  read: boolean;
  createdAt: string;
  userId: string;
  link?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50) // Limit a bit higher to sort in memory
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && loading) {
         setNotifications([
          { id: 'welcome', title: 'Welcome to CleanEase', body: 'Start booking verified professionals today!', type: 'success', read: false, createdAt: new Date().toISOString(), userId: user.uid }
        ]);
      } else {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
        docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error("Notifications subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((d) => {
        batch.update(doc(db, 'notifications', d.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" />;
      case 'message': return <MessageSquare className="text-blue-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      default: return <Bell className="text-primary" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-natural-text">Notifications</h1>
            <p className="text-xs font-bold text-natural-muted uppercase tracking-widest mt-1">Stay updated with your services</p>
          </div>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllRead}
            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-3xl border transition-all ${
                notif.read ? 'bg-white border-natural-border opacity-70' : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'
              }`}
            >
              <div className="flex gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.read ? 'bg-natural-surface' : 'bg-white shadow-sm'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-natural-text transition-colors ${notif.read ? '' : 'text-primary'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-bold text-natural-muted opacity-60">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-natural-muted font-medium leading-relaxed mb-4">
                    {notif.body}
                  </p>
                  <div className="flex items-center justify-between">
                    {notif.link ? (
                      <Link 
                        to={notif.link} 
                        onClick={() => markAsRead(notif.id)}
                        className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        Action Required <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : <span></span>}
                    {!notif.read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 px-3 bg-white border border-natural-border rounded-lg text-[9px] font-bold text-natural-muted hover:bg-natural-surface transition-colors uppercase tracking-tight"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && !loading && (
          <div className="text-center py-24 bg-white rounded-[40px] border border-natural-border border-dashed">
            <MailOpen className="w-16 h-16 text-natural-muted/20 mx-auto mb-6" />
            <p className="text-natural-muted font-bold text-xl mb-2">Inbox is clear</p>
            <p className="text-natural-muted/60 text-sm">We'll let you know when something happens.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
