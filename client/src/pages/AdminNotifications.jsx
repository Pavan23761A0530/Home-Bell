import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, Bell, Users, MessageSquare, AlertTriangle, CheckCircle, X, Filter } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState('all');
    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        recipientType: 'all', // all, customers, providers, specific
        userIds: [] // for specific recipients
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications');
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load notifications");
            // Mock data for demo
            setNotifications([
                {
                    _id: '1',
                    title: 'System Maintenance',
                    message: 'Scheduled maintenance tonight from 2-4 AM. Service may be temporarily unavailable.',
                    type: 'system',
                    recipientType: 'all',
                    sentAt: new Date(Date.now() - 3600000),
                    readCount: 124,
                    totalRecipients: 150
                },
                {
                    _id: '2',
                    title: 'New Feature Launch',
                    message: 'We\'ve added real-time tracking for all bookings! Check it out in your dashboard.',
                    type: 'announcement',
                    recipientType: 'customers',
                    sentAt: new Date(Date.now() - 86400000),
                    readCount: 89,
                    totalRecipients: 120
                },
                {
                    _id: '3',
                    title: 'Earnings Update',
                    message: 'Your weekly earnings report is now available. Check your provider dashboard.',
                    type: 'info',
                    recipientType: 'providers',
                    sentAt: new Date(Date.now() - 172800000),
                    readCount: 45,
                    totalRecipients: 65
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!notificationForm.title || !notificationForm.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSending(true);
        const toastId = toast.loading('Sending notification...');

        try {
            await api.post('/admin/notifications/broadcast', notificationForm);
            toast.success('Notification sent successfully!', { id: toastId });
            setNotificationForm({
                title: '',
                message: '',
                recipientType: 'all',
                userIds: []
            });
            fetchNotifications();
        } catch (err) {
            toast.error('Failed to send notification', { id: toastId });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) return;
        
        try {
            await api.delete(`/admin/notifications/${id}`);
            toast.success('Notification deleted');
            fetchNotifications();
        } catch (err) {
            toast.error('Failed to delete notification');
        }
    };

    const filteredNotifications = notifications.filter(n => 
        filter === 'all' || n.recipientType === filter
    );

    const getRecipientTypeLabel = (type) => {
        switch(type) {
            case 'all': return 'All Users';
            case 'customers': return 'Customers';
            case 'providers': return 'Providers';
            case 'specific': return 'Specific Users';
            default: return type;
        }
    };

    const getNotificationTypeColor = (type) => {
        switch(type) {
            case 'system': return 'bg-error-100 text-error-800';
            case 'announcement': return 'bg-primary-100 text-primary-800';
            case 'info': return 'bg-info-100 text-info-800';
            case 'warning': return 'bg-warning-100 text-warning-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <Bell className="text-primary-600" size={32} /> Broadcast Notifications
                    </h1>
                    <p className="text-neutral-600 mt-1">Send announcements and updates to users.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Send Notification Form */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Send className="text-primary-600" size={20} /> Send New Notification
                        </h2>
                        
                        <form onSubmit={handleSendNotification} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Title *
                                </label>
                                <Input
                                    type="text"
                                    value={notificationForm.title}
                                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                                    placeholder="Enter notification title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Message *
                                </label>
                                <textarea
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[120px]"
                                    value={notificationForm.message}
                                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                                    placeholder="Enter your message here..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Recipients
                                </label>
                                <select
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={notificationForm.recipientType}
                                    onChange={(e) => setNotificationForm({...notificationForm, recipientType: e.target.value})}
                                >
                                    <option value="all">All Users</option>
                                    <option value="customers">Customers Only</option>
                                    <option value="providers">Providers Only</option>
                                    <option value="specific">Specific Users</option>
                                </select>
                            </div>

                            <Button
                                type="submit"
                                isLoading={sending}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> {sending ? 'Sending...' : 'Send Notification'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Notifications List */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-neutral-900">Sent Notifications</h2>
                        
                        <div className="flex gap-2">
                            <select
                                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="all">All Users</option>
                                <option value="customers">Customers</option>
                                <option value="providers">Providers</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredNotifications.map((notification) => (
                            <Card key={notification._id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-neutral-900">{notification.title}</h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNotificationTypeColor(notification.type)}`}>
                                                {notification.type}
                                            </span>
                                            <span className="text-sm text-neutral-500">
                                                to {getRecipientTypeLabel(notification.recipientType)}
                                            </span>
                                        </div>
                                        
                                        <p className="text-neutral-700 mb-4">{notification.message}</p>
                                        
                                        <div className="flex items-center gap-6 text-sm text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={16} className="text-success-500" />
                                                {notification.readCount}/{notification.totalRecipients} read
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare size={16} className="text-primary-500" />
                                                Sent {new Date(notification.sentAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleDelete(notification._id)}
                                            className="text-error-600 hover:text-error-800 transition-colors p-2"
                                            title="Delete notification"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredNotifications.length === 0 && (
                            <Card className="p-12 text-center">
                                <Bell className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                                <h3 className="text-lg font-medium text-neutral-900 mb-2">No notifications found</h3>
                                <p className="text-neutral-500">Send your first notification using the form on the left.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Notification Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-primary-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600">
                            {notifications.length}
                        </div>
                        <div className="text-sm text-primary-800">Total Sent</div>
                    </div>
                    <div className="bg-success-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-success-600">
                            {notifications.reduce((acc, n) => acc + n.readCount, 0)}
                        </div>
                        <div className="text-sm text-success-800">Total Reads</div>
                    </div>
                    <div className="bg-info-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-info-600">
                            {Math.round((notifications.reduce((acc, n) => acc + n.readCount, 0) / 
                                       notifications.reduce((acc, n) => acc + n.totalRecipients, 1)) * 100)}%
                        </div>
                        <div className="text-sm text-info-800">Average Read Rate</div>
                    </div>
                    <div className="bg-warning-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-warning-600">
                            {notifications.filter(n => n.type === 'system').length}
                        </div>
                        <div className="text-sm text-warning-800">System Alerts</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminNotifications;