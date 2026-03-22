import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { Home, Search, Calendar, User, MapPin, LogOut, CreditCard, Settings, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const CustomerLayout = () => {
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
    const firstName = (user?.name || 'Customer').split(' ')[0];

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />
            <div className="flex-grow pt-20 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 flex gap-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                {/* Sidebar */}
                <aside className="w-72 flex-shrink-0 hidden lg:block">
                    <div className="rounded-2xl shadow-card p-6 sticky top-24" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center space-x-3 px-2 mb-8">
                            {user?.profileImage && !imgError ? (
                                <img
                                    src={user.profileImage}
                                    alt="Avatar"
                                    onError={() => setImgError(true)}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                    <User className="h-6 w-6 text-primary-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-neutral-500">Welcome back,</p>
                                <p className="font-bold text-neutral-900">{user?.name || 'Customer'}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Menu</p>

                            <Link to="/dashboard" className={linkClass('/dashboard')}>
                                <Home size={20} />
                                <span>Dashboard</span>
                            </Link>

                            <Link to="/services" className={linkClass('/services')}>
                                <Search size={20} />
                                <span>Book Service</span>
                            </Link>

                            <Link to="/dashboard/bookings" className={linkClass('/dashboard/bookings')}>
                                <Calendar size={20} />
                                <span>My Bookings</span>
                            </Link>
                        </div>

                        <div className="space-y-1 mt-8">
                            <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Account</p>

                            <Link to="/dashboard/profile" className={linkClass('/dashboard/profile')}>
                                <User size={20} />
                                <span>Profile</span>
                            </Link>

                            <Link to="/dashboard/saved-addresses" className={linkClass('/dashboard/saved-addresses')}>
                                <MapPin size={20} />
                                <span>Saved Addresses</span>
                            </Link>

                            <div className={linkClass('')}>
                                <CreditCard size={20} />
                                <span>Payment Methods</span>
                            </div>

                            <div className={linkClass('')}>
                                <Settings size={20} />
                                <span>Account Settings</span>
                            </div>

                            <div className={linkClass('')}>
                                <Phone size={20} />
                                <span>Support</span>
                            </div>

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

export default CustomerLayout;
