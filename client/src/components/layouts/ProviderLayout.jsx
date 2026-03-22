import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { LayoutDashboard, Briefcase, FileText, Settings, DollarSign, LogOut, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

const ProviderLayout = () => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const isActive = (path) => location.pathname === path;
    const linkClass = (path) => clsx(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
        isActive(path)
            ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100"
            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
    );

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />
            <div className="flex-grow pt-20 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 flex gap-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                {/* Sidebar */}
                <aside className="w-72 flex-shrink-0 hidden lg:block">
                    <div className="rounded-2xl shadow-card p-6 sticky top-24" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center space-x-3 px-2 mb-8">
                            {user?.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt="Provider"
                                    className="h-[50px] w-[50px] rounded-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                <div className="h-[50px] w-[50px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                    <UserCheck className="h-6 w-6 text-secondary-600" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-neutral-900 text-lg leading-tight">{user?.name || 'Provider'}</p>
                                <p className="text-sm font-medium text-neutral-500">Provider Portal Workspace</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Overview</p>

                            <Link to="/provider/dashboard" className={linkClass('/provider/dashboard')}>
                                <LayoutDashboard size={20} />
                                <span>Overview</span>
                            </Link>

                            <Link to="/provider/earnings" className={linkClass('/provider/earnings')}>
                                <DollarSign size={20} />
                                <span>Earnings</span>
                            </Link>

                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">Work</p>

                            <Link to="/provider/jobs" className={linkClass('/provider/jobs')}>
                                <Briefcase size={20} />
                                <span>Active Jobs</span>
                            </Link>

                            <Link to="/provider/services" className={linkClass('/provider/services')}>
                                <Briefcase size={20} />
                                <span>My Services</span>
                            </Link>

                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">Account</p>

                            <Link to="/provider/profile" className={linkClass('/provider/profile')}>
                                <FileText size={20} />
                                <span>Profile & Docs</span>
                            </Link>

                            <Link to="/provider/settings" className={linkClass('/provider/settings')}>
                                <Settings size={20} />
                                <span>Settings</span>
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

                {/* Main Content */}
                <main className="flex-grow min-w-0">
                    <Outlet />
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default ProviderLayout;
