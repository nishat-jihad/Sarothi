import React, { useState, useEffect } from 'react';
import { Sun, Moon, User as UserIcon, Bell, LogOut, Menu, X, ChevronDown, Phone, Rocket } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Notification } from '../types';

// লোগো ইমপোর্ট (নিশ্চিত করুন image টি src/assets ফোল্ডারে আছে)
import logoImage from '../assets/Sarothilogopro.png'; 

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ActiveTriangle = () => (
  <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none"
    style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid #18181b' }} />
);

const ActiveTriangleDark = () => (
  <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none dark:block hidden"
    style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '7px solid #f4f4f5' }} />
);

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHscSscOpen, setIsHscSscOpen] = useState(false);
  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('recipientId', 'in', [user.uid, 'admin']), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))));
    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  };

  const markOneRead = async (id: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'notifications', id), { read: true });
    await batch.commit();
  };

  const handleSignOut = async () => { await auth.signOut(); navigate('/'); };
  const unreadCount = notifications.filter(n => !n.read).length;

  const isActive = (path: string) => location.pathname === path;
  const isStudyActive = location.pathname === '/study' || location.pathname === '/study-tips';
  const isHscActive = location.pathname === '/hsc-ssc';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* ── Logo Section Updated ── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src={logoImage}
              alt="Sarothi Logo"
              className="w-10 h-10 object-contain dark:invert-[0.1]" 
            />
            <span className="text-xl font-bold text-zinc-900 dark:text-white hidden sm:block tracking-tighter">Sarothi</span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={cn("relative px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isActive('/') ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
              Home
              {isActive('/') && <><ActiveTriangle /><ActiveTriangleDark /></>}
            </Link>

            <div className="relative" onMouseEnter={() => setIsHscSscOpen(true)} onMouseLeave={() => setIsHscSscOpen(false)}>
              <button className={cn("relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isHscActive ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
                HSC/SSC <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isHscSscOpen && "rotate-180")} />
                {isHscActive && <><ActiveTriangle /><ActiveTriangleDark /></>}
              </button>
              {isHscSscOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-50">
                  <Link to="/hsc-ssc?type=HSC" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">📘 HSC</Link>
                  <Link to="/hsc-ssc?type=SSC" className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">📗 SSC</Link>
                </div>
              )}
            </div>

            <Link to="/admission" className={cn("relative px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isActive('/admission') ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
              Admission
              {isActive('/admission') && <><ActiveTriangle /><ActiveTriangleDark /></>}
            </Link>

            <div className="relative" onMouseEnter={() => setIsStudyOpen(true)} onMouseLeave={() => setIsStudyOpen(false)}>
              <button className={cn("relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isStudyActive ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
                Study <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isStudyOpen && "rotate-180")} />
                {isStudyActive && <><ActiveTriangle /><ActiveTriangleDark /></>}
              </button>
              {isStudyOpen && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-50">
                  <Link to="/study?section=hsc" className="block px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="font-bold">📘 HSC (Science)</span>
                    <span className="block text-xs text-zinc-400 mt-0.5">Formula sheets & notes</span>
                  </Link>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                  <Link to="/study?section=admission" className="block px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="font-bold">🎓 Admission (Science)</span>
                    <span className="block text-xs text-zinc-400 mt-0.5">Physics, Chemistry & more</span>
                  </Link>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                  <Link to="/study-tips" className="block px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <span className="font-bold">💡 Study Tips</span>
                    <span className="block text-xs text-zinc-400 mt-0.5">Tips & strategies</span>
                  </Link>
                </div>
              )}
            </div>

            <Link to="/updates" className={cn("relative px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isActive('/updates') ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
              Updates
              {isActive('/updates') && <><ActiveTriangle /><ActiveTriangleDark /></>}
            </Link>

            <Link to="/about" className={cn("relative px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isActive('/about') ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
              About Us
              {isActive('/about') && <><ActiveTriangle /><ActiveTriangleDark /></>}
            </Link>

            <Link to="/contact" className={cn("relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50", isActive('/contact') ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-600 dark:text-zinc-400")}>
              <Phone className="w-3.5 h-3.5" />
              Contact
              {isActive('/contact') && <><ActiveTriangle /><ActiveTriangleDark /></>}
            </Link>
          </div>

          {/* ── Right Section ── */}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-zinc-600" />}
            </button>

            {user && (
              <div className="relative">
                <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative">
                  <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 max-h-96 overflow-y-auto z-[60]">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900">
                      <span className="text-sm font-bold">Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}</span>
                      {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest hover:underline">Mark all read</button>}
                    </div>
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} onClick={() => markOneRead(n.id)}
                        className={cn("px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-0 cursor-pointer", !n.read && "bg-emerald-50/50 dark:bg-emerald-900/10")}>
                        <div className="flex items-start gap-2">
                          {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />}
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm text-zinc-900 dark:text-white", !n.read ? "font-bold" : "font-medium")}>{n.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                            {n.createdAt?.seconds && <p className="text-[10px] text-zinc-400 mt-1">{new Date(n.createdAt.seconds * 1000).toLocaleString('en-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-zinc-400 text-sm"><Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />No notifications yet</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!user && (
              <Link to="/login"
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-bold rounded-lg transition-all hidden md:flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                Get Started
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-[60]">
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{profile?.displayName || user.displayName || 'User'}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {isAdmin ? '⚙️ Admin' : '👤 User'}
                      </span>
                    </div>
                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">Profile</Link>
                    {isAdmin && <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">Admin Dashboard</Link>}
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/20">
                Sign In
              </Link>
            )}

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 space-y-1">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Home</Link>
          <div className="px-4 py-2 space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">HSC/SSC</p>
            <Link to="/hsc-ssc?type=HSC" onClick={() => setIsMenuOpen(false)} className="block pl-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">📘 HSC</Link>
            <Link to="/hsc-ssc?type=SSC" onClick={() => setIsMenuOpen(false)} className="block pl-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">📗 SSC</Link>
          </div>
          <Link to="/admission" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Admission</Link>
          <div className="px-4 py-2 space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Study</p>
            <Link to="/study?section=hsc" onClick={() => setIsMenuOpen(false)} className="block pl-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">📘 HSC (Science)</Link>
            <Link to="/study?section=admission" onClick={() => setIsMenuOpen(false)} className="block pl-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">🎓 Admission (Science)</Link>
            <Link to="/study-tips" onClick={() => setIsMenuOpen(false)} className="block pl-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400">💡 Study Tips</Link>
          </div>
          <Link to="/updates" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">Updates</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">About Us</Link>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">📞 Contact Us</Link>
          {!user && (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">🚀 Get Started</Link>
          )}
        </div>
      )}
    </nav>
  );
};
