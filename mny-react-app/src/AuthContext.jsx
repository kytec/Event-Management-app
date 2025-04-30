import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper to reload the user from Firebase Auth
  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Auth functions
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // Optionally, expose updateProfile for convenience
  const updateUserProfile = (profile) => updateProfile(auth.currentUser, profile);

  const value = {
    user,
    db,
    isAuthenticated,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    reloadUser, // Expose reloadUser for use after profile updates
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 