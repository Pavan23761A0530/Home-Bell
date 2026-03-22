import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { LayoutDashboard, User, Briefcase, Settings, LogOut, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const WorkerLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const isActive = (path) => location.pathname === path;
  const linkClass = (path) => clsx(
    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
    isActive(path)
      ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100"
      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow pt-20 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-6 sticky top-24">
            <div className="flex items-center space-x-3 px-2 mb-8">
              {user?.profileImage && !imgError ? (
                <img
                  src={user.profileImage}
                  alt="Worker"
                  onError={() => setImgError(true)}
                  className="h-10 w-10 rounded-full object-cover border border-neutral-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-neutral-500">Welcome,</p>
                <p className="font-bold text-neutral-900">{user?.name || 'Worker'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Menu</p>
              <Link to="/worker/dashboard" className={linkClass('/worker/dashboard')}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link to="/worker/profile" className={linkClass('/worker/profile')}>
                <BadgeCheck size={20} />
                <span>Profile</span>
              </Link>
            </div>

            <div className="space-y-1 mt-8">
              <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Account</p>
              <div className={linkClass('/worker/settings')}>
                <Settings size={20} />
                <span>Settings</span>
              </div>
              <Link to="/worker/dashboard" className={linkClass('/worker/jobs')}>
                <Briefcase size={20} />
                <span>My Works</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-error-600 hover:bg-error-50 transition-colors font-medium mt-2"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-grow min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default WorkerLayout;
