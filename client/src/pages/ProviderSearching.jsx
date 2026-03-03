import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Search, Users, Zap, Shield, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ProviderSearching = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [progress, setProgress] = useState(0);
    const [providersFound, setProvidersFound] = useState(0);

    useEffect(() => {
        // Simulate provider search progress
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 5) + 1;
            });
        }, 500);

        // Simulate finding providers
        const providerInterval = setInterval(() => {
            setProvidersFound(prev => prev + Math.floor(Math.random() * 3));
        }, 1000);

        // Check booking status periodically
        const bookingInterval = setInterval(async () => {
            try {
                const res = await api.get(`/bookings/${bookingId}`);
                if (res.data.success && res.data.data) {
                    const currentBooking = res.data.data;
                    setBooking(currentBooking);
                    
                    // If provider is assigned, redirect to booking details
                    if (currentBooking.provider && currentBooking.status !== 'searching-provider') {
                        clearInterval(bookingInterval);
                        clearInterval(progressInterval);
                        clearInterval(providerInterval);
                        navigate(`/bookings/${bookingId}`);
                    }
                }
            } catch (err) {
                console.error('Error fetching booking:', err);
            }
        }, 2000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(providerInterval);
            clearInterval(bookingInterval);
        };
    }, [bookingId, navigate]);

    const features = [
        { icon: Shield, text: 'Verified Professionals' },
        { icon: MapPin, text: 'Nearest Available' },
        { icon: Zap, text: 'Fast Matching' },
        { icon: Users, text: '500+ Providers' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Finding Your Perfect Provider</h1>
                    <p className="text-gray-600 text-lg">We're matching you with the best professionals in your area</p>
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-700">Searching...</span>
                        <span className="text-sm font-medium text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Providers Found Counter */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{providersFound}+</p>
                            <p className="text-gray-600">Providers found</p>
                        </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                        {[...Array(Math.min(providersFound, 6))].map((_, i) => (
                            <div key={i} className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-bounce">
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                        {providersFound > 6 && (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm">
                                +{providersFound - 6}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 flex items-center space-x-3 shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <feature.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                        </div>
                    ))}
                </div>

                {/* Estimated Time */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-center text-center">
                        <Clock className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-gray-600">
                            Estimated wait time: <span className="font-semibold text-gray-900">1-3 minutes</span>
                        </span>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                        We'll notify you when a provider accepts your request
                    </p>
                </div>

                {/* Loading Animation */}
                <div className="mt-8 flex justify-center">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderSearching;