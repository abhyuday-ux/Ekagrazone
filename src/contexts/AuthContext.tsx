
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@root/services/firebase';
import { dbService } from '@root/services/db';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isGuest: boolean;
  hasPremium: boolean;
  signInWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isGuest: false,
  hasPremium: false,
  signInWithGoogle: async () => {},
  signupWithEmail: async () => {},
  loginWithEmail: async () => {},
  continueAsGuest: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  const checkSubscriptionStatus = async (user: User) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists() && snapshot.data().hasPremium) {
        setHasPremium(true);
      } else {
        setHasPremium(false);
      }
    } catch (e) {
      console.error("Error checking premium status", e);
      setHasPremium(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        setIsGuest(user.isAnonymous);
        dbService.setUserId(user.uid);
        await checkSubscriptionStatus(user);
        
        try {
            // Check if we were in guest mode previously (legacy local-only guest)
            const wasGuest = localStorage.getItem('ekagrazone_guest_mode') === 'true';
            
            if (wasGuest && !user.isAnonymous) {
                // If coming from guest mode, we TRUST the local data and want to merge it up
                console.log("Merging Guest Data to Cloud...");
                await dbService.syncLocalToCloud();
                localStorage.removeItem('ekagrazone_guest_mode');
            } else {
                // If just logging in normally, we TRUST THE CLOUD.
                console.log("Standard Login - Prioritizing Cloud Data");
            }
            
            // Start listening for real-time updates from cloud
            dbService.startRealtimeSync();
            
        } catch (e) {
            console.error("Auto-sync failed on login", e);
        }
      } else {
        // Fallback: Check for local guest mode if no Firebase user
        const guestPref = localStorage.getItem('ekagrazone_guest_mode');
        setIsGuest(guestPref === 'true');

        dbService.setUserId(null);
        dbService.stopRealtimeSync();
        setHasPremium(false);
      }
      
      setLoading(false);
    });

    return () => {
        unsubscribe();
        dbService.stopRealtimeSync();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (currentUser && currentUser.isAnonymous) {
        // Link Guest account to Google so XP isn't lost
        await linkWithPopup(currentUser, googleProvider);
        // Refresh premium status after link/upgrade
        await checkSubscriptionStatus(auth.currentUser!);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
      await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithEmail = async (email: string, pass: string) => {
      await signInWithEmailAndPassword(auth, email, pass);
  };

  const continueAsGuest = async () => {
      // Purely local guest mode - No Firebase interaction
      setIsGuest(true);
      localStorage.setItem('ekagrazone_guest_mode', 'true');
      dbService.setUserId(null);
  };

  const logout = async () => {
    try {
      dbService.stopRealtimeSync();
      await signOut(auth);
      setIsGuest(false);
      setHasPremium(false);
      localStorage.removeItem('ekagrazone_guest_mode');
      dbService.setUserId(null);
      window.location.reload(); 
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isGuest, hasPremium, signInWithGoogle, signupWithEmail, loginWithEmail, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
