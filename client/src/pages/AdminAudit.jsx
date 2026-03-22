import { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Clock, User, Search, Filter, Download, AlertCircle, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AdminAudit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, user, booking, payment, system

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/audit');
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch audit logs");
            // Mock data for demo
            setLogs([
                {
                    _id: '1',
                    user: { name: 'Admin User', role: 'admin' },
                    action: 'USER_BLOCKED',
                    details: 'Blocked user John Doe (ID: user123) for policy violation',
                    createdAt: new Date(Date.now() - 3600000),
                    ip: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                },
                {
                    _id: '2',
                    user: { name: 'Admin User', role: 'admin' },
                    action: 'BOOKING_CANCELLED',
                    details: 'Force cancelled booking BK456789 due to provider no-show',
                    createdAt: new Date(Date.now() - 7200000),
                    ip: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                },
                {
                    _id: '3',
                    user: { name: 'Admin User', role: 'admin' },
                    action: 'PRICE_UPDATED',
                    details: 'Updated cleaning service base price from ₹800 to ₹950',
                    createdAt: new Date(Date.now() - 10800000),
                    ip: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                },
                {
                    _id: '4',
                    user: { name: 'Admin User', role: 'admin' },
                    action: 'PROVIDER_APPROVED',
                    details: 'Approved new provider application for Alice Smith',
                    createdAt: new Date(Date.now() - 14400000),
                    ip: '192.168.1.100',
                    userAgent: 'Mozilla/5.0...'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        switch(action) {
            case 'USER_BLOCKED': return <XCircle className="text-error-500" size={18} />;
            case 'BOOKING_CANCELLED': return <XCircle className="text-error-500" size={18} />;
            case 'PROVIDER_APPROVED': return <CheckCircle className="text-success-500" size={18} />;
            case 'PRICE_UPDATED': return <Edit3 className="text-warning-500" size={18} />;
            default: return <AlertCircle className="text-info-500" size={18} />;
        }
    };

    const getActionColor = (action) => {
        switch(action) {
            case 'USER_BLOCKED': return 'text-error-600 bg-error-50';
            case 'BOOKING_CANCELLED': return 'text-error-600 bg-error-50';
            case 'PROVIDER_APPROVED': return 'text-success-600 bg-success-50';
            case 'PRICE_UPDATED': return 'text-warning-600 bg-warning-50';
            default: return 'text-info-600 bg-info-50';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             log.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || log.action.toLowerCase().includes(filter);
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div>Loading logs...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <Shield className="text-primary-600" size={32} /> System Audit Logs
                    </h1>
                    <p className="text-neutral-600 mt-1">Track all sensitive system actions and security events.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download size={18} /> Export Logs
                    </Button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3.5 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by user, action, or details..."
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
                    <option value="all">All Actions</option>
                    <option value="user">User Management</option>
                    <option value="booking">Booking Actions</option>
                    <option value="provider">Provider Actions</option>
                    <option value="payment">Payment Actions</option>
                    <option value="system">System Changes</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="p-4 bg-info-50 border-info-100">
                    <div className="text-2xl font-bold text-info-600">{logs.length}</div>
                    <div className="text-sm text-info-800">Total Events</div>
                </Card>
                <Card className="p-4 bg-error-50 border-error-100">
                    <div className="text-2xl font-bold text-error-600">
                        {logs.filter(l => l.action.includes('BLOCKED') || l.action.includes('CANCELLED')).length}
                    </div>
                    <div className="text-sm text-error-800">Security Events</div>
                </Card>
                <Card className="p-4 bg-success-50 border-success-100">
                    <div className="text-2xl font-bold text-success-600">
                        {logs.filter(l => l.action.includes('APPROVED')).length}
                    </div>
                    <div className="text-sm text-success-800">Approvals</div>
                </Card>
                <Card className="p-4 bg-warning-50 border-warning-100">
                    <div className="text-2xl font-bold text-warning-600">
                        {logs.filter(l => l.action.includes('UPDATED')).length}
                    </div>
                    <div className="text-sm text-warning-800">Updates</div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">IP Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                                    <User size={16} className="text-neutral-500" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-neutral-900">
                                                        {log.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 capitalize">
                                                        {log.user?.role || 'system'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action)}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-neutral-900 max-w-md">{log.details}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            {log.ip}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Shield className="h-12 w-12 text-neutral-400 mb-4" />
                                            <h3 className="text-sm font-medium text-neutral-900">No audit logs found</h3>
                                            <p className="text-sm text-neutral-500 mt-1">Try adjusting your search or filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminAudit;
