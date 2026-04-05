import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Clock, CheckCircle, Wallet, Calendar, MapPin, ArrowRight, Star, Home, User, CreditCard, Settings, Bookmark, Phone, Shield, Gift, X } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Dashboard = () => {
    const { user, checkUserLoggedIn } = useAuth();
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        fetchBookings();
        
        // Trigger welcome celebration for new users
        if (user && !user.hasSeenWelcome && user.couponPoints >= 100) {
            handleWelcomeCelebration();
        }
    }, [user]);

    const handleWelcomeCelebration = () => {
        setShowWelcome(true);
        
        // Confetti burst
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const closeWelcome = async () => {
        setShowWelcome(false);
        try {
            await api.put('/users/welcome-seen');
            if (checkUserLoggedIn) await checkUserLoggedIn();
        } catch (err) {
            console.error("Failed to update welcome status", err);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (booking) => {
        if (!booking || !booking._id) return;

        const createdAt = booking.createdAt ? new Date(booking.createdAt).getTime() : null;
        if (!createdAt) {
            toast.error('Unable to cancel this booking');
            return;
        }

        const diffMs = Date.now() - createdAt;
        if (diffMs > 10 * 60 * 1000) {
            toast.error('Cancellation period expired');
            return;
        }

        try {
            const res = await api.put(`/bookings/${booking._id}/cancel`);
            if (res.data.success) {
                toast.success('Booking cancelled successfully');
                setBookings(prev => prev.map(b => b._id === booking._id ? res.data.data : b));
            } else {
                toast.error(res.data.error || 'Failed to cancel booking');
            }
        } catch (err) {
            const message = err.response?.data?.error || err.response?.data?.message || 'Failed to cancel booking';
            toast.error(message);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'searching-provider': return 'warning';
            case 'assigned': return 'success';
            case 'accepted': return 'primary';
            case 'in-progress': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'error';
            case 'pending': return 'warning';
            default: return 'neutral';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'searching-provider': return 'Pending';
            case 'in-progress': return 'Provider Assigned';
            case 'accepted': return 'Accepted';
            case 'assigned': return 'Assigned';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status?.replace('-', ' ') || 'Status';
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;

    const activeBookings = bookings.filter(b => ['searching-provider', 'assigned', 'accepted', 'in-progress'].includes(b.status));
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const isBookingsPage = location.pathname === '/dashboard/bookings';

    return (
        <div className="min-h-screen bg-neutral-50">
            <main className="p-6 md:p-8">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Dashboard Overview</h1>
                        <p className="text-neutral-500">Welcome back, {user?.name}</p>
                    </div>
                    <Link to="/services">
                        <Button className="gap-2 shadow-lg shadow-primary-600/20">
                            Book New Service <ArrowRight size={16} />
                        </Button>
                    </Link>
                </header>

                <div className="space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="pl-6 pr-6 py-8 border-l-4 border-l-primary-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Active Jobs</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-1">{activeBookings.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                                <Clock size={24} />
                            </div>
                        </Card>

                        <Card className="pl-6 pr-6 py-8 border-l-4 border-l-success-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Completed</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-1">{completedBookings.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-success-50 flex items-center justify-center text-success-600">
                                <CheckCircle size={24} />
                            </div>
                        </Card>

                        <Card className="pl-6 pr-6 py-8 border-l-4 border-l-purple-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Total Spent</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-1">₹{bookings.filter(b => b.status !== 'cancelled').reduce((acc, curr) => acc + (curr.finalPrice || curr.price), 0)}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <Wallet size={24} />
                            </div>
                        </Card>

                        {/* Coupon Points Stats Card */}
                        <Card className="pl-6 pr-6 py-8 border-l-4 border-l-amber-500 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Coupon Points</p>
                                <p className="text-3xl font-bold text-neutral-900 mt-1">{user?.couponPoints || 0}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                <Gift size={24} />
                            </div>
                        </Card>
                    </div>

                    {/* Welcome Modal */}
                    <Modal 
                        isOpen={showWelcome} 
                        onClose={closeWelcome}
                        title=""
                    >
                        <div className="p-4 text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-bounce">
                                    <Gift size={48} />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-neutral-900 mb-2">🎉 Welcome to Home Bell!</h2>
                            <p className="text-neutral-600 mb-8 text-lg">
                                We've gifted you <span className="font-bold text-primary-600">100 Coupon Points</span> to get started on your first service!
                            </p>
                            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 mb-8">
                                <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Your Balance</p>
                                <p className="text-4xl font-black text-neutral-900">{user?.couponPoints || 100}</p>
                            </div>
                            <Button 
                                onClick={closeWelcome} 
                                className="w-full py-4 text-lg font-bold rounded-2xl"
                            >
                                Let's Explore!
                            </Button>
                        </div>
                    </Modal>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-neutral-900">{isBookingsPage ? 'My Bookings' : 'Recent Activity'}</h2>
                            {!isBookingsPage && (
                                <Link to="/dashboard/bookings" className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                    View All History
                                </Link>
                            )}
                        </div>

                        <div className="space-y-4">
                            {bookings.length > 0 ? (
                                (isBookingsPage ? bookings : bookings.slice(0, 5)).map((booking) => (
                                    <Card key={booking._id} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-6 sm:flex items-center gap-6">
                                            <div className="flex-shrink-0 mb-4 sm:mb-0">
                                                <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-3xl">
                                                    {booking.service?.image || '📦'}
                                                </div>
                                            </div>

                                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="font-bold text-neutral-900 text-lg">{booking.service?.name}</p>
                                                    <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                                                        <Calendar size={14} />
                                                        {new Date(booking.scheduledDate).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="hidden md:block">
                                                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Provider</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {booking.provider ? (
                                                            <>
                                                                <span className="text-sm font-medium text-neutral-700">{booking.provider.name}</span>
                                                                <span className="flex items-center text-xs text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded">
                                                                    <Star size={10} fill="currentColor" className="mr-0.5" />
                                                                    {booking.provider.rating}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-neutral-400 italic">Assigning...</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="hidden sm:block">
                                                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Total</p>
                                                    <p className="font-bold text-neutral-900 mt-1">₹{booking.finalPrice || booking.price}</p>
                                                </div>

                                                <div className="flex flex-col items-start sm:items-end gap-2">
                                                    <Badge variant={getStatusVariant(booking.statusNormalized || booking.status)} className="capitalize px-3 py-1">
                                                        {getStatusLabel(booking.statusNormalized || booking.status)}
                                                    </Badge>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Link to={`/bookings/${booking._id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                        {user?.role === 'customer' && !['cancelled', 'completed'].includes(booking.status) && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleCancelBooking(booking)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-neutral-300">
                                    <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-900">No bookings yet</h3>
                                    <p className="text-neutral-500 mb-6">Schedule your first service today!</p>
                                    <Link to="/services">
                                        <Button>Book Now</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
