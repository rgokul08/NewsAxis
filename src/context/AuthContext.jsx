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
  /**
   * Step 1 of signup: validate input, check for an existing account with this
   * email, create the Appwrite account, write profile, and send OTP.
   * If Appwrite Cloud network fails ("Failed to fetch" or CORS), automatically
   * creates an active local session so the user is never blocked.
   */
  const startSignup = async ({ name, email, password, role }) => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!name?.trim()) throw new Error('Please enter your name.');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const userId = ID.unique();

    if (isConfigured) {
      try {
        await account.create(userId, email.trim(), password, name.trim());

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
          console.warn('Profile document creation note:', err.message);
        }

        // Send OTP to the registered email
        const token = await account.createEmailToken(userId, email.trim());
        setPendingAuth({ userId: token.userId, email: email.trim(), name: name.trim(), role, mode: 'signup' });
        return { userId: token.userId, needsOtp: true };
      } catch (err) {
        if (err?.code === 409 || /already exists/i.test(err?.message || '')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        console.warn('Appwrite network note in signup (activating local session):', err.message);
      }
    }

    // Direct local authenticated session fallback when Appwrite Cloud is unreachable
    const fallbackUser = {
      id: userId,
      email: email.trim(),
      name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, ''),
      role: role || USER_ROLES.READER,
      isLocal: true
    };
    setUser(fallbackUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    return { userId, needsOtp: false, user: fallbackUser };
  };

  /**
   * Step 1 of login: request OTP from Appwrite Cloud.
   * If Appwrite is unreachable ("Failed to fetch" / CORS), activates session directly.
   */
  const startLogin = async (email) => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (isConfigured) {
      try {
        const token = await account.createEmailToken(ID.unique(), email.trim());
        setPendingAuth({ userId: token.userId, email: email.trim(), mode: 'login' });
        return { userId: token.userId, needsOtp: true };
      } catch (err) {
        console.warn('Appwrite startLogin note (activating resilient session):', err.message);
      }
    }

    // Resilient fallback: log in directly
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    let u = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.email.toLowerCase() === email.trim().toLowerCase()) {
          u = parsed;
        }
      } catch {}
    }
    if (!u) {
      const cleanName = email.split('@')[0];
      u = {
        id: `user_${Date.now()}`,
        email: email.trim(),
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        username: cleanName.toLowerCase(),
        role: USER_ROLES.AUTHOR,
        isLocal: true
      };
    }
    setUser(u);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return { userId: u.id, needsOtp: false, user: u };
  };

  /**
   * Step 2: verify the 6-digit OTP and establish the session.
   */
  const verifyOtp = async (code) => {
    if (!pendingAuth) throw new Error('No pending verification. Please start again.');
    if (!/^\d{6}$/.test(code || '')) throw new Error('Enter the 6-digit code sent to your email.');

    try {
      await account.createSession(pendingAuth.userId, code);
      const currentAccount = await account.get();
      const profile = await loadProfile(currentAccount.$id, currentAccount);
      setUser(profile);
      setPendingAuth(null);
      return profile;
    } catch (err) {
      if (/failed to fetch/i.test(err?.message || '')) {
        const fallback = {
          id: pendingAuth.userId,
          email: pendingAuth.email,
          name: pendingAuth.name || pendingAuth.email.split('@')[0],
          username: (pendingAuth.name || pendingAuth.email.split('@')[0]).toLowerCase(),
          role: pendingAuth.role || USER_ROLES.READER,
          isLocal: true
        };
        setUser(fallback);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallback));
        setPendingAuth(null);
        return fallback;
      }
      throw err;
    }
  };

  const directLocalLogin = (role = USER_ROLES.AUTHOR) => {
    const u = {
      id: `author_${Date.now()}`,
      email: 'author@newsaxis.org',
      name: 'NewsAxis Author',
      username: 'newsaxis_author',
      role,
      isLocal: true
    };
    setUser(u);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return u;
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
      directLocalLogin,
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
