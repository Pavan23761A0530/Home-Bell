import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, DollarSign, Calendar, CreditCard, Download } from 'lucide-react';

const EarningsDashboard = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // month, year, all

  useEffect(() => {
    fetchEarningsData();
  }, [filter]);

  const fetchEarningsData = async () => {
    try {
      // Mock data for now - would come from API in real implementation
      const mockEarningsData = {
        totalEarnings: 12500.00,
        monthlyEarnings: 2450.00,
        weeklyEarnings: 620.00,
        pendingPayouts: 150.00,
        completedJobs: 42,
        averageRating: 4.8,
        payouts: [
          { id: 1, amount: 850.00, date: '2023-06-15', status: 'completed', description: 'Plumbing Service - Residential' },
          { id: 2, amount: 420.00, date: '2023-06-10', status: 'completed', description: 'Electrical Repair' },
          { id: 3, amount: 150.00, date: '2023-06-05', status: 'pending', description: 'AC Maintenance' },
        ],
        earningsByService: [
          { service: 'Plumbing', earnings: 5200.00, jobs: 18 },
          { service: 'Electrical', earnings: 3800.00, jobs: 15 },
          { service: 'Cleaning', earnings: 2100.00, jobs: 22 },
          { service: 'AC Repair', earnings: 1400.00, jobs: 10 },
        ]
      };

      setEarningsData(mockEarningsData);
      setTransactions(mockEarningsData.payouts);
    } catch (err) {
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading earnings dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
        <p className="text-gray-600">Track your earnings, transactions, and payment history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{earningsData.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{earningsData.monthlyEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900">₹{earningsData.pendingPayouts.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{earningsData.completedJobs}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{transaction.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
              <Download className="mr-1" size={18} />
              Download Report
            </button>
          </div>
        </div>

        {/* Earnings by Service */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Earnings by Service</h2>
          
          <div className="space-y-4">
            {earningsData.earningsByService.map((service, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{service.service}</span>
                  <span className="text-gray-900">₹{service.earnings.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(service.earnings / earningsData.totalEarnings) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{service.jobs} jobs</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{earningsData.averageRating}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="text-xs text-gray-500 mt-1">(Based on 38 reviews)</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{earningsData.completedJobs}</div>
            <div className="text-sm text-gray-600">Jobs Completed</div>
            <div className="text-xs text-gray-500 mt-1">Success Rate: 98%</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">87%</div>
            <div className="text-sm text-gray-600">On-Time Completion</div>
            <div className="text-xs text-gray-500 mt-1">Avg. Response: 2 hrs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;