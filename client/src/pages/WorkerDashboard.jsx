import { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import api from '../services/api';
import { Briefcase, CheckCircle, Clock, MapPin, Calendar, DollarSign, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import toast from 'react-hot-toast';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'worker') {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    if (!user || user.role !== 'worker') return;

    const workerId = user.id || user._id;
    if (!workerId) {
      console.error('Worker ID missing for assignments fetch', user);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/bookings/worker/${workerId}`);
      if (res.data.success) setAssignments(res.data.data || []);
      else setAssignments([]);
    } catch (err) {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (bookingId, next) => {
    const toastId = toast.loading(`Updating job status to ${next === 'ongoing' ? 'Ongoing' : 'Completed'}...`);
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: next === 'ongoing' ? 'in-progress' : next });
      if (res.data.success) {
        toast.success(`Job marked as ${next === 'ongoing' ? 'Ongoing' : 'Completed'}`, { id: toastId });
        fetchAssignments();
      } else {
        toast.error(res.data.error || 'Failed to update status', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status', { id: toastId });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;

  const assigned = assignments.filter(a => a.status === 'assigned');
  const ongoing = assignments.filter(a => a.status === 'accepted' || a.status === 'in-progress');
  const completed = assignments.filter(a => a.status === 'completed');
  const cancelled = assignments.filter(a => a.status === 'cancelled');
  const totalEarnings = completed.reduce((sum, b) => sum + (typeof b.price === 'number' ? b.price : 0), 0);

  const renderJobCard = (a, borderColor) => (
    <Card key={a._id} className={`border-l-4 ${borderColor}`}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="neutral" className="mb-2">
                {a.service?.name || 'Service'}
              </Badge>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <User size={18} className="text-primary-500" />
                  {a.customer?.name || 'Customer'}
                </h3>
                {a.customer?.phone && (
                  <p className="text-sm text-neutral-600 flex items-center gap-2">
                    <Phone size={14} className="text-neutral-400" />
                    {a.customer.phone}
                  </p>
                )}
                {a.customer?.email && (
                  <p className="text-sm text-neutral-600 flex items-center gap-2">
                    <Mail size={14} className="text-neutral-400" />
                    {a.customer.email}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge variant={(a.status === 'in-progress' || a.status === 'ongoing') ? 'warning' : a.status === 'completed' ? 'success' : 'primary'} className="capitalize">
                {(a.statusNormalized || a.status).replace('-', ' ')}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-neutral-400" />
              <span>
                {a.scheduledDate
                  ? new Date(a.scheduledDate).toLocaleString()
                  : 'Schedule TBD'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-neutral-400" />
              <span className="truncate">
                {a.address?.street 
                  ? `${a.address.street}, ${a.address.city || ''} ${a.address.state || ''}`.trim()
                  : (a.customer?.address || 'Address hidden')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-end gap-2 md:w-48 border-t md:border-t-0 md:border-l border-neutral-100 pt-4 md:pt-0 md:pl-6">
          {['assigned', 'accepted'].includes(a.status) && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => updateJobStatus(a._id, 'ongoing')}
            >
              <Clock size={16} className="mr-2" />
              Start Job
            </Button>
          )}
          {['in-progress', 'ongoing', 'accepted'].includes(a.status) && (
            <Button
              className="w-full justify-center bg-success-600 hover:bg-success-700"
              onClick={() => updateJobStatus(a._id, 'completed')}
            >
              <CheckCircle size={16} className="mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Worker Dashboard</h1>
            <p className="text-neutral-500">View your assigned jobs and update status.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total Works</p>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">{assignments.length}</h3>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                <Briefcase size={20} />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-success-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Completed</p>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">{completed.length}</h3>
              </div>
              <div className="p-2 bg-success-100 rounded-lg text-success-600">
                <CheckCircle size={20} />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Earnings</p>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">₹{Number(totalEarnings || 0).toFixed(2)}</h3>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <DollarSign size={20} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Assigned Works</h2>
            <div className="space-y-4">
              {assigned.length > 0 ? assigned.map(a => renderJobCard(a, 'border-l-primary-500')) : (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-neutral-300 text-neutral-500">
                  No assigned works
                </div>
              )}
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Ongoing Works</h2>
            <div className="space-y-4">
              {ongoing.length > 0 ? ongoing.map(a => renderJobCard(a, 'border-l-warning-500')) : (
                <div className="text-center py-10 text-neutral-500">No ongoing works</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Completed Works</h2>
            <div className="space-y-4">
              {completed.length > 0 ? completed.map(a => (
                <Card key={a._id} className="border-l-4 border-l-success-500 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="neutral" className="mb-2">
                        {a.service?.name || 'Service'}
                      </Badge>
                      <h3 className="text-lg font-bold text-neutral-900">{a.customer?.name || 'Customer'}</h3>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-10 text-neutral-500">No completed works</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Cancelled Works</h2>
            <div className="space-y-4">
              {cancelled.length > 0 ? cancelled.map(a => (
                <Card key={a._id} className="border-l-4 border-l-error-500 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="neutral" className="mb-2">
                        {a.service?.name || 'Service'}
                      </Badge>
                      <h3 className="text-lg font-bold text-neutral-900">{a.customer?.name || 'Customer'}</h3>
                    </div>
                    <Badge variant="danger">Cancelled</Badge>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-10 text-neutral-500">No cancelled works</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
