import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, MapPin, Clock } from 'lucide-react';

const ProviderSettings = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        serviceRadius: 50,
        isAvailable: true,
        bio: '',
        experienceYears: 0,
        name: '',
        phone: '',
        licenseNumber: '',
        insuranceDetails: '',
        certifications: '',
        languages: '',
        businessHours: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/providers/me');
            if (res.data.success) {
                const data = res.data.data;
                setProfile(data);
                setFormData({
                    serviceRadius: data.serviceRadius || 50,
                    isAvailable: data.isAvailable,
                    bio: data.bio || '',
                    experienceYears: data.experienceYears || 0,
                    name: data.user?.name || '',
                    phone: data.phone || '',
                    licenseNumber: data.licenseNumber || '',
                    insuranceDetails: data.insuranceDetails || '',
                    certifications: data.certifications || '',
                    languages: data.languages || '',
                    businessHours: data.businessHours || ''
                });
            }
        } catch (err) {
            toast.error("Failed to load profile settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
        
    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving settings...');
        try {
            const res = await api.put('/providers/me', formData);
            if (res.data.success) {
                toast.success('Settings updated!', { id: toastId });
                setProfile(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to update settings", { id: toastId });
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Provider Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleProfileChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="John Doe"
                            />
                        </div>
                                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleProfileChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="(123) 456-7890"
                            />
                        </div>
                    </div>
                </div>
            
                {/* Professional Information Section */}
                <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
                                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                            <input
                                type="number"
                                name="experienceYears"
                                value={formData.experienceYears}
                                onChange={handleProfileChange}
                                min="0"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            />
                        </div>
                                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                            <input
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleProfileChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="License number"
                            />
                        </div>
                    </div>
                                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                        <input
                            type="text"
                            name="certifications"
                            value={formData.certifications}
                            onChange={handleProfileChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            placeholder="e.g., HVAC Certified, Electrician License"
                        />
                    </div>
                                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
                        <input
                            type="text"
                            name="languages"
                            value={formData.languages}
                            onChange={handleProfileChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            placeholder="e.g., English, Spanish, French"
                        />
                    </div>
                                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
                        <input
                            type="text"
                            name="businessHours"
                            value={formData.businessHours}
                            onChange={handleProfileChange}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            placeholder="e.g., Mon-Fri 8AM-6PM"
                        />
                    </div>
                </div>
            
                {/* Service Settings Section */}
                <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Settings</h2>
                                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <MapPin size={16} className="mr-1" /> Service Radius (km)
                            </label>
                            <input
                                type="number"
                                name="serviceRadius"
                                value={formData.serviceRadius}
                                onChange={handleProfileChange}
                                min="1"
                                max="100"
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            />
                            <p className="text-xs text-gray-500 mt-1">Maximum distance you're willing to travel for jobs.</p>
                        </div>
                                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                Insurance Details
                            </label>
                            <input
                                type="text"
                                name="insuranceDetails"
                                value={formData.insuranceDetails}
                                onChange={handleProfileChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="Insurance company and policy details"
                            />
                        </div>
                    </div>
                                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Clock size={16} className="mr-1" /> Availability Status
                        </label>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Turn off to stop receiving new job requests temporarily.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleProfileChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            
                {/* Bio Section */}
                <div className="pb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Bio</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            About You
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleProfileChange}
                            rows="4"
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            placeholder="Tell customers about your expertise, background, and what makes you stand out..."
                        ></textarea>
                    </div>
                </div>
            
                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center transition"
                    >
                        <Save size={20} className="mr-2" />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProviderSettings;
