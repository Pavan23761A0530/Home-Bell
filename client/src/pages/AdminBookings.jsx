import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, MoreVertical, XCircle, UserCheck, Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/admin/bookings');
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status, providerId = null) => {
        if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;

        const toastId = toast.loading('Updating booking...');
        try {
            await api.put(`/admin/bookings/${id}`, { status, providerId });
            toast.success('Booking updated', { id: toastId });
            fetchBookings();
        } catch (err) {
            toast.error("Failed to update booking", { id: toastId });
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const matchesSearch = b.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b._id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return <div>Loading bookings...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Booking Management</h1>
                    <p className="text-neutral-600 mt-1">Monitor and manage all service bookings.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter size={18} /> Export Data
                    </Button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer name, booking ID, or service..."
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select
                    className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="searching-provider">Searching Provider</option>
                    <option value="assigned">Assigned</option>
                    <option value="accepted">Accepted</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="disputed">Disputed</option>
                </select>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Booking Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                            {filteredBookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-neutral-900">#{booking._id.slice(-8)}</div>
                                                <div className="text-sm text-neutral-500 flex items-center gap-1">
                                                    <MapPin size={14} /> {booking.address?.city || 'Location N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-neutral-900">{booking.customer?.name}</div>
                                        <div className="text-sm text-neutral-500">{booking.customer?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {booking.provider ? (
                                            <div>
                                                <div className="text-sm font-medium text-neutral-900">{booking.provider.user?.name}</div>
                                                <div className="text-sm text-neutral-500">+91 {booking.provider.user?.phone || 'N/A'}</div>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                            booking.status === 'completed' ? 'bg-success-100 text-success-800' :
                                            booking.status === 'cancelled' ? 'bg-error-100 text-error-800' :
                                            booking.status === 'searching-provider' ? 'bg-warning-100 text-warning-800' :
                                            booking.status === 'disputed' ? 'bg-red-100 text-red-800' :
                                            'bg-primary-100 text-primary-800'
                                        }`}>
                                            {booking.status.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={14} className="text-neutral-400" />
                                            {booking.price ? `₹${booking.price}` : 'Quote'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
                                                <MoreVertical size={18} />
                                            </button>
                                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                                                    className="text-error-600 hover:text-error-800 transition-colors p-1"
                                                    title="Force Cancel"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                            {booking.status === 'assigned' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(booking._id, null, 'UNASSIGNED')}
                                                    className="text-warning-600 hover:text-warning-800 transition-colors p-1"
                                                    title="Unassign Provider"
                                                >
                                                    <UserCheck size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900">No bookings found</h3>
                        <p className="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminBookings;
