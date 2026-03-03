import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { BarChart, Users, FileCheck, ShieldAlert, Settings, LogOut, Shield, Grid3X3, Zap, Bell, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const location = useLocation();
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    const isActive = (path) => location.pathname === path;
    const linkClass = (path) => clsx(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
        isActive(path)
            ? "bg-neutral-800 text-white shadow-md ring-1 ring-neutral-700"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    );

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />
            <div className="flex-grow pt-20 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 flex gap-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                {/* Sidebar */}
                <aside className="w-72 flex-shrink-0 hidden lg:block">
                    <div className="rounded-2xl shadow-card p-6 sticky top-24" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center space-x-3 px-2 mb-8">
                            <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-500">System Admin</p>
                                <p className="font-bold text-neutral-900">Control Panel</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Management</p>

                            <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                                <BarChart size={20} />
                                <span>Dashboard</span>
                            </Link>

                            <Link to="/admin/users" className={linkClass('/admin/users')}>
                                <Users size={20} />
                                <span>User Management</span>
                            </Link>

                            <Link to="/admin/bookings" className={linkClass('/admin/bookings')}>
                                <FileCheck size={20} />
                                <span>All Bookings</span>
                            </Link>

                            <Link to="/admin/disputes" className={linkClass('/admin/disputes')}>
                                <ShieldAlert size={20} />
                                <span>Disputes</span>
                            </Link>

                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 mt-6">System</p>

                            <Link to="/admin/services" className={linkClass('/admin/services')}>
                                <Grid3X3 size={20} />
                                <span>Services</span>
                            </Link>

                            <Link to="/admin/assignment" className={linkClass('/admin/assignment')}>
                                <Zap size={20} />
                                <span>Assignment Control</span>
                            </Link>

                            <Link to="/admin/notifications" className={linkClass('/admin/notifications')}>
                                <Bell size={20} />
                                <span>Notifications</span>
                            </Link>

                            <Link to="/admin/settings" className={linkClass('/admin/settings')}>
                                <Settings size={20} />
                                <span>System Settings</span>
                            </Link>

                            <Link to="/admin/audit" className={linkClass('/admin/audit')}>
                                <ShieldCheck size={20} />
                                <span>Audit Logs</span>
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

export default AdminLayout;
