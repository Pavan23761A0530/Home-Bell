import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Settings, Save, Globe, CreditCard, Shield, Bell, Users, Percent, Clock, MapPin } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        searchRadius: 50,
        maxActiveJobs: 3,
        commissionRate: 15,
        autoAssign: true,
        enableNotifications: true,
        maxBookingDistance: 100,
        verificationRequired: true,
        cancellationWindow: 24
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading('Updating settings...');

        try {
            const res = await api.put('/admin/settings', settings);
            if (res.data.success) {
                toast.success('Settings updated successfully', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update settings", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                    <Settings className="text-primary-600" size={32} /> System Settings
                </h1>
                <p className="text-neutral-600 mt-2">Configure platform behavior and business rules.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assignment Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <MapPin className="text-primary-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Assignment Settings</h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Provider Search Radius (km)
                            </label>
                            <Input
                                type="number"
                                name="searchRadius"
                                value={settings.searchRadius}
                                onChange={handleChange}
                                min="1"
                                max="500"
                                placeholder="50"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Distance to search for providers around booking location.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Max Active Jobs per Provider
                            </label>
                            <Input
                                type="number"
                                name="maxActiveJobs"
                                value={settings.maxActiveJobs}
                                onChange={handleChange}
                                min="1"
                                max="20"
                                placeholder="3"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Maximum concurrent jobs before exclusion from new assignments.</p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Auto Assignment</label>
                                <p className="text-xs text-neutral-500">Automatically assign providers to new bookings</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoAssign"
                                    checked={settings.autoAssign}
                                    onChange={(e) => setSettings({...settings, autoAssign: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </form>
                </Card>

                {/* Business Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-success-100 rounded-lg">
                            <CreditCard className="text-success-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Business Settings</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Commission Rate (%)
                            </label>
                            <Input
                                type="number"
                                name="commissionRate"
                                value={settings.commissionRate}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="15"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Platform commission on each completed booking.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Max Booking Distance (km)
                            </label>
                            <Input
                                type="number"
                                name="maxBookingDistance"
                                value={settings.maxBookingDistance}
                                onChange={handleChange}
                                min="1"
                                max="500"
                                placeholder="100"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Maximum distance providers can accept bookings.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Cancellation Window (hours)
                            </label>
                            <Input
                                type="number"
                                name="cancellationWindow"
                                value={settings.cancellationWindow}
                                onChange={handleChange}
                                min="1"
                                max="168"
                                placeholder="24"
                            />
                            <p className="text-xs text-neutral-500 mt-1">Time window for free cancellations.</p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Verification Required</label>
                                <p className="text-xs text-neutral-500">Require document verification for providers</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="verificationRequired"
                                    checked={settings.verificationRequired}
                                    onChange={(e) => setSettings({...settings, verificationRequired: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-warning-100 rounded-lg">
                            <Bell className="text-warning-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Email Notifications</label>
                                <p className="text-xs text-neutral-500">Send system notifications via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enableNotifications"
                                    checked={settings.enableNotifications}
                                    onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">SMS Alerts</label>
                                <p className="text-xs text-neutral-500">Send critical alerts via SMS</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    defaultChecked
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Push Notifications</label>
                                <p className="text-xs text-neutral-500">Send real-time notifications to mobile apps</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    defaultChecked
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Security Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-error-100 rounded-lg">
                            <Shield className="text-error-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Two-Factor Authentication</label>
                            <p className="text-xs text-neutral-500 mb-3">Require 2FA for admin accounts</p>
                            <Button variant="outline" className="w-full">Enable 2FA</Button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Session Timeout (minutes)</label>
                            <Input type="number" placeholder="30" />
                            <p className="text-xs text-neutral-500 mt-1">Auto logout after inactivity</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">IP Whitelisting</label>
                            <p className="text-xs text-neutral-500 mb-3">Restrict admin access to specific IPs</p>
                            <Button variant="outline" className="w-full">Configure IPs</Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-8 right-8 z-10">
                <Button
                    onClick={handleSubmit}
                    isLoading={saving}
                    className="flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-shadow"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save All Settings'}</Button>
            </div>
        </div>
    );
};

export default AdminSettings;
