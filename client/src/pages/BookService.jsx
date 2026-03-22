import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, Calendar, Check, AlertCircle, Clock, ChevronRight, ChevronLeft, CreditCard, Star, Shield, Search, Navigation } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';

const BookService = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const [service, setService] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        lat: null,
        lng: null
    });
    const [description, setDescription] = useState('');
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [geolocationEnabled, setGeolocationEnabled] = useState(false);

    useEffect(() => {
        // Prefer service from navigation state to avoid flicker and ensure consistency
        const fromState = location.state?.service;
        if (fromState) {
            setService(fromState);
            setLoading(false);
        } else {
            fetchServiceDetails();
        }
    }, [serviceId]);

    const fetchServiceDetails = async () => {
        try {
            const res = await api.get('/services/provider-services');
            if (res.data.success) {
                const offerings = res.data.data || [];
                const candidates = offerings.filter(o => String(o.service?._id) === String(serviceId));
                if (candidates.length > 0) {
                    // choose the lowest providerPrice for display
                    const best = candidates.reduce((min, o) => (o.providerPrice < min.providerPrice ? o : min), candidates[0]);
                    setService({
                        _id: best.service._id,
                        name: best.service.name,
                        description: best.service.description,
                        category: best.service.category,
                        price: best.providerPrice
                    });
                } else {
                    setError('Service details unavailable');
                }
            } else {
                setError('Service details unavailable');
            }
        } catch (err) {
            setError('Failed to fetch service details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setAddress(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude
                    }));
                    toast.success('Location detected successfully!');
                    setGeolocationEnabled(true);
                },
                (error) => {
                    toast.error(`Error getting location: ${error.message}`);
                    console.error('Geolocation error:', error);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            toast.error('Geolocation is not supported by this browser.');
        }
    };

    const handleMapClick = (e) => {
        // In a real implementation, this would integrate with Google Maps
        // For now, we'll simulate setting coordinates
        const mockLat = 12.9716 + (Math.random() - 0.5) * 0.01;
        const mockLng = 77.5946 + (Math.random() - 0.5) * 0.01;
        setAddress(prev => ({
            ...prev,
            lat: mockLat,
            lng: mockLng
        }));
        toast.success('Location selected on map!');
    };

    const confirmBooking = async () => {
        setSubmitting(true);
        setError('');
        const toastId = toast.loading('Confirming your booking...');

        try {
            const scheduledDate = new Date(`${date}T${time}`);

            // Payload without price (backend derives authoritative price)
            const payload = {
                serviceId,
                serviceName: service.name,
                date: scheduledDate,
                address: {
                    ...address,
                    lat: address.lat,
                    lng: address.lng
                },
                phoneNumber: phone,
                description
            };

            await api.post('/bookings', payload);

            toast.success('Booking confirmed! Redirecting...', { id: toastId });
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Booking failed. Please try again.', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

    if (!service) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={48} className="text-error-500 mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Service Not Found</h2>
            <p className="text-neutral-500 mb-6">The service you are trying to book is no longer available or the link is invalid.</p>
            <Button onClick={() => navigate('/services')}>Browse Services</Button>
        </div>
    );

    const steps = [
        { id: 1, name: 'Schedule', icon: Calendar },
        { id: 2, name: 'Location', icon: MapPin },
        { id: 3, name: 'Confirm', icon: Check },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 pb-20 pt-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Stepper */}
                <div className="mb-10">
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center">
                            {steps.map((s, stepIdx) => (
                                <li key={s.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                    {s.id < step ? (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-primary-600" />
                                            </div>
                                            <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 hover:bg-primary-900">
                                                <Check className="h-5 w-5 text-white" aria-hidden="true" />
                                            </a>
                                        </>
                                    ) : s.id === step ? (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-neutral-200" />
                                            </div>
                                            <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-600 bg-white" aria-current="step">
                                                <span className="h-2.5 w-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-neutral-200" />
                                            </div>
                                            <a href="#" className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-300 bg-white hover:border-neutral-400">
                                                <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-neutral-300" aria-hidden="true" />
                                            </a>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                    {step === 1 && <><Calendar className="text-primary-600" /> Choose Date & Time</>}
                                    {step === 2 && <><MapPin className="text-primary-600" /> Service Location</>}
                                    {step === 3 && <><CreditCard className="text-primary-600" /> Review & Payment</>}
                                </h2>
                                <p className="text-neutral-500 text-sm mt-1">
                                    {step === 1 && "Select a convenient slot for your service."}
                                    {step === 2 && "Where should the professional arrive?"}
                                    {step === 3 && "Verify details and complete secure payment."}
                                </p>
                            </div>

                            {step === 1 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Date"
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        <Input
                                            label="Time"
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-900">Instant Confirmation</h4>
                                            <p className="text-xs text-blue-700 mt-1">Provider will be assigned immediately after booking.</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={() => setStep(2)}
                                            disabled={!date || !time}
                                            className="gap-2"
                                        >
                                            Next Step <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <Input
                                        label="Street Address"
                                        name="street"
                                        value={address.street}
                                        onChange={handleAddressChange}
                                        placeholder="123 Main St"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="City"
                                            name="city"
                                            value={address.city}
                                            onChange={handleAddressChange}
                                        />
                                        <Input
                                            label="State"
                                            name="state"
                                            value={address.state}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <Input
                                        label="ZIP Code"
                                        name="zip"
                                        value={address.zip}
                                        onChange={handleAddressChange}
                                    />

                                    {/* Google Maps Integration */}
                                    <div className="pt-4 border-t border-neutral-100">
                                        <h3 className="text-sm font-medium text-neutral-900 mb-3 flex items-center gap-2">
                                            <Navigation size={16} /> Select Location on Map
                                        </h3>

                                        <div className="flex gap-3 mb-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={getCurrentLocation}
                                                className="flex items-center gap-2"
                                            >
                                                <MapPin size={16} /> Use Current Location
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsMapVisible(!isMapVisible)}
                                                className="flex items-center gap-2"
                                            >
                                                <Search size={16} /> Show Map
                                            </Button>
                                        </div>

                                        {isMapVisible && (
                                            <div
                                                className="h-64 bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
                                                onClick={handleMapClick}
                                            >
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <MapPin className="text-primary-600" size={32} />
                                                    </div>
                                                    <p className="text-neutral-600 font-medium mb-1">Click on the map to select location</p>
                                                    <p className="text-sm text-neutral-500">Your provider will navigate to this exact location</p>
                                                    {address.lat && address.lng && (
                                                        <p className="text-sm text-success-600 mt-2">Location set: ({address.lat.toFixed(4)}, {address.lng.toFixed(4)})</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!isMapVisible && address.lat && address.lng && (
                                            <div className="bg-success-50 p-3 rounded-lg border border-success-200">
                                                <p className="text-sm text-success-700 flex items-center gap-2">
                                                    <Check size={16} /> Location confirmed: ({address.lat.toFixed(4)}, {address.lng.toFixed(4)})
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-neutral-100">
                                        <h3 className="text-sm font-medium text-neutral-900 mb-3">Contact Details</h3>
                                        <Input
                                            label="Phone Number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            required
                                        />
                                        <p className="text-xs text-neutral-500 mt-2">
                                            Booking updates will be sent to <span className="font-medium text-neutral-900">{user?.email}</span>
                                        </p>
                                    </div>
                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                            <ChevronLeft size={16} /> Back
                                        </Button>
                                        <Button
                                            onClick={() => setStep(3)}
                                            disabled={!address.street || !address.city || !address.zip || !phone}
                                            className="gap-2"
                                        >
                                            Next Step <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Additional Notes</label>
                                            <textarea
                                                className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                                                rows="3"
                                                placeholder="Any specific instructions for the provider..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>

                                        {typeof service?.price === 'number' && (
                                            <div className="bg-neutral-50 p-4 rounded-lg space-y-3 border border-neutral-100">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-neutral-500">Service Fee</span>
                                                    <span className="font-medium">₹{Number(service.price).toFixed(2)}</span>
                                                </div>
                                                <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
                                                    <span className="font-bold text-neutral-900">Total</span>
                                                    <span className="text-xl font-bold text-primary-600">₹{Number(service.price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                                            <ChevronLeft size={16} /> Back
                                        </Button>
                                        <Button
                                            onClick={confirmBooking}
                                            isLoading={submitting}
                                            className="gap-2 bg-success-500 hover:bg-success-700 focus:ring-success-500"
                                        >
                                            Confirm Booking <Check size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="bg-neutral-900 text-white border-none">
                                <h3 className="text-lg font-bold mb-4">Order Summary</h3>

                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-700">
                                    <div className="text-4xl">{service.image || '✨'}</div>
                                    <div>
                                        <p className="font-semibold">{service.name}</p>
                                        <div className="flex items-center text-yellow-400 text-xs mt-1">
                                            <Star size={12} fill="currentColor" className="mr-1" />
                                            4.8 (120+ reviews)
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm text-neutral-400">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={16} className="mt-0.5" />
                                        <div>
                                            <p className="text-neutral-300 font-medium">Date & Time</p>
                                            <p>{date ? new Date(date).toLocaleDateString() : 'Select date'}</p>
                                            <p>{time ? time : 'Select time'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={16} className="mt-0.5" />
                                        <div>
                                            <p className="text-neutral-300 font-medium">Address</p>
                                            <p>{address.street ? address.street : 'Select address'}</p>
                                            {address.city && <p>{address.city}, {address.state} {address.zip}</p>}
                                            {address.lat && address.lng && (
                                                <p className="text-xs text-neutral-400 mt-1">GPS: ({address.lat.toFixed(4)}, {address.lng.toFixed(4)})</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-neutral-700">
                                    <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400">
                                        <Shield size={12} />
                                        <span>100% Satisfaction Guarantee</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookService;
