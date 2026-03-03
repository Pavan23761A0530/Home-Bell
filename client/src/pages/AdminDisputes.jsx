import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, CheckCircle, XCircle, Search, Filter, MessageSquare, Calendar, User, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AdminDisputes = () => {
    // Mock data for now as we don't have a full dispute creation flow in frontend yet
    // In a real app, we would fetch from /api/admin/disputes
    const [disputes, setDisputes] = useState([
        {
            _id: '1',
            bookingId: 'BK123456',
            customer: { name: 'John Doe', email: 'john@example.com' },
            provider: { name: 'Alice Smith', email: 'alice@example.com' },
            reason: 'Service not as described',
            description: 'The cleaning service was promised to include deep cleaning but only basic cleaning was performed.',
            status: 'open',
            date: '2023-11-20',
            amount: 1200
        },
        {
            _id: '2',
            bookingId: 'BK789012',
            customer: { name: 'Jane Roe', email: 'jane@example.com' },
            provider: { name: 'Bob Jones', email: 'bob@example.com' },
            reason: 'Provider did not show up',
            description: 'Plumber never arrived for the scheduled appointment despite multiple calls.',
            status: 'resolved',
            date: '2023-11-18',
            amount: 850
        },
        {
            _id: '3',
            bookingId: 'BK345678',
            customer: { name: 'Mike Johnson', email: 'mike@example.com' },
            provider: { name: 'Sarah Wilson', email: 'sarah@example.com' },
            reason: 'Overcharging',
            description: 'Charged significantly more than the quoted price without prior notice.',
            status: 'in-progress',
            date: '2023-11-22',
            amount: 2500
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this dispute as ${newStatus}?`)) return;
        
        const toastId = toast.loading('Updating dispute status...');
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setDisputes(disputes.map(d =>
                d._id === id ? { ...d, status: newStatus } : d
            ));

            toast.success(`Dispute marked as ${newStatus}`, { id: toastId });
        } catch (err) {
            toast.error("Failed to update dispute", { id: toastId });
        }
    };

    const filteredDisputes = disputes.filter(d => {
        const matchesSearch = d.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             d.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             d.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || d.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <ShieldAlert className="text-error-600" size={32} /> Dispute Resolution
                    </h1>
                    <p className="text-neutral-600 mt-1">Manage and resolve customer-provider disputes.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter size={18} /> Export Reports
                    </Button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer, provider, or booking ID..."
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select
                    className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="p-5 bg-error-50 border-error-100">
                    <div className="flex items-center">
                        <div className="p-2 bg-error-100 rounded-lg">
                            <ShieldAlert className="text-error-600" size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-error-600">Open Disputes</p>
                            <p className="text-2xl font-bold text-error-800">{disputes.filter(d => d.status === 'open').length}</p>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-5 bg-warning-50 border-warning-100">
                    <div className="flex items-center">
                        <div className="p-2 bg-warning-100 rounded-lg">
                            <MessageSquare className="text-warning-600" size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-warning-600">In Progress</p>
                            <p className="text-2xl font-bold text-warning-800">{disputes.filter(d => d.status === 'in-progress').length}</p>
                        </div>
                    </div>
                </Card>
                
                <Card className="p-5 bg-success-50 border-success-100">
                    <div className="flex items-center">
                        <div className="p-2 bg-success-100 rounded-lg">
                            <CheckCircle className="text-success-600" size={24} />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-success-600">Resolved</p>
                            <p className="text-2xl font-bold text-success-800">{disputes.filter(d => d.status === 'resolved').length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Dispute Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Parties</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                            {filteredDisputes.map((dispute) => (
                                <tr key={dispute._id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-error-100 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-error-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-neutral-900">{dispute.bookingId}</div>
                                                <div className="text-sm text-neutral-500 flex items-center gap-1">
                                                    <Calendar size={14} /> {new Date(dispute.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                                                <User size={14} className="text-blue-500" /> {dispute.customer.name}
                                            </div>
                                            <div className="text-xs text-neutral-500">{dispute.customer.email}</div>
                                            <div className="text-sm font-medium text-neutral-900 flex items-center gap-1 mt-1">
                                                <User size={14} className="text-orange-500" /> {dispute.provider.name}
                                            </div>
                                            <div className="text-xs text-neutral-500">{dispute.provider.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-neutral-900">{dispute.reason}</div>
                                        <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{dispute.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                        ₹{dispute.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                            dispute.status === 'open' ? 'bg-error-100 text-error-800' :
                                            dispute.status === 'in-progress' ? 'bg-warning-100 text-warning-800' :
                                            'bg-success-100 text-success-800'
                                        }`}>
                                            {dispute.status.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {dispute.status === 'open' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(dispute._id, 'in-progress')}
                                                    className="text-warning-600 hover:text-warning-800 transition-colors p-1 flex items-center gap-1"
                                                    title="Mark In Progress"
                                                >
                                                    <MessageSquare size={16} /> Process
                                                </button>
                                            )}
                                            {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(dispute._id, 'resolved')}
                                                    className="text-success-600 hover:text-success-800 transition-colors p-1 flex items-center gap-1"
                                                    title="Resolve Dispute"
                                                >
                                                    <CheckCircle size={16} /> Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStatusUpdate(dispute._id, 'dismissed')}
                                                className="text-neutral-600 hover:text-neutral-800 transition-colors p-1 flex items-center gap-1"
                                                title="Dismiss"
                                            >
                                                <XCircle size={16} /> Dismiss
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredDisputes.length === 0 && (
                    <div className="text-center py-12">
                        <ShieldAlert className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900">No disputes found</h3>
                        <p className="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminDisputes;
