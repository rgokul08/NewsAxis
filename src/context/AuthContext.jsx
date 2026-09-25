import React, { createContext, useContext, useState, useEffect } from 'react';
import { account, isConfigured } from '../services/appwriteClient';
import { USER_ROLES } from '../constants/categories';

const AuthContext = createContext(null);
const LOCAL_USER_KEY = 'newsaxis_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function checkSession() {
      if (isConfigured) {
        try {
          const currentAccount = await account.get();
          setUser({
            id: currentAccount.$id,
            email: currentAccount.email,
            name: currentAccount.name,
            username: currentAccount.name.toLowerCase().replace(/\s+/g, ''),
            role: USER_ROLES.AUTHOR
          });
        } catch {
          loadLocalUser();
        }
      } else {
        loadLocalUser();
      }
      setLoading(false);
    }

    function loadLocalUser() {
      try {
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          // Default state: unauthenticated visitor (no demo auto-login)
          setUser(null);
        }
      } catch (err) {
        console.warn('Local user loading error', err);
        setUser(null);
      }
    }


    checkSession();
  }, []);

  const login = async (email, password) => {
    if (isConfigured) {
      try {
        // Clear any lingering session before creating a new one to avoid 401/409 session conflicts
        await account.deleteSession('current').catch(() => null);
      } catch (e) {
        // Ignore session clearing errors
      }
      await account.createEmailPasswordSession(email, password);
      const acc = await account.get();
      const u = {
        id: acc.$id,
        email: acc.email,
        name: acc.name || email.split('@')[0],
        username: (acc.name || email.split('@')[0]).toLowerCase().replace(/\s+/g, ''),
        role: USER_ROLES.AUTHOR
      };
      setUser(u);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
      return u;
    } else {
      // Local session for development & testing
      const u = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        username: email.split('@')[0].toLowerCase(),
        role: email.includes('admin') ? USER_ROLES.ADMIN : USER_ROLES.AUTHOR,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
      };
      setUser(u);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
      return u;
    }
  };

  const signup = async (email, password, name, role = USER_ROLES.READER) => {
    if (isConfigured) {
      await account.create('unique()', email, password, name);
      const u = await login(email, password);
      // Persist chosen role
      const userWithRole = { ...u, role };
      setUser(userWithRole);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userWithRole));
      return userWithRole;
    } else {
      const u = {
        id: `usr_${Date.now()}`,
        email,
        name,
        username: name.toLowerCase().replace(/\s+/g, ''),
        role: role || USER_ROLES.READER,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
      };
      setUser(u);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
      return u;
    }
  };

  const updateUserRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const quickDemoLogin = (role = 'author') => {
    const u = {
      id: `usr_${Date.now()}`,
      email: role === 'admin' ? 'director@newsaxis.media' : (role === 'author' ? 'contributor@newsaxis.media' : 'reader@newsaxis.media'),
      name: role === 'admin' ? 'Editorial Director' : (role === 'author' ? 'Staff Writer' : 'Daily Reader'),
      username: role === 'admin' ? 'director' : (role === 'author' ? 'staff_writer' : 'reader'),
      role: role === 'admin' ? USER_ROLES.ADMIN : (role === 'author' ? USER_ROLES.AUTHOR : USER_ROLES.READER),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    };
    setUser(u);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return u;
  };

  const fallbackGoogleLogin = () => {
    const u = {
      id: `google_${Date.now()}`,
      email: 'reader@gmail.com',
      name: 'Google Reader',
      username: 'googlereader',
      role: USER_ROLES.AUTHOR,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      provider: 'google'
    };
    setUser(u);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    return u;
  };

  const loginWithGoogle = async () => {
    if (isConfigured) {
      try {
        await account.createOAuth2Session(
          'google',
          `${window.location.origin}/`,
          `${window.location.origin}/login`
        );
      } catch (err) {
        console.warn('Appwrite Google OAuth failed, using local Google session', err);
        return fallbackGoogleLogin();
      }
    } else {
      return fallbackGoogleLogin();
    }
  };

  const logout = async () => {
    if (isConfigured) {
      try {
        await account.deleteSession('current');
      } catch (e) {
        console.warn('Appwrite logout session deletion', e);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      loginWithGoogle, 
      quickDemoLogin, 
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
