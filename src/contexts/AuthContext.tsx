import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  "manikanta10516@gmail.com",
  "rockks372@gmail.com",
  "admin@cleanease.in"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    
    // Safety timeout: stop loading after 2s if nothing has happened
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      console.warn("Auth loading timed out. Proceeding anyway.");
    }, 2000);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(safetyTimeout);
      setUser(currentUser);
      
      // Clear existing profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Optimistic UI: Use cache first for near-instant transitions
        const cached = localStorage.getItem(`profile_${currentUser.uid}`);
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch (e) {
            console.error("Cache error:", e);
          }
        }

        setLoading(true);
        const docRef = doc(db, 'profiles', currentUser.uid);
        
        // Use onSnapshot for better resilience and real-time updates
        unsubscribeProfile = onSnapshot(docRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              setProfile(profileData);
              localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Profile listener error:", err);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const [signingIn, setSigningIn] = useState(false);

  const signIn = async () => {
    if (signingIn) {
      console.warn('Sign-in already in progress...');
      return;
    }
    
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Ensure popup is triggered by the user action
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        alert("Google sign-in is not enabled. Please enable it in the Firebase Console under Authentication -> Sign-in method.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Popup interaction was cancelled by a subsequent request.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the login popup.');
      }
      // Re-throw if it's not a common "ignore" error
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        throw error;
      }
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setRole = async (role: UserRole) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      role,
      isOnline: role === 'provider' ? true : undefined,
      skills: role === 'provider' ? [] : undefined,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'profiles', user.uid), newProfile);
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, logout, setRole, isAdmin, isConfigured: isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
