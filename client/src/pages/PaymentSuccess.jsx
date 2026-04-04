import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extract payment data passed via React Router state
    const paymentData = location.state?.paymentData;

    useEffect(() => {
        // Prevent direct access to the route without valid payment data
        if (!paymentData) {
            navigate('/dashboard', { replace: true });
        }
    }, [paymentData, navigate]);

    if (!paymentData) {
        return <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">Loading secure environment...</div>; 
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 py-12">
            <div className="flex items-center gap-2 mb-6 text-neutral-500 opacity-80">
                <ShieldCheck size={20} className="text-success-600" />
                <span className="text-sm font-bold tracking-widest uppercase">Safe & Encrypted</span>
            </div>
            
            <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 transform transition-all hover:scale-[1.01] duration-300">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-success-50 to-success-100 p-8 text-center border-b border-success-200/50">
                    <div className="w-24 h-24 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success-500/30 transform transition-transform animate-bounce">
                        <CheckCircle className="text-white w-14 h-14" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-success-800 tracking-tight mb-2">Payment Successful!</h2>
                    <p className="text-success-600 font-extrabold text-lg mb-4">Your booking is confirmed</p>
                    <p className="text-success-600 font-medium">Thank you for your seamless transaction.</p>
                </div>
                
                {/* Details Section */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest mb-2">Transaction Amount</p>
                        <div className="inline-block relative">
                            <span className="text-5xl font-black text-neutral-900 tracking-tight">₹{Number(paymentData.amount).toFixed(2)}</span>
                            <div className="absolute -bottom-2 inset-x-0 h-1 bg-success-400 rounded-full opacity-30"></div>
                        </div>
                    </div>

                    <div className="space-y-5 bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                        <div className="flex gap-4 justify-between items-center border-b border-neutral-200 pb-4">
                            <span className="text-neutral-500 text-sm font-semibold">Payment ID</span>
                            <span className="text-neutral-900 font-bold text-sm tracking-wide font-mono break-all text-right bg-neutral-200/50 px-2 py-1 rounded">{paymentData.paymentId}</span>
                        </div>
                        <div className="flex gap-4 justify-between items-center border-b border-neutral-200 pb-4">
                            <span className="text-neutral-500 text-sm font-semibold">Service</span>
                            <span className="text-neutral-900 font-bold text-sm text-right">{paymentData.serviceName}</span>
                        </div>
                        <div className="flex gap-4 justify-between items-center">
                            <span className="text-neutral-500 text-sm font-semibold">Date & Time</span>
                            <span className="text-neutral-900 font-bold text-sm text-right">{new Date(paymentData.date).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 space-y-4">
                        <Button 
                            onClick={() => navigate(`/bookings/${paymentData.bookingId}`)}
                            className="w-full flex justify-center items-center gap-2 py-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all rounded-xl"
                        >
                            <FileText size={20} /> View Booking Timeline
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex justify-center items-center gap-2 py-4 rounded-xl border-2 hover:bg-neutral-50 transition-colors"
                        >
                            <LayoutDashboard size={20} /> Return to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
