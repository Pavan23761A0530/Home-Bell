import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Trash2, Edit, CheckCircle, Home, Building, Car, Heart, Tag, Globe } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'home',
        street: '',
        city: '',
        state: '',
        zip: '',
        isDefault: false
    });
    const [editingId, setEditingId] = useState(null);
    const [editAddress, setEditAddress] = useState({});
    
    const addressLabels = [
        { value: 'home', label: 'Home', icon: Home },
        { value: 'work', label: 'Work', icon: Building },
        { value: 'office', label: 'Office', icon: Building },
        { value: 'family', label: 'Family', icon: Heart },
        { value: 'friend', label: 'Friend', icon: Heart },
        { value: 'other', label: 'Other', icon: Tag }
    ];
    
    const getAddressIcon = (label) => {
        const found = addressLabels.find(item => item.value === label);
        return found ? found.icon : MapPin;
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            if (res.data.success) {
                setAddresses(res.data.data.addresses || []);
            }
        } catch (err) {
            toast.error("Failed to load addresses");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Adding address...');
        try {
            const res = await api.post('/users/addresses', newAddress);
            if (res.data.success) {
                setAddresses(res.data.data);
                setShowForm(false);
                setNewAddress({ label: 'home', street: '', city: '', state: '', zip: '', isDefault: false });
                toast.success('Address added!', { id: toastId });
            }
        } catch (err) {
            toast.error("Failed to add address", { id: toastId });
        }
    };
    
    const handleEditAddress = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating address...');
        try {
            const res = await api.put(`/users/addresses/${editingId}`, editAddress);
            if (res.data.success) {
                setAddresses(res.data.data);
                setEditingId(null);
                setEditAddress({});
                toast.success('Address updated!', { id: toastId });
            }
        } catch (err) {
            toast.error("Failed to update address", { id: toastId });
        }
    };
    
    const startEdit = (address) => {
        setEditAddress(address);
        setEditingId(address._id);
    };
    
    const cancelEdit = () => {
        setEditingId(null);
        setEditAddress({});
    };
    
    const setAsDefault = async (id) => {
        const toastId = toast.loading('Setting as default...');
        try {
            const res = await api.put(`/users/addresses/${id}/default`);
            if (res.data.success) {
                setAddresses(res.data.data);
                toast.success('Default address updated!', { id: toastId });
            }
        } catch (err) {
            toast.error("Failed to update default address", { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        const toastId = toast.loading('Deleting address...');
        try {
            const res = await api.delete(`/users/addresses/${id}`);
            if (res.data.success) {
                setAddresses(res.data.data);
                toast.success('Address deleted', { id: toastId });
            }
        } catch (err) {
            toast.error("Failed to delete address", { id: toastId });
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
                    <p className="text-gray-600 mt-1">Manage your saved locations for quick checkout</p>
                </div>
                <Button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                    }}
                    className="flex items-center gap-2"
                >
                    <Plus size={18} /> Add New Address
                </Button>
            </div>

            {(showForm || editingId) && (
                <Card className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <form onSubmit={editingId ? handleEditAddress : handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address Label</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={editingId ? editAddress.label : newAddress.label}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, label: e.target.value });
                                    } else {
                                        setNewAddress({ ...newAddress, label: e.target.value });
                                    }
                                }}
                                required
                            >
                                {addressLabels.map(label => (
                                    <option key={label.value} value={label.value}>{label.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                            <Input
                                type="text"
                                value={editingId ? editAddress.street : newAddress.street}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, street: e.target.value });
                                    } else {
                                        setNewAddress({ ...newAddress, street: e.target.value });
                                    }
                                }}
                                placeholder="Enter street address"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <Input
                                type="text"
                                value={editingId ? editAddress.city : newAddress.city}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, city: e.target.value });
                                    } else {
                                        setNewAddress({ ...newAddress, city: e.target.value });
                                    }
                                }}
                                placeholder="Enter city"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                            <Input
                                type="text"
                                value={editingId ? editAddress.state : newAddress.state}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, state: e.target.value });
                                    } else {
                                        setNewAddress({ ...newAddress, state: e.target.value });
                                    }
                                }}
                                placeholder="Enter state"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                            <Input
                                type="text"
                                value={editingId ? editAddress.zip : newAddress.zip}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, zip: e.target.value });
                                    } else {
                                        setNewAddress({ ...newAddress, zip: e.target.value });
                                    }
                                }}
                                placeholder="Enter ZIP code"
                                required
                            />
                        </div>
                        
                        <div className="flex items-center pt-6">
                            <input
                                type="checkbox"
                                id="isDefault"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={editingId ? editAddress.isDefault : newAddress.isDefault}
                                onChange={(e) => {
                                    if (editingId) {
                                        setEditAddress({ ...editAddress, isDefault: e.target.checked });
                                    } else {
                                        setNewAddress({ ...newAddress, isDefault: e.target.checked });
                                    }
                                }}
                            />
                            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                                Set as default address
                            </label>
                        </div>
                        
                        <div className="md:col-span-2 pt-4 flex gap-3">
                            <Button type="submit" className="flex-1">
                                {editingId ? 'Update Address' : 'Save Address'}
                            </Button>
                            <Button type="button" variant="outline" onClick={editingId ? cancelEdit : () => setShowForm(false)} className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((addr) => {
                    const IconComponent = getAddressIcon(addr.label);
                    return (
                        <Card key={addr._id} className="relative hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                        <IconComponent size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 capitalize flex items-center gap-2">
                                            {addr.label}
                                            {addr.isDefault && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <CheckCircle size={12} className="mr-1" />
                                                    Default
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-gray-600 text-sm mt-1">{addr.street}</p>
                                        <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(addr)}
                                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {!addr.isDefault && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAsDefault(addr._id)}
                                        className="text-xs"
                                    >
                                        Set as Default
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        // Logic to use this address for booking
                                        toast.success('Address selected for booking');
                                    }}
                                    className="text-xs flex-1"
                                >
                                    Use for Booking
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AddressBook;
