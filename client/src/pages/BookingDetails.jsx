import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    CheckCircle, Clock, MapPin, User, FileText,
    MessageSquare, DollarSign, AlertTriangle, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BookingDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBooking();
        // Poll for updates (simplified real-time)
        const interval = setInterval(fetchBooking, 5000);
        return () => clearInterval(interval);
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            const res = await api.get(`/bookings/${bookingId}`);
            if (res.data.success) {
                setBooking(res.data.data);
            }
        } catch (err) {
            setError("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        try {
            await api.put(`/bookings/${bookingId}/sign`);
            fetchBooking();
        } catch (err) {
            alert("Failed to sign contract");
        }
    };

    const handleCancelBooking = async () => {
        if (!booking) return;

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
            const res = await api.put(`/bookings/${bookingId}/cancel`);
            if (res.data.success) {
                toast.success('Booking cancelled successfully');
                setBooking(res.data.data);
            } else {
                toast.error(res.data.error || 'Failed to cancel booking');
            }
        } catch (err) {
            const message = err.response?.data?.error || err.response?.data?.message || 'Failed to cancel booking';
            toast.error(message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!booking) return <div>Booking not found</div>;

    const steps = [
        { status: 'created', label: 'Booking Confirmed', icon: '✅' },
        { status: 'searching-provider', label: 'Finding Provider', icon: '🔍' },
        { status: 'assigned', label: 'Provider Assigned', icon: '👤' },
        { status: 'accepted', label: 'Job Accepted', icon: '✅' },
        { status: 'arrived', label: 'Provider Arrived', icon: '📍' },
        { status: 'in-progress', label: 'Service In Progress', icon: '🔧' },
        { status: 'completed', label: 'Completed', icon: '🎉' },
        { status: 'paid', label: 'Payment Received', icon: '💳' },
        { status: 'reviewed', label: 'Reviewed', icon: '⭐' }
    ];

    const statusColors = {
        created: 'bg-blue-500',
        'searching-provider': 'bg-yellow-500',
        assigned: 'bg-indigo-500',
        accepted: 'bg-green-500',
        arrived: 'bg-purple-500',
        'in-progress': 'bg-orange-500',
        completed: 'bg-green-600',
        paid: 'bg-teal-500',
        reviewed: 'bg-pink-500',
        cancelled: 'bg-red-500'
    };

    const currentStepIndex = steps.findIndex(s => s.status === booking.status);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        Booking #{booking._id.slice(-6)}
                        <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                            {booking.status.replace('-', ' ')}
                        </span>
                    </h1>
                    <p className="text-gray-500">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
            </header>

            {/* Progress Tracker */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="mr-2" size={20} />
                    Booking Progress
                </h3>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200 z-0"></div>

                    <div className="space-y-6 relative z-10">
                        {steps.map((step, index) => {
                            const isCompleted = steps.findIndex(s => s.status === booking.status) >= index;
                            const isCurrent = step.status === booking.status;

                            return (
                                <div key={step.status} className="flex items-start">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? statusColors[step.status] : 'bg-gray-200'} ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}>
                                        {isCompleted ? (
                                            <CheckCircle size={16} className="text-white" />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1 pb-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {step.icon} {step.label}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {booking.statusHistory?.find(h => h.status === step.status)?.timestamp
                                                    ? new Date(booking.statusHistory.find(h => h.status === step.status).timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                        {isCurrent && (
                                            <p className="text-sm text-blue-600 mt-1 font-medium">Current Status</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-blue-600">
                            {Math.round(((steps.findIndex(s => s.status === booking.status) + 1) / steps.length) * 100)}%
                        </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(steps.findIndex(s => s.status === booking.status) + 1) / steps.length * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center"><FileText className="mr-2" /> Service Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Service</p>
                                <p className="font-medium">{booking.service?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date & Time</p>
                                <p className="font-medium">{new Date(booking.scheduledDate).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">{booking.address?.street}, {booking.address?.city}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="font-medium text-green-600">₹{booking.price}</p>
                            </div>
                        </div>
                        {booking.description && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">"{booking.description}"</p>
                            </div>
                        )}
                        {user?.role === 'customer' && !['cancelled', 'completed'].includes(booking.status) && (
                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleCancelBooking}
                                    className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 font-semibold text-sm"
                                >
                                    Cancel Booking (10-minute window)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Contract Section */}
                    {booking.contract && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold flex items-center"><FileText className="mr-2" /> Service Contract</h2>
                                <span className={`px-3 py-1 text-sm rounded-full ${booking.contract.customerSignature?.signed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {booking.contract.customerSignature?.signed ? 'Signed' : 'Action Required'}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono mb-4 h-48 overflow-y-auto whitespace-pre-wrap">
                                {booking.contract.content}
                            </div>
                            {!booking.contract.customerSignature?.signed ? (
                                <button
                                    onClick={handleSignContract}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    Sign Contract Electronically
                                </button>
                            ) : booking.paymentStatus === 'pending' ? (
                                <button
                                    onClick={() => window.location.href = `/payment/${bookingId}`}
                                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center animate-bounce"
                                >
                                    <DollarSign className="mr-2" size={18} />
                                    Secure Payment Required
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg text-center font-semibold flex items-center justify-center">
                                        <CheckCircle className="mr-2" size={18} />
                                        Payment Completed
                                    </div>
                                    {booking.status === 'completed' && (
                                        <button
                                            onClick={() => navigate('/rate-provider', { state: { booking } })}
                                            className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 font-semibold flex items-center justify-center"
                                        >
                                            <Star className="mr-2" size={18} />
                                            Rate Provider
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Provider Card */}
                    {booking.provider ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-uppercase text-gray-500 font-bold mb-4">ASSIGNED PROVIDER</h3>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="h-16 w-16 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {booking.provider.user?.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-lg">{booking.provider.user?.name}</p>
                                    <div className="flex items-center text-yellow-500 mb-1">
                                        <Star size={14} fill="currentColor" className="mr-1" />
                                        <span className="text-sm font-medium">{booking.provider.rating || 'New'} ({booking.provider.reviewsCount || 0} reviews)</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <CheckCircle size={12} className="mr-1 text-green-500" />
                                        <span>Verified Professional</span>
                                    </div>
                                </div>
                            </div>

                            {/* Provider Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">Jobs</p>
                                    <p className="font-bold text-gray-900">{booking.provider.jobsCompleted || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">Response</p>
                                    <p className="font-bold text-gray-900">{booking.provider.responseRate || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button className="w-full flex items-center justify-center space-x-2 border border-blue-300 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={18} />
                                    <span>Message Provider</span>
                                </button>
                                <button className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <MapPin size={18} />
                                    <span>View Profile</span>
                                </button>
                            </div>

                            {/* Provider Arrival Info */}
                            {booking.status === 'assigned' && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-800 flex items-center">
                                        <Clock size={14} className="mr-2" />
                                        On the way - Expected in 15-30 mins
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center py-8">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                                <p className="text-gray-500">Finding the best provider...</p>
                            </div>
                        </div>
                    )}

                    {/* Support */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-uppercase text-gray-500 font-bold mb-2">NEED HELP?</h3>
                        <p className="text-sm text-gray-600 mb-4">If you have issues with this booking, contact support.</p>
                        <button className="text-red-600 text-sm font-medium hover:underline">Report Issue</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;
