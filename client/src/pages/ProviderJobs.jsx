import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';

const ProviderJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await api.get('/bookings'); // Provider sees assigned/accepted jobs
            if (res.data.success) {
                setJobs(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };
    
    const updateJobStatus = async (jobId, status) => {
        const toastId = toast.loading('Updating job status...');
        try {
            const res = await api.put(`/bookings/${jobId}/status`, { status });
            if (res.data.success) {
                toast.success(`Job marked as ${status}`, { id: toastId });
                fetchJobs(); // Refresh the job list
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update status", { id: toastId });
        }
    };

    if (loading) return <div>Loading jobs...</div>;

    const pendingJobs = jobs.filter(job => job.status === 'assigned');
    const activeJobs = jobs.filter(job => ['accepted', 'in-progress'].includes(job.status)).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    const pastJobs = jobs.filter(job => ['completed', 'cancelled', 'disputed'].includes(job.status));

    const JobCard = ({ job, type }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">{job.service?.name}</h3>
                    <p className="text-sm text-gray-500">Booking #{job._id.slice(-6)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                            job.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {job.status.replace('-', ' ')}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    {new Date(job.scheduledDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    {job.address?.city}
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="font-bold text-gray-900">₹{job.price}</span>
                <div className="flex items-center space-x-2">
                    {(job.status === 'accepted' || job.status === 'in-progress') && (
                        <Link to={`/provider/jobs/${job._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center">
                            Manage <ArrowRight size={16} className="ml-1" />
                        </Link>
                    )}
                    {job.status === 'accepted' && (
                        <button
                            onClick={() => updateJobStatus(job._id, 'in-progress')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                            Start
                        </button>
                    )}
                    {job.status === 'in-progress' && (
                        <button
                            onClick={() => updateJobStatus(job._id, 'completed')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">New Opportunities</h1>
                {pendingJobs.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingJobs.map(job => <JobCard key={job._id} job={job} type="pending" />)}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No new job offers at the moment.</p>
                )}
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Active Jobs</h1>
                {activeJobs.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeJobs.map(job => <JobCard key={job._id} job={job} type="active" />)}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No active jobs.</p>
                )}
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Past Jobs</h1>
                {pastJobs.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastJobs.map(job => <JobCard key={job._id} job={job} type="past" />)}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No completed jobs yet.</p>
                )}
            </div>
        </div>
    );
};

export default ProviderJobs;
