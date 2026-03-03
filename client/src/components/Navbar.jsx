import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Briefcase, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from './common/Button';
import NotificationBell from './NotificationBell';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav
            className={clsx(
                "fixed top-0 w-full z-50 transition-all duration-300"
            )}
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text)', borderBottom: '1px solid var(--card-border)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                                <span className="font-bold text-xl" style={{ color: 'var(--primary-contrast)' }}>HB</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Home Bell</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={clsx(
                                    "text-sm font-medium transition-colors hover:text-primary-600",
                                    isActive(link.path) ? "text-primary-600" : "text-neutral-600"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="flex items-center space-x-4 pl-4 border-l border-neutral-200">
                            {user ? (
                                <>
                                    <div className="hidden md:block">
                                        <div className="flex items-center gap-3 rounded-2xl shadow-sm px-3 py-2" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                                            {user.profileImage ? (
                                                <img
                                                    src={user.profileImage}
                                                    alt="Avatar"
                                                    className="h-10 w-10 rounded-full object-cover border border-neutral-200"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-neutral-600" />
                                                </div>
                                            )}
                                            <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--text)' }}>
                                                {(user.name || 'CUSTOMER').toUpperCase()}
                                            </span>
                                            <button
                                                onClick={toggle}
                                                className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
                                                aria-label="Toggle theme"
                                            >
                                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                            </button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-1.5 shadow-none"
                                                onClick={handleLogout}
                                            >
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                    <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'provider' ? '/provider/dashboard' : user.role === 'worker' ? '/worker/dashboard' : '/dashboard'}>
                                        <Button variant="ghost" size="sm" className="gap-2" style={{ color: 'var(--text)' }}>
                                            <LayoutDashboard size={18} />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <NotificationBell />
                                </>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" size="sm">Login</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="primary" size="sm">Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-neutral-600 hover:text-primary-600 focus:outline-none p-2"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={clsx(
                                    "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                                    isActive(link.path)
                                        ? "bg-primary-50 text-primary-700"
                                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="pt-4 mt-4 border-t border-neutral-200 space-y-3">
                            {user ? (
                                <>
                                    <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'provider' ? '/provider/dashboard' : user.role === 'worker' ? '/worker/dashboard' : '/dashboard'} className="block w-full">
                                        <Button variant="secondary" className="w-full justify-start gap-2">
                                            <LayoutDashboard size={18} />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        onClick={handleLogout}
                                        className="w-full justify-start gap-2 text-error-600 border-error-200"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="block w-full">
                                        <Button variant="secondary" className="w-full">Login</Button>
                                    </Link>
                                    <Link to="/register" className="block w-full">
                                        <Button variant="primary" className="w-full">Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
