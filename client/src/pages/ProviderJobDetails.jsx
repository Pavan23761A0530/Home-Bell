import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Clock, User, Phone, CheckCircle, XCircle, Play, CheckSquare } from 'lucide-react';

const ProviderJobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJob();
    }, [jobId]);

    const fetchJob = async () => {
        try {
            const res = await api.get(`/bookings/${jobId}`);
            if (res.data.success) {
                setJob(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load job details");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        const toastId = toast.loading('Updating job status...');
        try {
            const res = await api.put(`/bookings/${jobId}/status`, { status });
            if (res.data.success) {
                toast.success(`Job marked as ${status}`, { id: toastId });
                setJob(res.data.data);
                // Refresh to ensure everything is consistent
                fetchJob();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update status", { id: toastId });
        }
    };

    const signContract = async () => {
        const toastId = toast.loading('Signing contract...');
        try {
            await api.put(`/bookings/${jobId}/sign`);
            toast.success('Contract signed successfully', { id: toastId });
            fetchJob();
        } catch (err) {
            toast.error("Failed to sign contract", { id: toastId });
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!job) return <div>Job not found</div>;

    const isPending = job.status === 'assigned';
    const isAccepted = job.status === 'accepted';
    const isInProgress = job.status === 'in-progress';
    const isCompleted = job.status === 'completed';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={() => navigate('/provider/jobs')} className="text-gray-600 hover:text-gray-900">
                    &larr; Back to Jobs
                </button>
                <div className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                    }`}>
                    {job.status.replace('-', ' ')}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{job.service?.name}</h1>
                        <p className="text-gray-500">Booking #{job._id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Earnings</p>
                        <p className="text-2xl font-bold text-green-600">₹{job.price}</p>
                    </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {job.customer?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium">{job.customer?.name}</p>
                                    <p className="text-sm text-gray-500">{job.customer?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                            <div className="flex items-start">
                                <MapPin className="mr-2 text-gray-400 mt-1" size={18} />
                                <div>
                                    <p>{job.address?.street}</p>
                                    <p>{job.address?.city}, {job.address?.state} {job.address?.zip}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Schedule</h3>
                            <div className="flex items-center">
                                <Calendar className="mr-2 text-gray-400" size={18} />
                                <span className="mr-4">{new Date(job.scheduledDate).toLocaleDateString()}</span>
                                <Clock className="mr-2 text-gray-400" size={18} />
                                <span>{new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        {job.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                                <p className="bg-gray-50 p-3 rounded-lg text-sm">{job.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions</h3>

                            {isPending && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateStatus('accepted')}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center font-semibold"
                                    >
                                        <CheckCircle className="mr-2" /> Accept Job
                                    </button>
                                    <button
                                        onClick={() => updateStatus('cancelled')}
                                        className="w-full bg-white text-red-600 border border-red-200 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center font-semibold"
                                    >
                                        <XCircle className="mr-2" /> Decline
                                    </button>
                                </div>
                            )}

                            {isAccepted && (
                                <div className="space-y-3">
                                    <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm mb-4">
                                        Contract Status: <span className="font-bold">{job.contract?.providerSignature?.signed ? 'Signed' : 'Pending Signature'}</span>
                                    </div>
                                    {!job.contract?.providerSignature?.signed && (
                                        <button
                                            onClick={signContract}
                                            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 flex items-center justify-center font-semibold"
                                        >
                                            Sign Contract
                                        </button>
                                    )}
                                    <button
                                        onClick={() => updateStatus('in-progress')}
                                        disabled={!job.contract?.providerSignature?.signed}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center font-semibold disabled:opacity-50"
                                    >
                                        <Play className="mr-2" /> Start Job
                                    </button>
                                </div>
                            )}

                            {isInProgress && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateStatus('completed')}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center font-semibold"
                                    >
                                        <CheckSquare className="mr-2" /> Mark as Completed
                                    </button>
                                </div>
                            )}

                            {isCompleted && (
                                <div className="bg-green-50 p-4 rounded-lg text-green-800 text-center font-semibold">
                                    <CheckCircle className="inline-block mr-2" /> Job Completed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderJobDetails;
