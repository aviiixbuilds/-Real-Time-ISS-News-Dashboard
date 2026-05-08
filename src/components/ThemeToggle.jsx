import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    toast(`Switched to ${newTheme} mode`, {
      icon: newTheme === 'light' ? '☀️' : '🌙',
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-navy-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-navy-600 transition-all text-sm font-semibold shadow-sm"
    >
      {theme === 'light' ? (
        <>
          <Moon size={16} /> Switch to Dark
        </>
      ) : (
        <>
          <Sun size={16} /> Switch to Light
        </>
      )}
    </button>
  );
}
