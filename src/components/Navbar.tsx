import React, { useState, useEffect } from 'react';
import { Sun, Moon, User as UserIcon, Bell, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Notification } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHscSscOpen, setIsHscSscOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', 'in', [user.uid, 'admin']),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    });
    return () => unsubscribe();
  }, [user]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Admission', path: '/admission' },
    { name: 'Updates', path: '/updates' },
  ];

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2">
            {/* SVG Logo — golden S with book style */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F5C842 50%, #A07810 100%)' }}>
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                fontWeight: '900',
                color: '#fff',
                lineHeight: 1,
                textShadow: '0 1px 4px rgba(0,0,0,0.3)'
              }}>S</span>
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white hidden sm:block tracking-tighter">
              Sarothi
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400",
                location.pathname === "/" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
              )}
            >
              Home
            </Link>

            {/* HSC/SSC Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setIsHscSscOpen(true)}
              onMouseLeave={() => setIsHscSscOpen(false)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400",
                  location.pathname === "/hsc-ssc" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                )}
              >
                HSC/SSC <ChevronDown className={cn("w-4 h-4 transition-transform", isHscSscOpen && "rotate-180")} />
              </button>
              {isHscSscOpen && (
                <div className="absolute left-0 mt-0 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link to="/hsc-ssc?type=HSC" className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">HSC</Link>
                  <Link to="/hsc-ssc?type=SSC" className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">SSC</Link>
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400",
                  location.pathname === link.path ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ── Right Section ── */}
          <div className="flex items-center gap-4">

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5 text-zinc-600" />
              }
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 max-h-96 overflow-y-auto z-[60]">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                      <span className="text-sm font-bold">Notifications</span>
                      {unreadCount > 0 && (
                        <button className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={cn(
                        "px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-0",
                        !n.read && "bg-emerald-50/30 dark:bg-emerald-900/10"
                      )}>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">{n.message}</p>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-zinc-400 text-sm">No notifications</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {profile?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate tracking-tight">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-4 px-4 space-y-2">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 rounded-lg text-base font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Home
          </Link>
          <div className="px-4 py-2 space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">HSC/SSC</p>
            <Link to="/hsc-ssc?type=HSC" onClick={() => setIsMenuOpen(false)} className="block pl-4 py-1 text-sm text-zinc-600 dark:text-zinc-400">HSC</Link>
            <Link to="/hsc-ssc?type=SSC" onClick={() => setIsMenuOpen(false)} className="block pl-4 py-1 text-sm text-zinc-600 dark:text-zinc-400">SSC</Link>
          </div>
          {navLinks.slice(1).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-lg text-base font-medium transition-colors",
                location.pathname === link.path
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
