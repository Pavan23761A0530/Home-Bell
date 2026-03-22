import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Lock, CheckCircle, CreditCard as CreditCardIcon, MapPin, User, Calendar } from 'lucide-react';

const Payment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/bookings/${bookingId}`);
                if (res.data.success) {
                    setBooking(res.data.data);
                }
            } catch (err) {
                toast.error("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId]);

    const platformFee = 0;
    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        
        try {
            // Load Razorpay script dynamically
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                // Create order on backend
                api.post('/payments/create-order', {
                    amount: Math.round((booking.price + platformFee) * 100), // Convert to paisa
                    currency: 'INR',
                    bookingId: booking._id
                }).then(orderRes => {
                    if (orderRes.data.success) {
                        const options = {
                            key: 'rzp_test_1DP5mmOlF5G5ag', // Replace with your Razorpay key
                            amount: Math.round((booking.price + platformFee) * 100), // Amount in paisa
                            currency: 'INR',
                            name: 'LocalServe',
                            description: `Payment for ${booking.service?.name}`,
                            order_id: orderRes.data.order.id,
                            handler: async function(response) {
                                // Verify payment and update booking
                                try {
                                    const verifyRes = await api.post('/payments/verify-payment', {
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        bookingId: booking._id
                                    });
                                    
                                    if (verifyRes.data.success) {
                                        toast.success('Payment Successful!');
                                        navigate(`/bookings/${bookingId}`);
                                    }
                                } catch (err) {
                                    toast.error('Payment verification failed');
                                }
                            },
                            prefill: {
                                name: booking.user?.name,
                                email: booking.user?.email,
                                contact: booking.phoneNumber || ''
                            },
                            theme: {
                                color: '#3b82f6'
                            }
                        };
                        
                        const rzp = new window.Razorpay(options);
                        rzp.open();
                        setProcessing(false);
                    }
                }).catch(err => {
                    toast.error('Failed to initiate payment');
                    setProcessing(false);
                });
            };
            script.onerror = () => {
                toast.error('Failed to load payment gateway');
                setProcessing(false);
            };
            document.body.appendChild(script);
        } catch (err) {
            toast.error('Payment initialization failed');
            setProcessing(false);
        }
    };

    if (loading || !booking) return <div className="p-8 text-center">Loading payment details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center mb-6">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
                    <p className="text-gray-600">
                        Complete your booking for <span className="font-semibold text-gray-900">{booking.service?.name}</span>
                    </p>
                </div>
                                
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CreditCardIcon className="mr-2" size={18} />
                        Booking Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-medium">{booking.service?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-right">{booking.address?.street}, {booking.address?.city}</span>
                        </div>
                    </div>
                </div>
                                
                {/* Price Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium">₹{booking.price}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                        <span>Total</span>
                        <span>₹{booking.price + platformFee}</span>
                    </div>
                </div>
                                
                <div className="text-center text-sm text-gray-600 mb-6">
                    <p>Powered by <span className="font-semibold text-blue-600">Razorpay</span></p>
                    <p className="mt-1 flex items-center justify-center">
                        <Lock size={14} className="mr-1" />
                        Secure 256-bit SSL encryption
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Service Fee</span>
                        <span className="font-medium">₹{booking.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Platform Fee</span>
                        <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                        <span>Total</span>
                        <span>₹{booking.price + platformFee}</span>
                    </div>
                </div>

                <form onSubmit={handlePayment}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-all duration-200 shadow-lg"
                    >
                        <CreditCard className="h-5 w-5 text-white mr-2" />
                        {processing ? 'Processing Payment...' : `Pay Now ₹${booking.price + platformFee}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Payment;
