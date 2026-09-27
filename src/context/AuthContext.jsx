import React, { createContext, useContext, useState, useEffect } from 'react';
import { ID } from 'appwrite';
import { account, databases, isConfigured } from '../services/appwriteClient';
import { APP_CONFIG } from '../config/appConfig';
import { USER_ROLES } from '../constants/categories';

const AuthContext = createContext(null);
const LOCAL_USER_KEY = 'newsaxis_auth_user';
const PROFILES_COLLECTION = APP_CONFIG.appwrite.collections.profiles;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // pendingAuth holds state while an OTP challenge is in flight
  // { userId, email, name, role, mode: 'signup' | 'login' }
  const [pendingAuth, setPendingAuth] = useState(null);

  useEffect(() => {
    async function checkSession() {
      // Never let a failed/misconfigured Appwrite call crash the app render —
      // always fall back to "logged out" instead of throwing.
      try {
        if (isConfigured) {
          try {
            const currentAccount = await account.get();
            const profile = await loadProfile(currentAccount.$id, currentAccount);
            setUser(profile);
          } catch {
            setUser(null);
          }
        } else {
          const saved = localStorage.getItem(LOCAL_USER_KEY);
          if (saved) setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Session check failed, continuing as logged out:', err?.message || err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  async function loadProfile(userId, accountDoc) {
    let profile = null;
    try {
      profile = await databases.getDocument(
        APP_CONFIG.appwrite.databaseId,
        PROFILES_COLLECTION || 'profiles',
        userId
      );
    } catch {
      // Profile doc missing (e.g. first login) — reconstruct minimal profile
      profile = {
        userId,
        name: accountDoc?.name || 'User',
        email: accountDoc?.email || '',
        role: USER_ROLES.READER
      };
    }
    const u = {
      id: userId,
      email: profile.email || accountDoc?.email,
      name: profile.name || accountDoc?.name,
      username: (profile.name || accountDoc?.name || 'user').toLowerCase().replace(/\s+/g, ''),
      role: profile.role || USER_ROLES.READER
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return u;
  }

  function validateEmail(email) {
    return EMAIL_RE.test(String(email || '').trim());
  }

  /**
   * Step 1 of signup: validate input, check for an existing account with this
   * email, create the Appwrite account (email+password, securely hashed by
   * Appwrite — never stored in plaintext by our code), write a profile
   * document, then send a 6-digit email OTP. Nothing is "logged in" yet —
   * verifyOtp() must succeed first.
   */
  const startSignup = async ({ name, email, password, role }) => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!name?.trim()) throw new Error('Please enter your name.');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!isConfigured) {
      throw new Error('Appwrite is not configured. Cannot create a real account in this environment.');
    }

    const userId = ID.unique();
    try {
      await account.create(userId, email.trim(), password, name.trim());
    } catch (err) {
      if (err?.code === 409 || /already exists/i.test(err?.message || '')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw err;
    }

    // Persist profile (role, name) keyed by the new userId
    try {
      await databases.createDocument(
        APP_CONFIG.appwrite.databaseId,
        PROFILES_COLLECTION,
        userId,
        {
          userId,
          name: name.trim(),
          username: name.trim().toLowerCase().replace(/\s+/g, ''),
          email: email.trim(),
          role: role || USER_ROLES.READER
        }
      );
    } catch (err) {
      console.warn('Profile document creation failed (continuing):', err.message);
    }

    // Send OTP to the registered email
    const token = await account.createEmailToken(userId, email.trim());
    setPendingAuth({ userId: token.userId, email: email.trim(), name: name.trim(), role, mode: 'signup' });
    return { userId: token.userId };
  };

  /**
   * Step 1 of login: verify the email belongs to an existing account
   * (Appwrite errors if not) and send a fresh OTP.
   */
  const startLogin = async (email) => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!isConfigured) {
      throw new Error('Appwrite is not configured. Cannot authenticate in this environment.');
    }
    // createEmailToken both identifies the user by email and sends the OTP.
    // Appwrite returns a generic error for unknown emails to avoid user enumeration,
    // but will still fail cleanly for the login flow.
    const token = await account.createEmailToken(ID.unique(), email.trim());
    setPendingAuth({ userId: token.userId, email: email.trim(), mode: 'login' });
    return { userId: token.userId };
  };

  /**
   * Step 2: verify the 6-digit OTP and establish the session.
   */
  const verifyOtp = async (code) => {
    if (!pendingAuth) throw new Error('No pending verification. Please start again.');
    if (!/^\d{6}$/.test(code || '')) throw new Error('Enter the 6-digit code sent to your email.');

    await account.createSession(pendingAuth.userId, code);
    const currentAccount = await account.get();
    const profile = await loadProfile(currentAccount.$id, currentAccount);
    setUser(profile);
    setPendingAuth(null);
    return profile;
  };

  const resendOtp = async () => {
    if (!pendingAuth) throw new Error('No pending verification.');
    const token = await account.createEmailToken(pendingAuth.userId, pendingAuth.email);
    setPendingAuth(prev => ({ ...prev, userId: token.userId }));
  };

  const cancelPendingAuth = () => setPendingAuth(null);

  const logout = async () => {
    if (isConfigured) {
      try {
        await account.deleteSession('current');
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const switchRole = async (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    if (isConfigured) {
      try {
        await databases.updateDocument(
          APP_CONFIG.appwrite.databaseId,
          PROFILES_COLLECTION,
          user.id,
          { role: newRole }
        );
      } catch (e) {
        console.warn('Role update sync failed', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      pendingAuth,
      startSignup,
      startLogin,
      verifyOtp,
      resendOtp,
      cancelPendingAuth,
      logout,
      switchRole,
      isAuthenticated: Boolean(user),
      isAppwriteConfigured: isConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
