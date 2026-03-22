import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Save, X, Grid3X3, Tag, FolderOpen } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminServices = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); // ID of service being edited
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [activeTab, setActiveTab] = useState('services'); // services, categories

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        basePrice: '',
        durationHours: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, categoriesRes] = await Promise.all([
                api.get('/services'),
                api.get('/services/categories')
            ]);
            if (servicesRes.data.success) setServices(servicesRes.data.data);
            if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
        } catch (err) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving service...');
        try {
            const payload = {
                // Backend-required fields
                name: formData.name,
                description: formData.description,
                basePrice: Number(formData.basePrice),
                category: formData.category,
                // Compatibility fields if backend supports alternative names
                title: formData.name,
                price: Number(formData.basePrice),
                categoryId: formData.category
            };

            if (isEditing) {
                const res = await api.put(`/services/${isEditing}`, payload);
                if (!res.data?.success) throw new Error(res.data?.error || 'Update failed');
            } else {
                const res = await api.post('/services', payload);
                if (!res.data?.success) throw new Error(res.data?.error || 'Create failed');
            }

            toast.success('Service saved!', { id: toastId });
            fetchData();
            resetForm();
        } catch (err) {
            toast.error("Failed to save service", { id: toastId });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will affect all bookings using this service.")) return;

        try {
            const res = await api.delete(`/services/${id}`);
            if (res.data?.success) {
                toast.success("Service deleted");
            } else {
                throw new Error(res.data?.error || 'Delete failed');
            }
            fetchData();
        } catch (err) {
            toast.error("Failed to delete service");
        }
    };

    const startEdit = (service) => {
        setIsEditing(service._id);
        setIsAdding(true);
        setFormData({
            name: service.name,
            category: service.category?._id || service.category, // handle populated or ID
            description: service.description,
            basePrice: service.basePrice,
            durationHours: service.durationHours
        });
    };

    const resetForm = () => {
        setIsEditing(null);
        setIsAdding(false);
        setFormData({ name: '', category: '', description: '', basePrice: '', durationHours: 1 });
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Creating category...');
        try {
            await api.post('/services/categories', categoryForm);
            toast.success('Category created!', { id: toastId });
            setCategoryForm({ name: '', description: '' });
            setIsAddingCategory(false);
            fetchData();
        } catch (err) {
            toast.error('Failed to create category', { id: toastId });
        }
    };

    const handleCategoryDelete = async (id) => {
        if (!window.confirm('Are you sure? Deleting a category will affect all services in it.')) return;
        const toastId = toast.loading('Deleting category...');
        try {
            await api.delete(`/services/categories/${id}`);
            toast.success('Category deleted!', { id: toastId });
            fetchData();
        } catch (err) {
            toast.error('Failed to delete category', { id: toastId });
        }
    };

    const handleCategoryEdit = (category) => {
        setCategoryForm({ name: category.name, description: category.description });
        setIsAddingCategory(true);
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: '', description: '' });
        setIsAddingCategory(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <Grid3X3 className="text-primary-600" size={32} /> Service Management
                    </h1>
                    <p className="text-neutral-600 mt-1">Manage services and categories for the platform.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => { resetForm(); setIsAdding(true); setActiveTab('services'); }}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Service
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => { resetCategoryForm(); setIsAddingCategory(true); setActiveTab('categories'); }}
                        className="flex items-center gap-2"
                    >
                        <Tag size={18} /> Add Category
                    </Button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="border-b border-neutral-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeTab === 'services'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                        }`}
                    >
                        <FolderOpen size={18} /> Services ({services.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeTab === 'categories'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                        }`}
                    >
                        <Tag size={18} /> Categories ({categories.length})
                    </button>
                </nav>
            </div>

            {/* Service Form */}
            {isAdding && activeTab === 'services' && (
                <Card className="p-6 mb-6 relative">
                    <button 
                        onClick={resetForm} 
                        className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-neutral-900 mb-6">
                        {isEditing ? 'Edit Service' : 'Add New Service'}
                    </h2>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Service Name</label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter service name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                            <select
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Base Price (₹)</label>
                            <Input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                placeholder="0"
                                min="0"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                            <textarea
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the service in detail"
                                required
                            ></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex items-center gap-2"
                            >
                                <Save size={18} /> {isEditing ? 'Update Service' : 'Create Service'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Category Form */}
            {isAddingCategory && activeTab === 'categories' && (
                <Card className="p-6 mb-6 relative">
                    <button 
                        onClick={resetCategoryForm} 
                        className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-neutral-900 mb-6">Add New Category</h2>
                    <form onSubmit={handleCategorySubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Category Name</label>
                            <Input
                                type="text"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="e.g., Cleaning, Plumbing, Electrical"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                            <textarea
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows="3"
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                placeholder="Brief description of this category"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetCategoryForm}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex items-center gap-2"
                            >
                                <Save size={18} /> Create Category
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Services Tab Content */}
            {activeTab === 'services' && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {services.map((service) => (
                                    <tr key={service._id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-neutral-900">{service.name}</div>
                                                <div className="text-sm text-neutral-500 line-clamp-1">{service.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {service.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                            ₹{service.basePrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {service.durationHours} hour{service.durationHours > 1 ? 's' : ''}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => startEdit(service)}
                                                    className="text-primary-600 hover:text-primary-800 transition-colors p-1"
                                                    title="Edit service"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(service._id)}
                                                    className="text-error-600 hover:text-error-800 transition-colors p-1"
                                                    title="Delete service"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {services.length === 0 && (
                        <div className="text-center py-12">
                            <FolderOpen className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900">No services found</h3>
                            <p className="mt-1 text-sm text-neutral-500">Get started by creating a new service.</p>
                            <div className="mt-6">
                                <Button onClick={() => { resetForm(); setIsAdding(true); }}>
                                    <Plus size={18} className="mr-2" /> Add Service
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Categories Tab Content */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <Card key={category._id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900">{category.name}</h3>
                                    <p className="text-sm text-neutral-600 mt-2">{category.description || 'No description'}</p>
                                    <div className="mt-4 flex items-center text-sm text-neutral-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                            {category.services?.length || 0} services
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleCategoryEdit(category)}
                                        className="text-primary-600 hover:text-primary-800 transition-colors p-1"
                                        title="Edit category"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleCategoryDelete(category._id)}
                                        className="text-error-600 hover:text-error-800 transition-colors p-1"
                                        title="Delete category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    
                    {categories.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <Tag className="mx-auto h-12 w-12 text-neutral-400" />
                            <h3 className="mt-2 text-sm font-medium text-neutral-900">No categories found</h3>
                            <p className="mt-1 text-sm text-neutral-500">Get started by creating a new category.</p>
                            <div className="mt-6">
                                <Button onClick={() => { resetCategoryForm(); setIsAddingCategory(true); }}>
                                    <Plus size={18} className="mr-2" /> Add Category
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminServices;
