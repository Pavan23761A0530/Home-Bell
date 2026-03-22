import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users, Briefcase, FileText, Activity, TrendingUp, DollarSign,
    ShieldAlert, CheckCircle, XCircle, Trash2, Edit, Eye, UserX
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProviders: 0,
        totalBookings: 0,
        activeBookings: 0,
        totalServices: 0
    });
    const [users, setUsers] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [servicesModal, setServicesModal] = useState({ open: false, providerName: '', services: [] });
    const [userModal, setUserModal] = useState({ open: false, mode: 'view', user: null, form: { name: '', email: '', isVerified: false } });
    const [addUserModal, setAddUserModal] = useState({ open: false, form: { role: 'customer', name: '', email: '', password: '' }, submitting: false });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [dashboardRes, usersRes, providersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/providers')
            ]);

            if (dashboardRes.data.success) {
                const data = dashboardRes.data.data;
                console.log('Admin stats response:', data);
                setStats({
                    totalUsers: data.totalUsers,
                    totalProviders: data.totalProviders,
                    totalWorkers: data.totalWorkers,
                    totalBookings: data.totalBookings,
                    activeBookings: data.activeBookings,
                    activeServices: data.totalServices
                });
            }

            if (usersRes.data.success) {
                const usersData = usersRes.data.data;
                setUsers(usersData);
            }

            if (providersRes.data.success) {
                console.log('Providers fetched:', providersRes.data.count);
                setProviders(providersRes.data.data);
            }

        } catch (error) {
            console.error("Failed to load admin data", error);
            toast.error("Error loading dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, type, id, data = {}) => {
        const toastId = toast.loading(`${action}ing ${type}...`);
        try {
            let res;
            if (type === 'user') {
                if (action === 'Delete') {
                    if (!window.confirm(`Are you sure you want to delete this user?`)) {
                        toast.dismiss(toastId);
                        return;
                    }
                    res = await api.delete(`/admin/users/${id}`);
                } else if (action === 'Suspend') {
                    res = await api.put(`/admin/users/${id}`, { isVerified: false });
                } else if (action === 'Activate') {
                    res = await api.put(`/admin/users/${id}`, { isVerified: true });
                } else if (action === 'View') {
                    const u = users.find(x => x._id === id);
                    setUserModal({ open: true, mode: 'view', user: u || null, form: { name: u?.name || '', email: u?.email || '', isVerified: !!u?.isVerified } });
                    toast.dismiss(toastId);
                    return;
                } else if (action === 'Edit') {
                    const u = users.find(x => x._id === id);
                    setUserModal({ open: true, mode: 'edit', user: u || null, form: { name: u?.name || '', email: u?.email || '', isVerified: !!u?.isVerified } });
                    toast.dismiss(toastId);
                    return;
                }
            } else if (type === 'provider') {
                if (action === 'Approve') {
                    res = await api.put(`/admin/providers/${id}`, { verificationStatus: 'verified' });
                } else if (action === 'Reject') {
                    res = await api.put(`/admin/providers/${id}`, { verificationStatus: 'rejected' });
                } else if (action === 'View Services') {
                    const details = await api.get(`/admin/providers/${id}`);
                    const servicesRes = await api.get(`/admin/providers/${id}/services`);
                    if (details.data?.success && servicesRes.data?.success) {
                        const p = details.data.data;
                        const offerings = servicesRes.data.data;
                        setServicesModal({
                            open: true,
                            providerName: p?.user?.name || 'Provider',
                            services: offerings || []
                        });
                    }
                    toast.dismiss(toastId);
                    return;
                } else if (action === 'Delete') {
                    if (!window.confirm(`Are you sure you want to delete this provider?`)) {
                        toast.dismiss(toastId);
                        return;
                    }
                    // Delete the user associated with the provider for full cleanup
                    const provider = providers.find(p => p._id === id);
                    if (provider?.user?._id) {
                        res = await api.delete(`/admin/users/${provider.user._id}`);
                    }
                }
            }

            if (res?.data?.success) {
                console.log('Admin action success:', { action, type, id, response: res.data });
                toast.success(`${type} ${action} successfully`, { id: toastId });
                await fetchAllData(); // Refresh list
            } else {
                console.log('Admin action failed:', { action, type, id, response: res?.data });
                toast.error(`Failed to ${action} ${type}`, { id: toastId });
            }
        } catch (error) {
            console.error(`Action ${action} failed`, error);
            toast.error(error.response?.data?.error || `Error during ${action}`, { id: toastId });
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Total Providers', value: stats.totalProviders, icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Total Bookings', value: stats.totalBookings, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Active Services', value: stats.activeServices, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                <p className="text-neutral-500">Platform-wide overview and management.</p>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <Card key={index} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500">{card.title}</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{card.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Management Tabs */}
            <div className="border-b border-neutral-200">
                <nav className="flex space-x-8">
                    {['overview', 'users', 'providers', 'customers', 'workers'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Overview Section */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4">System Activity</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span>Recent Bookings</span>
                                <Badge variant="success">+{stats.activeBookings} Active</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Platform Health</span>
                                <span className="text-success-600 font-medium">Optimal</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActiveTab('users')} className="px-4 py-2 bg-neutral-100 rounded-lg text-sm hover:bg-neutral-200">Manage Users</button>
                            <button onClick={() => setActiveTab('providers')} className="px-4 py-2 bg-neutral-100 rounded-lg text-sm hover:bg-neutral-200">Manage Providers</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Manage Users Panel */}
            {activeTab === 'users' && (
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-neutral-900">Manage Users</h3>
                        <button
                            onClick={() => setAddUserModal({ open: true, form: { role: 'customer', name: '', email: '', password: '' }, submitting: false })}
                            className="px-3 py-2 rounded-lg"
                            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}
                        >
                            Add User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {users.map(u => (
                                    <tr key={u._id} className="text-sm hover:bg-neutral-50">
                                        <td className="px-6 py-4 font-medium">{u.name}</td>
                                        <td className="px-6 py-4">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.role === 'admin' ? 'warning' : 'info'}>{u.role}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.isVerified ? 'success' : 'neutral'}>
                                                {u.isVerified ? 'Active' : 'unverified'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction('View', 'user', u._id)} className="p-1 hover:text-primary-600" title="View"><Eye size={16} /></button>
                                                <button onClick={() => handleAction('Edit', 'user', u._id)} className="p-1 hover:text-blue-600" title="Edit"><Edit size={16} /></button>
                                                <button
                                                    onClick={() => u.isVerified ? handleAction('Suspend', 'user', u._id) : handleAction('Activate', 'user', u._id)}
                                                    className={`p-1 ${u.isVerified ? 'hover:text-orange-600' : 'hover:text-success-600'}`}
                                                    title={u.isVerified ? "Suspend" : "Activate"}
                                                >
                                                    {u.isVerified ? <UserX size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button onClick={() => handleAction('Delete', 'user', u._id)} className="p-1 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Manage Providers Panel */}
            {activeTab === 'providers' && (
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100">
                        <h3 className="text-lg font-bold text-neutral-900">Manage Providers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Provider Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Services Count</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {providers.map(p => (
                                    <tr key={p._id} className="text-sm hover:bg-neutral-50">
                                        <td className="px-6 py-4 font-medium">{p.user?.name}</td>
                                        <td className="px-6 py-4">{p.user?.email}</td>
                                        <td className="px-6 py-4">{p.servicesOffered?.length || 0} services</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={p.verificationStatus === 'verified' ? 'success' : p.verificationStatus === 'rejected' ? 'danger' : 'warning'}>
                                                {p.verificationStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction('Approve', 'provider', p._id)} className="p-1 hover:text-success-600" title="Approve"><CheckCircle size={16} /></button>
                                                <button onClick={() => handleAction('Reject', 'provider', p._id)} className="p-1 hover:text-red-600" title="Reject"><XCircle size={16} /></button>
                                                <button onClick={() => handleAction('View Services', 'provider', p._id)} className="p-1 hover:text-neutral-600" title="View Services"><Briefcase size={16} /></button>
                                                <button onClick={() => handleAction('Delete', 'provider', p._id)} className="p-1 hover:text-red-800" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Manage Customers Panel */}
            {activeTab === 'customers' && (
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-neutral-900">Manage Customers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {users.filter(u => u.role === 'customer').map(u => (
                                    <tr key={u._id} className="text-sm hover:bg-neutral-50">
                                        <td className="px-6 py-4 font-medium">{u.name}</td>
                                        <td className="px-6 py-4">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.isVerified ? 'success' : 'neutral'}>
                                                {u.isVerified ? 'Active' : 'unverified'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction('View', 'user', u._id)} className="p-1 hover:text-primary-600" title="View"><Eye size={16} /></button>
                                                <button onClick={() => handleAction('Edit', 'user', u._id)} className="p-1 hover:text-blue-600" title="Edit"><Edit size={16} /></button>
                                                <button
                                                    onClick={() => u.isVerified ? handleAction('Suspend', 'user', u._id) : handleAction('Activate', 'user', u._id)}
                                                    className={`p-1 ${u.isVerified ? 'hover:text-orange-600' : 'hover:text-success-600'}`}
                                                    title={u.isVerified ? "Suspend" : "Activate"}
                                                >
                                                    {u.isVerified ? <UserX size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button onClick={() => handleAction('Delete', 'user', u._id)} className="p-1 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Manage Workers Panel */}
            {activeTab === 'workers' && (
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-neutral-900">Manage Workers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {users.filter(u => u.role === 'worker').map(u => (
                                    <tr key={u._id} className="text-sm hover:bg-neutral-50">
                                        <td className="px-6 py-4 font-medium">{u.name}</td>
                                        <td className="px-6 py-4">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={u.isVerified ? 'success' : 'neutral'}>
                                                {u.isVerified ? 'Active' : 'unverified'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction('View', 'user', u._id)} className="p-1 hover:text-primary-600" title="View"><Eye size={16} /></button>
                                                <button onClick={() => handleAction('Edit', 'user', u._id)} className="p-1 hover:text-blue-600" title="Edit"><Edit size={16} /></button>
                                                <button
                                                    onClick={() => u.isVerified ? handleAction('Suspend', 'user', u._id) : handleAction('Activate', 'user', u._id)}
                                                    className={`p-1 ${u.isVerified ? 'hover:text-orange-600' : 'hover:text-success-600'}`}
                                                    title={u.isVerified ? "Suspend" : "Activate"}
                                                >
                                                    {u.isVerified ? <UserX size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button onClick={() => handleAction('Delete', 'user', u._id)} className="p-1 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            <Modal
                isOpen={servicesModal.open}
                onClose={() => setServicesModal({ open: false, providerName: '', services: [] })}
                title={`Services by ${servicesModal.providerName}`}
            >
                <div className="space-y-3">
                    {servicesModal.services.length === 0 ? (
                        <p className="text-sm text-neutral-600">No services found for this provider.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-3 py-2">Service</th>
                                        <th className="px-3 py-2">Category</th>
                                        <th className="px-3 py-2">Pricing Type</th>
                                        <th className="px-3 py-2">Provider Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {servicesModal.services.map((s, idx) => (
                                        <tr key={idx} className="text-sm">
                                            <td className="px-3 py-2">{s?.service?.name || 'Unknown'}</td>
                                            <td className="px-3 py-2">{s?.service?.category?.name || '-'}</td>
                                            <td className="px-3 py-2">{s?.pricingType || 'fixed'}</td>
                                            <td className="px-3 py-2">{typeof s?.providerPrice === 'number' ? `₹${s.providerPrice}` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
            <Modal
                isOpen={userModal.open}
                onClose={() => setUserModal({ open: false, mode: 'view', user: null, form: { name: '', email: '', isVerified: false } })}
                title={userModal.mode === 'edit' ? 'Edit User' : 'User Details'}
            >
                {userModal.user ? (
                    <div className="space-y-4">
                        {userModal.mode === 'view' ? (
                            <div className="space-y-2">
                                <div className="text-sm"><span className="font-medium">Name:</span> {userModal.user.name}</div>
                                <div className="text-sm"><span className="font-medium">Email:</span> {userModal.user.email}</div>
                                <div className="text-sm"><span className="font-medium">Role:</span> {userModal.user.role}</div>
                                <div className="text-sm"><span className="font-medium">Status:</span> {userModal.user.isVerified ? 'Active' : 'Unverified'}</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Input label="Name" value={userModal.form.name} onChange={(e) => setUserModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} />
                                <Input label="Email" value={userModal.form.email} onChange={(e) => setUserModal(prev => ({ ...prev, form: { ...prev.form, email: e.target.value } }))} />
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={userModal.form.isVerified} onChange={(e) => setUserModal(prev => ({ ...prev, form: { ...prev.form, isVerified: e.target.checked } }))} />
                                    Verified
                                </label>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 border border-neutral-300 rounded-lg" onClick={() => setUserModal({ open: false, mode: 'view', user: null, form: { name: '', email: '', isVerified: false } })}>Close</button>
                            {userModal.mode === 'edit' && (
                                <button
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg"
                                    onClick={async () => {
                                        const toastId = toast.loading('Saving user...');
                                        try {
                                            const payload = { name: userModal.form.name, email: userModal.form.email, isVerified: userModal.form.isVerified };
                                            const res = await api.put(`/admin/users/${userModal.user._id}`, payload);
                                            if (res.data?.success) {
                                                toast.success('User updated', { id: toastId });
                                                setUserModal({ open: false, mode: 'view', user: null, form: { name: '', email: '', isVerified: false } });
                                                await fetchAllData();
                                            } else {
                                                toast.error('Failed to update user', { id: toastId });
                                            }
                                        } catch (err) {
                                            toast.error(err.response?.data?.error || 'Failed to update user', { id: toastId });
                                        }
                                    }}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-neutral-600">User not found</div>
                )}
            </Modal>
            <Modal
                isOpen={addUserModal.open}
                onClose={() => setAddUserModal({ open: false, form: { role: 'customer', name: '', email: '', password: '' }, submitting: false })}
                title="Add User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                            value={addUserModal.form.role}
                            onChange={(e) => setAddUserModal(prev => ({ ...prev, form: { ...prev.form, role: e.target.value } }))}
                        >
                            <option value="customer">Customer</option>
                            <option value="provider">Provider</option>
                            <option value="worker">Worker</option>
                        </select>
                    </div>
                    <Input label="Username" value={addUserModal.form.name} onChange={(e) => setAddUserModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} />
                    <Input label="Email" type="email" value={addUserModal.form.email} onChange={(e) => setAddUserModal(prev => ({ ...prev, form: { ...prev.form, email: e.target.value } }))} />
                    <Input label="Password" type="password" value={addUserModal.form.password} onChange={(e) => setAddUserModal(prev => ({ ...prev, form: { ...prev.form, password: e.target.value } }))} />
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg border"
                            onClick={() => setAddUserModal({ open: false, form: { role: 'customer', name: '', email: '', password: '' }, submitting: false })}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg"
                            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}
                            disabled={addUserModal.submitting}
                            onClick={async () => {
                                const { role, name, email, password } = addUserModal.form;
                                if (!name || !email || !password) {
                                    toast.error('All fields are required');
                                    return;
                                }
                                setAddUserModal(prev => ({ ...prev, submitting: true }));
                                const toastId = toast.loading('Creating user...');
                                try {
                                    let registerRole = role;
                                    if (role === 'worker') {
                                        registerRole = 'customer';
                                    }
                                    const res = await api.post('/auth/register', { name, email, password, role: registerRole });
                                    if (!res.data?.success) {
                                        throw new Error(res.data?.error || 'Registration failed');
                                    }
                                    const newUserId = res.data?.user?.id;
                                    if (role === 'worker' && newUserId) {
                                        await api.put(`/admin/users/${newUserId}`, { role: 'worker' });
                                    }
                                    toast.success('User created', { id: toastId });
                                    setAddUserModal({ open: false, form: { role: 'customer', name: '', email: '', password: '' }, submitting: false });
                                    await fetchAllData();
                                } catch (err) {
                                    const msg = err.response?.data?.error || err.message || 'Failed to create user';
                                    toast.error(msg, { id: toastId });
                                    setAddUserModal(prev => ({ ...prev, submitting: false }));
                                }
                            }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
