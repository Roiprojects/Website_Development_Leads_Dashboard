import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [title, setTitle] = useState('Website Development Leads');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.project_title) {
          setTitle(res.data.project_title);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();

    // Refresh title when location changes (in case it was updated in admin)
    if (location.pathname === '/' || location.pathname === '/admin') {
      fetchSettings();
    }
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="relative sticky top-0 z-50 glass border-b px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-brand-600 p-1.5 rounded-lg shrink-0 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate max-w-[140px] sm:max-w-none">
            {title}
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-brand-600 ${location.pathname === '/' ? 'text-brand-600 dark:text-brand-500' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Dashboard
          </Link>
          {token && (
            <>
              <Link 
                to="/admin" 
                className={`p-2 rounded-lg transition-colors flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 ${location.pathname === '/admin' ? 'text-brand-600 dark:text-brand-500' : 'text-slate-600 dark:text-slate-300'}`}
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button 
          className="sm:hidden p-2 -mr-1 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-14 z-40 glass border-b shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-3 gap-1">
            <Link 
              to="/" 
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Dashboard
            </Link>
            {token && (
              <>
                <Link 
                  to="/admin" 
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
