import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Modal from '../components/common/Modal';
import cleaningImage from '../assets/cleaning.jpg';
import plumbingImage from '../assets/plumbing.webp';
import electricianImage from '../assets/electician.jpeg';
import movingImage from '../assets/moving.webp';
import paintingImage from '../assets/painting.webp';
import applianceImage from '../assets/repairing.jpg';
import gardeningImage from '../assets/gardeining.webp';

const ProviderServices = () => {
    const [services, setServices] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [experience, setExperience] = useState('');
    const [pricingType, setPricingType] = useState('fixed');

    const categoryImages = {
        Cleaning: cleaningImage,
        Plumbing: plumbingImage,
        Electrician: electricianImage,
        Moving: movingImage,
        Painting: paintingImage,
        Appliance: applianceImage,
        Gardening: gardeningImage
    };

    const getCategoryName = (service) => {
        if (!service || !service.category) return '';
        return typeof service.category === 'string' ? service.category : service.category.name || '';
    };

    const getServiceImage = (service) => {
        const categoryName = getCategoryName(service);
        return categoryImages[categoryName] || cleaningImage;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [myServicesRes, allServicesRes] = await Promise.all([
                api.get('/providers/services'),
                api.get('/services')
            ]);

            if (myServicesRes.data.success) {
                // Filter out any services that might be null due to deletion
                const validOfferings = (myServicesRes.data.data || []).filter(item => item && item.service);
                setServices(validOfferings);
            }
            if (allServicesRes.data.success) setAvailableServices(allServicesRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveService = async () => {
        if (!selectedServiceId) return;

        try {
            if (editingService) {
                // Update existing - only triggers sync with admin price
                await api.put(`/providers/services/${selectedServiceId}`, {});
            } else {
                // Add new
                await api.post('/providers/services', {
                    serviceId: selectedServiceId
                });
            }

            setShowAddModal(false);
            setShowEditModal(false);
            setEditingService(null);
            fetchData();
            // Reset form
            setSelectedServiceId('');
            setExperience('');
        } catch (error) {
            alert(error?.response?.data?.error || "Failed to save service.");
        }
    };

    const startEdit = (offering) => {
        if (!offering?.service?._id) return;
        setEditingService(offering);
        setSelectedServiceId(offering.service._id);
        setCustomPrice(offering.providerPrice || '');
        setPricingType(offering.pricingType || 'fixed');
        setShowEditModal(true);
    };

    const handleRemoveService = async (serviceId) => {
        if (!serviceId) return;
        if (!window.confirm("Are you sure you want to stop offering this service?")) return;
        try {
            await api.delete(`/providers/services/${serviceId}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const openAddModal = () => {
        setSelectedServiceId('');
        setCustomPrice('');
        setExperience('');
        setPricingType('fixed');
        setShowAddModal(true);
    };

    const selectedService = availableServices.find(s => s._id === selectedServiceId);

    if (loading) return <div>Loading services...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
                    <p className="text-gray-600">Manage the services you offer to customers.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>Add Service</span>
                </button>
            </header>

            {/* Add Service Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Service"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">-- Choose a service --</option>
                            {availableServices.map(s => (
                                <option key={s._id} value={s._id}>{s.name} (₹{s.basePrice} - {s.pricingType})</option>
                            ))}
                        </select>
                    </div>
                    {selectedService && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">
                                <strong>Admin Pricing:</strong> ₹{selectedService.basePrice} ({selectedService.pricingType})
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Price is fixed by admin and cannot be modified.
                            </p>
                        </div>
                    )}
                    {selectedService && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview service details</h3>
                            <div className="flex items-start space-x-3">
                                <img
                                    src={getServiceImage(selectedService)}
                                    alt={selectedService.name}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-gray-900">{selectedService.name}</div>
                                    <div className="text-xs text-gray-500">{getCategoryName(selectedService)}</div>
                                    {selectedService.description && (
                                        <p className="text-xs text-gray-600">{selectedService.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveService}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Service
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Service Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Service"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800">
                            <strong>Service:</strong> {selectedService?.name}
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                            <strong>Admin Pricing:</strong> ₹{selectedService?.basePrice} ({selectedService?.pricingType})
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                            Prices are managed by admin. Click update to sync with current admin rates.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveService}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Sync Price
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.length > 0 ? (
                            services.map((item, index) => (
                                <tr key={item.service?._id || index}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.service?.name || 'Unknown Service'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {typeof item.service?.category === 'object' ? item.service.category?.name : (item.service?.category || 'No Category')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 capitalize">{item.pricingType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">₹{typeof item.providerPrice === 'number' ? item.providerPrice : ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => startEdit(item)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveService(item.service._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    You haven't added any services yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProviderServices;
