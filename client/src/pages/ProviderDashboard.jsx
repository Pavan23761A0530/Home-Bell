import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Briefcase, DollarSign, Star, CheckCircle, MapPin, Calendar, Clock, ArrowRight, ToggleLeft, ToggleRight, Phone, MessageSquare, Filter, Search, Bell, UserCheck, Package, Users, Plus, Trash2, Edit } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import io from 'socket.io-client';

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [activeJobs, setActiveJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [workers, setWorkers] = useState([]);
    const [showAddWorker, setShowAddWorker] = useState(false);
    const [workerForm, setWorkerForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        skill: '',
        address: { street: '', city: '', state: '', zip: '' }
    });

    useEffect(() => {
        if (user && user.role === 'provider') {
            fetchDashboardData();
        }
    }, [user]);

    useEffect(() => {
        if (!user || user.role !== 'provider') return;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(API_URL, { auth: { token: localStorage.getItem('token') } });
        socket.on('new_notification', () => {
            fetchDashboardData();
        });
        return () => socket.disconnect();
    }, [user]);

    const fetchDashboardData = async () => {
        if (!user || user.role !== 'provider') return;

        try {
            const statsRes = await api.get('/providers/stats');
            if (statsRes.data.success) setStats(statsRes.data.data);

            console.log('Fetching provider bookings via auth (provider/me)');
            const jobsRes = await api.get(`/bookings/provider/me`);
            if (jobsRes.data.success) {
                const jobs = (jobsRes.data.data || []).map(j => ({
                    ...j,
                    statusDisplay: j.statusNormalized || j.status
                }));
                console.log('Provider bookings status values:', jobs.map(j => j.status));
                const visibleJobs = jobs.filter(j => ['pending', 'ongoing', 'assigned'].includes(j.statusDisplay));
                setActiveJobs(visibleJobs);
            } else {
                setActiveJobs([]);
            }

            const workersRes = await api.get(`/workers`);
            if (workersRes.data.success) {
                setWorkers(workersRes.data.data || []);
            } else {
                setWorkers([]);
            }
        } catch (error) {
            console.error(error);
            setActiveJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const openAssignModal = async (bookingId) => {
        try {
            const providerId = user?._id || user?.id;
            if (providerId) {
                const workersRes = await api.get(`/workers/provider/${providerId}`);
                if (workersRes.data.success) {
                    setWorkers(workersRes.data.data || []);
                }
            }
        } catch (e) {
        } finally {
            setAssignModal({ open: true, bookingId, workerId: '' });
        }
    };

    const handleJobAction = async (jobId, status) => {
        try {
            // For "Collect Money", we only update paymentStatus, not status
            if (status === 'collect-money') {
                const res = await api.put(`/bookings/${jobId}/status`, { 
                    paymentStatus: 'paid' 
                });
                if (res.data.success) {
                    toast.success('Payment collected successfully!');
                    fetchDashboardData();
                } else {
                    toast.error(res.data.error || 'Failed to update payment status');
                }
                return;
            }

            const res = await api.put(`/bookings/${jobId}/status`, { status });
            // Optimistically update UI
            if (res.data.success) {
                const updatedJob = res.data.data;
                setActiveJobs(prev => prev.map(job => 
                    job._id === jobId 
                    ? { ...job, status: updatedJob.status, statusDisplay: updatedJob.statusNormalized || updatedJob.status, paymentStatus: updatedJob.paymentStatus } 
                    : job
                ));
            }
            if (status === 'completed') {
                setActiveJobs(prev => prev.filter(job => job._id !== jobId));
                // Update stats locally or refetch
            }
            // After clicking "Accept Job" (status: accepted), trigger worker assignment
            if (status === 'accepted') {
                openAssignModal(jobId);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleWorkerFormChange = (field, value) => {
        if (['street', 'city', 'state', 'zip'].includes(field)) {
            setWorkerForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
        } else {
            setWorkerForm(prev => ({ ...prev, [field]: value }));
        }
    };

    const createWorker = async () => {
        const { name, email, password, phone, skill, address } = workerForm;
        try {
            const res = await api.post('/workers', { name, email, password, phone, skill, address });
            if (res.data.success) {
                setShowAddWorker(false);
                setWorkerForm({ name: '', email: '', password: '', phone: '', skill: '', address: { street: '', city: '', state: '', zip: '' } });
                const list = await api.get('/workers');
                setWorkers(list.data.data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteWorker = async (id) => {
        try {
            await api.delete(`/workers/${id}`);
            setWorkers(prev => prev.filter(w => w._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const assignWorker = async (id) => {
        const bookingId = prompt('Enter Booking ID to assign');
        if (!bookingId) return;
        try {
            await api.post(`/workers/${id}/assign`, { bookingId });
            // Optionally show a toast or update UI
        } catch (err) {
            console.error(err);
        }
    };

    const [assignModal, setAssignModal] = useState({ open: false, bookingId: null, workerId: '' });
    const [assignLoading, setAssignLoading] = useState(false);

    const confirmAssign = async () => {
        if (!assignModal.workerId) {
            alert('Please select a worker to assign');
            return;
        }
        if (!assignModal.bookingId) {
            alert('No booking selected for assignment');
            return;
        }
        setAssignLoading(true);
        try {
            const res = await api.put(`/bookings/assign/${assignModal.bookingId}`, { workerId: assignModal.workerId });
            if (res.data?.success) {
                const updatedJob = res.data.data;
                setActiveJobs(prev => prev.map(job => 
                    job._id === updatedJob._id 
                    ? { ...job, ...updatedJob, statusDisplay: updatedJob.statusNormalized || updatedJob.status } 
                    : job
                ));
            }

            setAssignModal({ open: false, bookingId: null, workerId: '' });
        } catch (err) {
            alert(err.message || 'Failed to assign worker');
        } finally {
            setAssignLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Provider Dashboard</h1>
                    <p className="text-neutral-500">Manage your jobs, earnings, and service offerings.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-200">
                        <span className={`text-sm font-medium ${isOnline ? 'text-success-600' : 'text-neutral-500'}`}>
                            {isOnline ? 'Available for Jobs' : 'Unavailable'}
                        </span>
                        <button onClick={() => setIsOnline(!isOnline)} className={`focus:outline-none transition-colors ${isOnline ? 'text-success-500' : 'text-neutral-400'}`}>
                            {isOnline ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                    
                    <Link to="/provider/jobs">
                        <Button className="w-full sm:w-auto">
                            <Bell size={16} className="mr-2" />
                            View All Jobs
                        </Button>
                    </Link>
                    <Button className="w-full sm:w-auto" onClick={() => setShowAddWorker(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Worker
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-primary-500 bg-gradient-to-br from-white to-primary-50/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Active Jobs</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stats?.activeJobs ?? 0}</h3>
                        </div>
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                            <Briefcase size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-success-500 bg-gradient-to-br from-white to-success-50/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Total Earnings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{Number(stats?.totalEarnings || 0).toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-success-100 rounded-lg text-success-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Today’s Earnings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{Number(stats?.todaysEarnings || 0).toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                            <Star size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Weekly Earnings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{Number(stats?.weeklyEarnings || 0).toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-primary-500 bg-gradient-to-br from-white to-primary-50/30 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Average Rating</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stats?.rating ? stats.rating.toFixed(2) : 'N/A'}</h3>
                        </div>
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                            <Package size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-success-500 bg-gradient-to-br from-white to-success-50/30 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Reviews</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stats?.reviews || 0}</h3>
                        </div>
                        <div className="p-2 bg-success-100 rounded-lg text-success-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-warning-500 bg-gradient-to-br from-white to-warning-50/30 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Weekly Earnings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{stats?.weeklyEarnings || 0}</h3>
                        </div>
                        <div className="p-2 bg-warning-100 rounded-lg text-warning-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-info-500 bg-gradient-to-br from-white to-info-50/30 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 uppercase">Total Earnings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{stats?.totalEarnings || 0}</h3>
                        </div>
                        <div className="p-2 bg-info-100 rounded-lg text-info-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
            </div>
            
            <div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <Clock className="text-primary-600" /> Active Jobs
                    </h2>
                    
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                        </div>
                        <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                            <option>All Status</option>
                            <option>Assigned</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {activeJobs.length > 0 ? (
                        activeJobs.map(job => (
                            <Card key={job._id} className="border-l-4 border-l-primary-500 hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-grow space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant="neutral" className="mb-2">
                                                    {job.service?.name || 'Service'}
                                                </Badge>
                                                <h3 className="text-lg font-bold text-neutral-900">
                                                    {job.customer?.name || 'Customer'}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {job.paymentMethod === 'online' && job.paymentStatus === 'paid' && (
                                                        <Badge variant="success" className="bg-success-100 text-success-700 border-success-200">
                                                            PAID
                                                        </Badge>
                                                    )}
                                                    {job.paymentMethod === 'cod' && (
                                                        <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200">
                                                            CASH ON DELIVERY
                                                        </Badge>
                                                    )}
                                                    {job.paymentMethod === 'online' && job.paymentStatus !== 'paid' && (
                                                        <Badge variant="neutral" className="bg-neutral-100 text-neutral-600">
                                                            PAYMENT PENDING
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        <div className="text-right">
                                                <p className="text-xl font-bold text-primary-600">
                                                    ₹{job.price ?? job.estimatedPrice ?? 0}
                                                </p>
                                                <Badge
                                                variant={job.statusDisplay === 'ongoing' || job.statusDisplay === 'in-progress' ? 'warning' : job.statusDisplay === 'assigned' ? 'success' : 'primary'}
                                                    className="mt-1 capitalize"
                                                >
                                                {job.statusDisplay ? job.statusDisplay.replace('-', ' ') : 'Status'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-neutral-400" />
                                                <span>
                                                    {job.scheduledDate
                                                        ? new Date(job.scheduledDate).toLocaleString()
                                                        : 'Schedule to be decided'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-neutral-400" />
                                                <span className="truncate">{job.customer?.address || job.address?.street || "Address hidden"}</span>
                                            </div>
                                        </div>

                                        {job.description && (
                                            <div className="bg-neutral-50 p-3 rounded-lg text-sm text-neutral-600 mt-2">
                                                <span className="font-semibold block mb-1">Note:</span>
                                                {job.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-end gap-2 md:w-48 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
                                        {(['ongoing', 'in-progress'].includes(job.statusDisplay)) && (
                                            <div className="flex flex-col gap-2 w-full">
                                                {/* COD Flow: Collect Money logic */}
                                                {job.paymentMethod === 'cod' && job.paymentStatus !== 'paid' ? (
                                                    <>
                                                        <p className="text-[10px] text-amber-600 font-bold uppercase text-center bg-amber-50 py-1 rounded border border-amber-200">
                                                            Collect Money First
                                                        </p>
                                                        <Button
                                                            className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-white"
                                                            onClick={() => handleJobAction(job._id, 'collect-money')}
                                                        >
                                                            <DollarSign size={16} className="mr-2" />
                                                            Collect ₹{Number(job.price).toFixed(2)}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleJobAction(job._id, 'completed')}
                                                        className="w-full justify-center bg-success-600 hover:bg-success-700 focus:ring-success-500"
                                                    >
                                                        <CheckCircle size={16} className="mr-2" />
                                                        Complete Job
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        {/* Show Accept Job only if not yet accepted and no worker is assigned */}
                                        {(job.status === 'searching-provider' || (job.status === 'assigned' && !job.worker)) && (
                                            <Button
                                                onClick={() => handleJobAction(job._id, 'accepted')}
                                                className="w-full justify-center bg-primary-600 hover:bg-primary-700"
                                            >
                                                <CheckCircle size={16} className="mr-2" />
                                                Accept Job
                                            </Button>
                                        )}
                                        {/* Show Assign Worker only after the job is accepted by provider */}
                                        {job.status === 'accepted' && (
                                            <Button
                                                onClick={() => openAssignModal(job._id)}
                                                variant="outline"
                                                className="w-full justify-center"
                                            >
                                                Assign Worker
                                            </Button>
                                        )}
                                        {/* Show only the green Accepted button once the worker is assigned */}
                                        {job.status === 'assigned' && job.worker && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-center bg-success-600 text-white hover:bg-success-600 cursor-default pointer-events-none"
                                            >
                                                <CheckCircle size={16} className="mr-2" />
                                                Accepted
                                            </Button>
                                        )}
                                        {/* Details and Call are secondary actions. */}
                                        <Link to={`/provider/jobs/${job._id}`} className="w-full">
                                            <Button variant="outline" className="w-full justify-center">
                                                <MessageSquare size={16} className="mr-2" />
                                                Details
                                            </Button>
                                        </Link>
                                        <Button variant="outline" className="w-full justify-center">
                                            <Phone size={16} className="mr-2" />
                                            Call
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-neutral-300">
                            <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-400">
                                <Package size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900">No active jobs</h3>
                            <p className="text-neutral-500">Go online to receive new job requests!</p>
                            <Link to="/provider/services">
                                <Button className="mt-4">
                                    Manage Services
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <Users className="text-primary-600" /> Manage Workers
                        <Badge variant="neutral">{workers.length} total</Badge>
                    </h2>
                </div>
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {workers.map(w => (
                                    <tr key={w._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{w.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{w.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="neutral">Active</Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <Button variant="outline" className="inline-flex items-center gap-2" onClick={() => assignWorker(w._id)}>
                                                Assign
                                            </Button>
                                            <Button variant="outline" className="inline-flex items-center gap-2" onClick={() => deleteWorker(w._id)}>
                                                <Trash2 size={16} />
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {workers.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-neutral-500" colSpan={4}>No workers yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={showAddWorker} onClose={() => setShowAddWorker(false)} title="Add Worker">
                <div className="space-y-4">
                    <Input label="Name" value={workerForm.name} onChange={(e) => handleWorkerFormChange('name', e.target.value)} />
                    <Input label="Email" type="email" value={workerForm.email} onChange={(e) => handleWorkerFormChange('email', e.target.value)} />
                    <Input label="Password" type="password" value={workerForm.password} onChange={(e) => handleWorkerFormChange('password', e.target.value)} />
                    <Input label="Phone (optional)" value={workerForm.phone} onChange={(e) => handleWorkerFormChange('phone', e.target.value)} />
                    <Input label="Skill/Role" value={workerForm.skill} onChange={(e) => handleWorkerFormChange('skill', e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label="Street" value={workerForm.address.street} onChange={(e) => handleWorkerFormChange('street', e.target.value)} />
                        <Input label="City" value={workerForm.address.city} onChange={(e) => handleWorkerFormChange('city', e.target.value)} />
                        <Input label="State" value={workerForm.address.state} onChange={(e) => handleWorkerFormChange('state', e.target.value)} />
                        <Input label="ZIP" value={workerForm.address.zip} onChange={(e) => handleWorkerFormChange('zip', e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowAddWorker(false)}>Cancel</Button>
                        <Button onClick={createWorker}>Create</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, bookingId: null, workerId: '' })} title="Assign Job">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-neutral-700">Select Worker</label>
                    <select
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={assignModal.workerId}
                        onChange={(e) => setAssignModal(prev => ({ ...prev, workerId: e.target.value }))}
                    >
                        <option value="">Choose worker...</option>
                        {workers.map(w => (
                            <option key={w._id} value={w._id}>{w.name} - {w.email}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setAssignModal({ open: false, bookingId: null, workerId: '' })}>Cancel</Button>
                        <Button type="button" onClick={confirmAssign} disabled={!assignModal.workerId} isLoading={assignLoading}>Confirm</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProviderDashboard;
