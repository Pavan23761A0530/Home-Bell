import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Trash2, CheckCircle, XCircle, UserPlus, Filter, MoreVertical } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, customer, provider, admin
    const [addModal, setAddModal] = useState({ open: false, submitting: false, form: { role: 'customer', name: '', email: '', password: '' } });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users'); // Need to ensure backend has this or similar
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (error) {
            alert("Failed to delete user");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || user.role === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
                    <p className="text-neutral-600 mt-1">View and manage platform users.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="primary" className="flex items-center gap-2" onClick={() => setAddModal({ open: true, submitting: false, form: { role: 'customer', name: '', email: '', password: '' } })}>
                        <UserPlus size={18} /> Add User
                    </Button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Roles</option>
                        <option value="customer">Customers</option>
                        <option value="provider">Providers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${user.role === 'admin' ? 'bg-purple-500' : user.role === 'provider' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-neutral-900">{user.name}</div>
                                                <div className="text-sm text-neutral-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'provider' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                                            <CheckCircle size={12} className="mr-1" /> Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                        {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
                                                <MoreVertical size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="text-error-600 hover:text-error-800 transition-colors p-1"
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
                
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <UserPlus className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900">No users found</h3>
                        <p className="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </Card>
            <Modal
                isOpen={addModal.open}
                onClose={() => setAddModal({ open: false, submitting: false, form: { role: 'customer', name: '', email: '', password: '' } })}
                title="Add User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                            value={addModal.form.role}
                            onChange={(e) => setAddModal(prev => ({ ...prev, form: { ...prev.form, role: e.target.value } }))}
                        >
                            <option value="customer">Customer</option>
                            <option value="provider">Provider</option>
                            <option value="worker">Worker</option>
                        </select>
                    </div>
                    <Input label="Username" value={addModal.form.name} onChange={(e) => setAddModal(prev => ({ ...prev, form: { ...prev.form, name: e.target.value } }))} />
                    <Input label="Email" type="email" value={addModal.form.email} onChange={(e) => setAddModal(prev => ({ ...prev, form: { ...prev.form, email: e.target.value } }))} />
                    <Input label="Password" type="password" value={addModal.form.password} onChange={(e) => setAddModal(prev => ({ ...prev, form: { ...prev.form, password: e.target.value } }))} />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setAddModal({ open: false, submitting: false, form: { role: 'customer', name: '', email: '', password: '' } })}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            isLoading={addModal.submitting}
                            onClick={async () => {
                                const { role, name, email, password } = addModal.form;
                                if (!name || !email || !password) {
                                    toast.error('All fields are required');
                                    return;
                                }
                                setAddModal(prev => ({ ...prev, submitting: true }));
                                const toastId = toast.loading('Creating user...');
                                try {
                                    let registerRole = role;
                                    if (role === 'worker') registerRole = 'customer';
                                    const res = await api.post('/auth/register', { name, email, password, role: registerRole });
                                    if (!res.data?.success) {
                                        throw new Error(res.data?.error || 'Registration failed');
                                    }
                                    const newUserId = res.data?.user?.id;
                                    if (role === 'worker' && newUserId) {
                                        await api.put(`/admin/users/${newUserId}`, { role: 'worker' });
                                    }
                                    toast.success('User created', { id: toastId });
                                    setAddModal({ open: false, submitting: false, form: { role: 'customer', name: '', email: '', password: '' } });
                                    await fetchUsers();
                                } catch (err) {
                                    const msg = err.response?.data?.error || err.message || 'Failed to create user';
                                    toast.error(msg, { id: toastId });
                                    setAddModal(prev => ({ ...prev, submitting: false }));
                                }
                            }}
                        >
                            Create
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminUsers;
