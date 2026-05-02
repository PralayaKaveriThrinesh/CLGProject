import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, User, LayoutDashboard, History, FileCode, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';
import axios from 'axios';

import logo from '../../assets/logo.png';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState<any>(null);
  const { user, isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    const updateAchiever = () => {
      const stored = localStorage.getItem('achieverEmail');
      if (stored) {
        setAnnouncement({ user: { name: stored.split('@')[0] } });
      } else {
        setAnnouncement(null);
      }
    };

    updateAchiever();
    window.addEventListener('achieverChanged', updateAchiever);
    window.addEventListener('storage', updateAchiever);

    return () => {
      window.removeEventListener('achieverChanged', updateAchiever);
      window.removeEventListener('storage', updateAchiever);
    };
  }, []);

  return (
    <nav className="sticky top-0 w-full z-50 border-b border-khaki-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900 transition-all shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-12 w-12 overflow-hidden rounded-xl shadow-md border border-slate-200 dark:border-slate-800 transition-transform group-hover:scale-110">
              <img src={logo} alt="CodeGuardian Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">
              Code<span className="text-primary-500">Guardian</span>
            </span>
          </Link>

          {/* Scrolling Marquee in the middle */}
          <div className="hidden lg:flex flex-1 mx-12 overflow-hidden pointer-events-none">
            <marquee className="text-sm font-medium text-primary-500/80 dark:text-primary-400/60 uppercase tracking-widest italic" scrollamount="4">
              ℭ𝔬𝔡𝔢 𝔦𝔰 𝔱𝔥𝔢 𝔩𝔞𝔫𝔤𝔲𝔞𝔤𝔢 𝔬𝔣 𝔱𝔥𝔢 𝔣𝔲𝔱𝔲𝔯𝔢—𝔩𝔢𝔞𝔯𝔫 𝔦𝔱, 𝔢𝔞𝔯𝔫 𝔣𝔯𝔬𝔪 𝔦𝔱.
            </marquee>
          </div>

          <div className="hidden md:flex items-center space-x-4 relative">
            <nav className="flex items-center space-x-5 mr-4">
              <Link to="/#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</Link>
              <Link to="/#about" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</Link>

            </nav>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center space-x-1">
              <ThemeToggle />
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center space-x-6">
              {announcement && (
                <div className="flex items-center space-x-4 bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-500/30 px-6 py-2 rounded-xl animate-in slide-in-from-right-2 shadow-sm">
                  <span className="text-lg">🌸</span>
                  <div className="flex flex-col min-w-max">
                    <span className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-tight leading-tight">Weekly Winner</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">🏆 {announcement.user?.name}</span>
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <div className="relative group flex flex-col items-end">
                  <button className="flex items-center space-x-2 pl-2 pr-1 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent">
                    <div className="w-8 h-8 rounded-full bg-[#0ea5e9] shadow-inner shadow-white/20 flex items-center justify-center text-white font-bold text-sm ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all">
                      {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-khaki-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                    <div className="p-4 border-b border-khaki-100 dark:border-slate-800 bg-khaki-50 dark:bg-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User Profile'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest">{user?.email}</p>
                    </div>
                    
                    <div className="p-2">
                      <Link to="/student/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group/item">
                        <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover/item:text-primary-500" />
                        <span className="text-sm font-medium">Overview</span>
                      </Link>
                      <Link to="/student/upload" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group/item">
                        <FileCode className="w-4 h-4 text-slate-400 group-hover/item:text-primary-500" />
                        <span className="text-sm font-medium">Submissions</span>
                      </Link>
                      <Link to="/student/history" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group/item">
                        <History className="w-4 h-4 text-slate-400 group-hover/item:text-primary-500" />
                        <span className="text-sm font-medium">Reports</span>
                      </Link>
                    </div>

                    <div className="p-2 border-t border-khaki-100 dark:border-slate-800">
                      <button 
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group/item"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-bold text-slate-600 dark:text-slate-300">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="font-bold shadow-lg shadow-primary-500/20">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>


          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`absolute right-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">MENU</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500"><X size={24}/></button>
            </div>

            {announcement && (
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900/40 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌸</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-pink-500 uppercase">Weekly Achiever</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{announcement.user?.name}</span>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col space-y-2">
              <Link to="/#features" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">Features</Link>
              <Link to="/#about" onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">About</Link>
              
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              
              <Link to="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                <LayoutDashboard size={18} /> <span className="font-bold">Dashboard</span>
              </Link>
              <Link to="/student/upload" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                <FileCode size={18} /> <span className="font-bold">IDE / Editor</span>
              </Link>
              <Link to="/student/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                <History size={18} /> <span className="font-bold">Reports</span>
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
              {isAuthenticated ? (
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 p-4 rounded-xl text-red-500 bg-red-50 dark:bg-red-950/20 font-bold"
                >
                  <LogOut size={20} /> <span className="font-medium">Sign Out</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-bold">Sign In</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center p-4 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
