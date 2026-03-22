import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Settings, MapPin, Users, Zap, Save, RotateCcw } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminAssignment = () => {
    const [settings, setSettings] = useState({
        searchRadius: 50,
        maxActiveJobs: 3,
        autoAssign: true,
        minRating: 4.0,
        maxDistanceMultiplier: 1.5,
        priorityNearby: true,
        enableBackupProviders: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/assignment-settings');
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load assignment settings");
            // Use default values
            setSettings({
                searchRadius: 50,
                maxActiveJobs: 3,
                autoAssign: true,
                minRating: 4.0,
                maxDistanceMultiplier: 1.5,
                priorityNearby: true,
                enableBackupProviders: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const toastId = toast.loading('Saving assignment settings...');
        
        try {
            await api.put('/admin/assignment-settings', settings);
            toast.success('Assignment settings updated successfully', { id: toastId });
        } catch (err) {
            toast.error('Failed to save settings', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Reset to default assignment settings?")) {
            setSettings({
                searchRadius: 50,
                maxActiveJobs: 3,
                autoAssign: true,
                minRating: 4.0,
                maxDistanceMultiplier: 1.5,
                priorityNearby: true,
                enableBackupProviders: true
            });
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
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
                        <Zap className="text-primary-600" size={32} /> Assignment Control
                    </h1>
                    <p className="text-neutral-600 mt-1">Configure provider matching and assignment algorithms.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw size={18} /> Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distance & Location Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <MapPin className="text-primary-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Distance & Location</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Search Radius (km)
                            </label>
                            <Input
                                type="range"
                                min="5"
                                max="100"
                                value={settings.searchRadius}
                                onChange={(e) => updateSetting('searchRadius', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-1">
                                <span>5 km</span>
                                <span className="font-medium text-primary-600">{settings.searchRadius} km</span>
                                <span>100 km</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Maximum distance to search for providers from customer location
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Max Distance Multiplier
                            </label>
                            <Input
                                type="number"
                                step="0.1"
                                min="1"
                                max="3"
                                value={settings.maxDistanceMultiplier}
                                onChange={(e) => updateSetting('maxDistanceMultiplier', parseFloat(e.target.value))}
                                placeholder="1.5"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Multiplier for maximum booking distance beyond search radius
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Priority Nearby Providers</label>
                                <p className="text-xs text-neutral-500">Give preference to closer providers</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.priorityNearby}
                                    onChange={(e) => updateSetting('priorityNearby', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>

                {/* Provider Qualification Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-success-100 rounded-lg">
                            <Users className="text-success-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">Provider Qualification</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Maximum Active Jobs
                            </label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={settings.maxActiveJobs}
                                onChange={(e) => updateSetting('maxActiveJobs', parseInt(e.target.value))}
                                placeholder="3"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Max concurrent jobs before excluding from new assignments
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Minimum Provider Rating
                            </label>
                            <Input
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                value={settings.minRating}
                                onChange={(e) => updateSetting('minRating', parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 mt-1">
                                <span>1.0</span>
                                <span className="font-medium text-success-600">{settings.minRating}</span>
                                <span>5.0</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-2">
                                Minimum rating required for providers to be considered
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Auto Assignment</label>
                                <p className="text-xs text-neutral-500">Automatically assign providers to new bookings</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoAssign}
                                    onChange={(e) => updateSetting('autoAssign', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700">Backup Providers</label>
                                <p className="text-xs text-neutral-500">Enable secondary provider suggestions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enableBackupProviders}
                                    onChange={(e) => updateSetting('enableBackupProviders', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
                            </label>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Algorithm Preview */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Assignment Algorithm Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-900 mb-2">Matching Process</h3>
                        <ul className="text-sm text-neutral-600 space-y-1">
                            <li>• Find providers within {settings.searchRadius}km</li>
                            <li>• Filter by rating ≥ {settings.minRating}</li>
                            <li>• Check active jobs &lt; {settings.maxActiveJobs}</li>
                            <li>• {settings.autoAssign ? 'Auto-assign' : 'Manual assignment'}</li>
                        </ul>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-900 mb-2">Scoring Factors</h3>
                        <ul className="text-sm text-neutral-600 space-y-1">
                            <li>• Distance Proximity</li>
                            <li>• Provider Rating</li>
                            <li>• Available Capacity</li>
                            <li>• Past Performance</li>
                        </ul>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h3 className="font-medium text-neutral-900 mb-2">Current Status</h3>
                        <ul className="text-sm text-neutral-600 space-y-1">
                            <li>• System: <span className="text-success-600 font-medium">Active</span></li>
                            <li>• Assignment: <span className={settings.autoAssign ? 'text-success-600 font-medium' : 'text-warning-600 font-medium'}>
                                {settings.autoAssign ? 'Automatic' : 'Manual'}
                            </span></li>
                            <li>• Providers: <span className="text-primary-600 font-medium">Qualified</span></li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AdminAssignment;