import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'newsaxis_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);

    // Dynamic Favicon switching for Light & Dark mode
    const faviconHref = theme === 'dark' ? '/dark1.jpeg' : '/light.jpeg';
    let faviconLink = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = faviconHref;
    faviconLink.type = 'image/jpeg';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/dark1.jpeg' : '/light.jpeg';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, logoSrc }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
