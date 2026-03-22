import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_theme');
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app_theme', theme);
    } catch {}
    if (typeof document !== 'undefined') {
      document.body.classList.remove('dark-mode', 'light-mode');
      document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
