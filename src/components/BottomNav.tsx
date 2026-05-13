import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Briefcase, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const { user, profile } = useAuth();

  if (!user || !profile) return null;

  const isHomeowner = profile.role === 'homeowner';

  const links = isHomeowner ? [
    { to: '/home', icon: Home, label: 'Explore' },
    { to: '/history', icon: History, label: 'Bookings' },
    { to: '/profile', icon: User, label: 'Profile' },
  ] : [
    { to: '/dashboard', icon: Briefcase, label: 'Jobs' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-natural-border px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-all duration-300 px-4 py-2 rounded-2xl",
            isActive ? "text-primary bg-primary/5" : "text-natural-muted"
          )}
        >
          <link.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
