import { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, RefreshCw, FileText, Eye, Code, Copy, Download } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AdminContract = () => {
    const [template, setTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('editor'); // editor, preview, variables

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/contract-template');
            if (res.data.success) {
                setTemplate(res.data.data.content);
            }
        } catch (error) {
            console.error("Failed to fetch template");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/admin/contract-template', { content: template });
            alert("Template saved successfully");
        } catch (error) {
            alert("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Reset to default template? Unsaved changes will be lost.")) {
            // In a real app, might call an API to get default or just hardcode it
            setTemplate(`SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into by and between:

Provider: {{providerName}}
Customer: {{customerName}}

Service: {{serviceName}}
Date: {{date}}
Price: ₹{{price}}
Location: {{address}}

1. SCOPE OF WORK
The Provider agrees to perform the services described above at the location specified with professional standards and quality.

2. PAYMENT TERMS
The Customer agrees to pay the Price upon completion of the services, or as otherwise agreed in writing. Payment shall be made through the platform's secure payment system.

3. CANCELLATION POLICY
Cancellations must be made at least 24 hours in advance. Late cancellations may be subject to fees as per platform policy.

4. LIABILITY
The Provider shall be liable for any damage caused during the provision of services. The Customer shall be responsible for providing a safe working environment.

5. DISPUTE RESOLUTION
Any disputes arising from this agreement shall be resolved through the platform's dispute resolution process.

IN WITNESS WHEREOF, the parties have executed this Agreement electronically through the LocalServe platform.

Provider Signature: _____________________    Date: ___________
Customer Signature: _____________________    Date: ___________`);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const downloadTemplate = () => {
        const blob = new Blob([template], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contract-template.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Mock preview with sample data
    const previewTemplate = template
        .replace(/{{providerName}}/g, 'John Smith')
        .replace(/{{customerName}}/g, 'Alice Johnson')
        .replace(/{{serviceName}}/g, 'Deep Cleaning Service')
        .replace(/{{date}}/g, new Date().toLocaleDateString())
        .replace(/{{price}}/g, '1,200')
        .replace(/{{address}}/g, '123 Main Street, New York, NY 10001');

    if (loading) return <div>Loading editor...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                        <FileText className="text-primary-600" size={32} /> Contract Templates
                    </h1>
                    <p className="text-neutral-600 mt-1">Edit the legal agreement generated for bookings.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={18} /> Reset Default
                    </Button>
                    <Button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2"
                    >
                        <Download size={18} /> Download
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={saving}
                        className="flex items-center gap-2"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="border-b border-neutral-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'editor', label: 'Editor', icon: Code },
                        { id: 'preview', label: 'Preview', icon: Eye },
                        { id: 'variables', label: 'Variables', icon: FileText }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Editor Tab */}
            {activeTab === 'editor' && (
                <Card className="p-6">
                    <div className="mb-6 bg-primary-50 border border-primary-100 rounded-lg p-4">
                        <h3 className="font-medium text-primary-800 mb-2 flex items-center gap-2">
                            <Code size={18} /> Available Placeholders
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {[
                                '{{customerName}}', '{{providerName}}', '{{serviceName}}',
                                '{{price}}', '{{date}}', '{{address}}'
                            ].map((placeholder) => (
                                <div key={placeholder} className="flex items-center justify-between bg-white p-2 rounded border">
                                    <code className="text-sm font-mono text-primary-700">{placeholder}</code>
                                    <button
                                        onClick={() => copyToClipboard(placeholder)}
                                        className="text-neutral-400 hover:text-primary-600 transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        className="w-full h-96 p-4 font-mono text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Enter contract template here... Use the placeholders above to insert dynamic content."
                    />
                </Card>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-neutral-900">Contract Preview</h3>
                        <span className="text-sm text-neutral-500">Sample data filled in</span>
                    </div>
                    <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                        <pre className="whitespace-pre-wrap font-sans text-neutral-800 leading-relaxed">
                            {previewTemplate}
                        </pre>
                    </div>
                </Card>
            )}

            {/* Variables Tab */}
            {activeTab === 'variables' && (
                <Card className="p-6">
                    <h3 className="text-lg font-medium text-neutral-900 mb-6">Template Variables Documentation</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium text-neutral-900 mb-3">Dynamic Placeholders</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { var: '{{customerName}}', desc: 'Full name of the customer booking the service' },
                                    { var: '{{providerName}}', desc: 'Full name of the assigned service provider' },
                                    { var: '{{serviceName}}', desc: 'Name of the service being booked' },
                                    { var: '{{price}}', desc: 'Agreed price for the service (in INR)' },
                                    { var: '{{date}}', desc: 'Date of service (formatted as per system settings)' },
                                    { var: '{{address}}', desc: 'Service location address' }
                                ].map((item) => (
                                    <div key={item.var} className="bg-neutral-50 p-4 rounded-lg">
                                        <code className="font-mono text-primary-700 font-medium">{item.var}</code>
                                        <p className="text-sm text-neutral-600 mt-2">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-neutral-200 pt-6">
                            <h4 className="font-medium text-neutral-900 mb-3">Best Practices</h4>
                            <ul className="space-y-2 text-sm text-neutral-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-success-500 mt-1">•</span>
                                    <span>Always use placeholders in double curly braces {{ }}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success-500 mt-1">•</span>
                                    <span>Test your template with the preview feature before saving</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success-500 mt-1">•</span>
                                    <span>Include all necessary legal clauses for your jurisdiction</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success-500 mt-1">•</span>
                                    <span>Keep language clear and professional</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AdminContract;
