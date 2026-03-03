import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { RefreshCcw } from 'lucide-react';

const ProviderEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [range, setRange] = useState('30d'); // 7d | 30d | 6m | 1y | all

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      if (res.data.success) {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setBookings(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(now.getDate() - 6);
    else if (range === '30d') start.setDate(now.getDate() - 29);
    else if (range === '6m') start.setMonth(now.getMonth() - 5);
    else if (range === '1y') start.setFullYear(now.getFullYear() - 1);
    else if (range === 'all') start.setFullYear(1970);
    // Use createdAt or scheduledDate for timeline; earnings only for paid/completed
    return bookings.filter(b => {
      const t = new Date(b.createdAt || b.scheduledDate || b.updatedAt || Date.now());
      return t >= start && t <= now;
    });
  }, [bookings, range]);

  const paidBookings = useMemo(
    () => filtered.filter(b => (b.paymentStatus === 'paid') || (b.status === 'completed')),
    [filtered]
  );

  const totalEarnings = paidBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dayKey = (d) => d.toISOString().slice(0, 10);

  const trendByDay = useMemo(() => {
    const map = {};
    paidBookings.forEach(b => {
      const d = new Date(b.createdAt || b.updatedAt || b.scheduledDate || Date.now());
      const key = range === '6m' || range === '1y' || range === 'all' ? monthKey(d) : dayKey(d);
      map[key] = (map[key] || 0) + (Number(b.price) || 0);
    });
    return Object.entries(map).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([k, v]) => ({ period: k, amount: v }));
  }, [paidBookings, range]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(b => {
      const name = b.service?.name || 'Unknown';
      const amt = (b.paymentStatus === 'paid' || b.status === 'completed') ? (Number(b.price) || 0) : 0;
      map[name] = (map[name] || 0) + amt;
    });
    return Object.entries(map).map(([k, v]) => ({ name: k, amount: v }));
  }, [filtered]);

  const statusDist = useMemo(() => {
    const map = { Pending: 0, Ongoing: 0, Completed: 0 };
    filtered.forEach(b => {
      const s = (b.statusNormalized || b.status || '').toLowerCase();
      if (['searching-provider', 'assigned', 'pending'].includes(s)) map.Pending++;
      else if (['accepted', 'in-progress', 'ongoing'].includes(s)) map.Ongoing++;
      else if (s === 'completed') map.Completed++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const jobsPerMonth = useMemo(() => {
    const map = {};
    filtered.forEach(b => {
      const d = new Date(b.createdAt || b.scheduledDate || Date.now());
      const key = monthKey(d);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0] > b[0] ? 1 : -1).map(([k, v]) => ({ month: k, count: v }));
  }, [filtered]);

  const completedJobs = paidBookings.length;
  const ongoingJobs = filtered.filter(b => ['accepted', 'in-progress', 'ongoing'].includes((b.statusNormalized || b.status || '').toLowerCase())).length;

  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9', '#A78BFA', '#E11D48'];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Earnings & Analytics</h1>
          <p className="text-neutral-600 mt-1">Live insights powered by your bookings.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="secondary" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCcw size={16} /> Refresh
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-neutral-500">Total Earnings</p>
          <h3 className="text-2xl font-bold mt-1">₹{totalEarnings.toFixed(2)}</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-neutral-500">Monthly Earnings</p>
          <h3 className="text-2xl font-bold mt-1">
            ₹{trendByDay.filter(d => d.period.startsWith(new Date().getFullYear() + '-')).reduce((s, d) => s + d.amount, 0).toFixed(2)}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-neutral-500">Completed Jobs</p>
          <h3 className="text-2xl font-bold mt-1">{completedJobs}</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-neutral-500">Ongoing Jobs</p>
          <h3 className="text-2xl font-bold mt-1">{ongoingJobs}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Earnings Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Earnings by Service</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Job Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Jobs per Month</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProviderEarnings;
