import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FileText, CheckCircle, Clock, User, Shield, Download, Check, X } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const ContractReview = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [signature, setSignature] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            const res = await api.get(`/bookings/${bookingId}`);
            if (res.data.success) {
                setBooking(res.data.data);
                setContract(res.data.data.contract);
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleSignContract = async () => {
        if (!agreeToTerms) {
            toast.error('Please agree to the terms and conditions');
            return;
        }

        if (!signature.trim()) {
            toast.error('Please enter your signature');
            return;
        }

        setIsSigning(true);
        try {
            const res = await api.put(`/bookings/${bookingId}/sign`, {
                signature: signature.trim()
            });

            if (res.data.success) {
                toast.success('Contract signed successfully!');
                setTimeout(() => {
                    // Redirect based on booking status or to payment
                    if (booking?.paymentStatus === 'pending') {
                        navigate(`/payment/${bookingId}`);
                    } else {
                        navigate(`/bookings/${bookingId}`);
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Error signing contract:', error);
            toast.error('Failed to sign contract');
        } finally {
            setIsSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Contract Available</h2>
                    <p className="text-gray-600 mb-6">This booking does not have a contract to review.</p>
                    <Button onClick={() => navigate(`/bookings/${bookingId}`)}>
                        Back to Booking
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Agreement</h1>
                    <p className="text-gray-600">Review and sign the contract for your upcoming service</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contract Preview */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <div className="border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                        <FileText className="mr-2" size={24} />
                                        Service Contract
                                    </h2>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                            {contract.status || 'Pending'}
                                        </span>
                                        <Button variant="outline" size="sm">
                                            <Download size={16} className="mr-1" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Contract Header */}
                                <div className="mb-8 pb-6 border-b border-gray-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">LocalServe Service Agreement</h3>
                                            <p className="text-sm text-gray-600">Agreement ID: {contract._id || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Date Created:</p>
                                            <p className="font-medium">{new Date(contract.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Service Provider</h4>
                                            <p className="text-gray-700">{booking?.provider?.user?.name || 'TBD'}</p>
                                            <p className="text-sm text-gray-600">{booking?.provider?.user?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Client</h4>
                                            <p className="text-gray-700">{booking?.user?.name || 'TBD'}</p>
                                            <p className="text-sm text-gray-600">{booking?.user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Content */}
                                <div className="prose max-w-none mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
                                    <div className="bg-gray-50 p-6 rounded-lg space-y-4 text-gray-700">
                                        <p><strong>Service Description:</strong> {booking?.service?.name || 'Professional Service'}</p>
                                        <p><strong>Scheduled Date:</strong> {new Date(booking?.scheduledDate || Date.now()).toLocaleDateString()}</p>
                                        <p><strong>Service Address:</strong> {booking?.address?.street}, {booking?.address?.city} {booking?.address?.zip}</p>
                                        <p><strong>Total Amount:</strong> ₹{booking?.price || '0'}</p>
                                        
                                        <div className="mt-6">
                                            <h4 className="font-semibold text-gray-900 mb-2">Service Terms:</h4>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>The service provider will arrive within the agreed time window</li>
                                                <li>Cancellation policy: 24-hour notice required for full refund</li>
                                                <li>Payment will be processed upon service completion</li>
                                                <li>Quality guarantee: 100% satisfaction or money-back</li>
                                                <li>Service provider is bonded and insured</li>
                                            </ul>
                                        </div>

                                        <div className="mt-6">
                                            <h4 className="font-semibold text-gray-900 mb-2">Client Responsibilities:</h4>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>Ensure access to the service location at the scheduled time</li>
                                                <li>Provide clear instructions about the service requirements</li>
                                                <li>Be present during service delivery if required</li>
                                                <li>Contact support immediately if any issues arise</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Section */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Enter your signature
                                            </label>
                                            <input
                                                type="text"
                                                value={signature}
                                                onChange={(e) => setSignature(e.target.value)}
                                                placeholder="Type your full name to sign digitally"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id="terms-agreement"
                                                checked={agreeToTerms}
                                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="terms-agreement" className="text-sm text-gray-700">
                                                I agree to the terms and conditions outlined above and authorize the service provider to perform the requested services.
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contract Status */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Shield className="mr-2" size={20} />
                                Contract Status
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm font-medium text-green-800">Contract Created</span>
                                    <Check className="w-4 h-4 text-green-600" />
                                </div>
                                
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                    contract.customerSignature?.signed 
                                        ? 'bg-green-50' 
                                        : 'bg-gray-100'
                                }`}>
                                    <span className="text-sm font-medium">Customer Signature</span>
                                    {contract.customerSignature?.signed ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                                
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                    contract.providerSignature?.signed 
                                        ? 'bg-green-50' 
                                        : 'bg-gray-100'
                                }`}>
                                    <span className="text-sm font-medium">Provider Signature</span>
                                    {contract.providerSignature?.signed ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Action Buttons */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
                            
                            <div className="space-y-3">
                                <Button
                                    onClick={handleSignContract}
                                    isLoading={isSigning}
                                    disabled={!agreeToTerms || !signature.trim()}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                                >
                                    <CheckCircle className="mr-2" size={18} />
                                    Sign Contract
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate(`/bookings/${bookingId}`)}
                                >
                                    Back to Booking
                                </Button>
                            </div>
                        </Card>

                        {/* Important Info */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="mr-2" size={20} />
                                Important Information
                            </h3>
                            
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>By signing, you agree to the service terms and conditions</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Digital signature is legally binding</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>You can cancel within 24 hours for a full refund</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractReview;