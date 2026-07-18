import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Building2, CalendarCheck, AlertTriangle, CheckCircle, XCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import StarRating from '../../components/ui/StarRating';

const COLORS = ['#6366f1', '#22c55e', '#3b82f6', '#ef4444'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const { data } = await adminAPI.getPlatformAnalytics();
        setAnalytics(data.data);
      } else if (tab === 'users') {
        const { data } = await adminAPI.getUsers({ limit: 50 });
        setUsers(data.data || []);
      } else if (tab === 'businesses') {
        // Fetch pending businesses via business API
        const { default: api } = await import('../../api/axios');
        const { data } = await api.get('/businesses?isApproved=false&limit=50', { params: {} });
        // Use admin analytics for pending businesses
        const analyticsRes = await adminAPI.getPlatformAnalytics();
        setAnalytics(analyticsRes.data.data);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const toggleSuspend = async (userId) => {
    try {
      const { data } = await adminAPI.toggleSuspend(userId);
      toast.success(data.message);
      fetchData();
    } catch { toast.error('Failed to update user'); }
  };

  const approveBusiness = async (bizId, approved) => {
    try {
      await adminAPI.approveBusiness(bizId, { approved });
      toast.success(approved ? 'Business approved!' : 'Business rejected.');
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'businesses', label: 'Businesses', icon: Building2 },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = (analytics?.monthlyTrend || []).map((m) => ({
    month: monthNames[m._id.month - 1],
    bookings: m.count,
  }));
  const statusData = (analytics?.statusBreakdown || []).map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform overview and management</p>

          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Businesses', value: analytics.totalBusinesses, icon: Building2, color: 'text-indigo-400' },
                { label: 'Appointments', value: analytics.totalAppointments, icon: CalendarCheck, color: 'text-green-400' },
                { label: 'Pending Approvals', value: analytics.pendingApprovals, icon: AlertTriangle, color: 'text-amber-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center',
                tab === id ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div> : (
          <>
            {/* Overview */}
            {tab === 'overview' && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Monthly Appointments</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Appointment Status Breakdown</h3>
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-center text-gray-400 py-8">No data yet</p>}
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Reviews</h3>
                  <div className="space-y-3">
                    {(analytics.recentReviews || []).slice(0, 5).map((r) => (
                      <div key={r._id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 text-sm">
                          {r.customer?.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{r.customer?.name} → {r.business?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.comment}</p>
                        </div>
                        <StarRating rating={r.rating} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Management */}
            {tab === 'users' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">All Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">User</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Joined</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 text-sm">
                                {u.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx('px-2 py-1 rounded-full text-xs font-medium',
                              u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              u.role === 'business_owner' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                              'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                            )}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx('px-2 py-1 rounded-full text-xs font-medium',
                              u.isSuspended ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            )}>
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => toggleSuspend(u._id)}
                                className={clsx('text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                                  u.isSuspended
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                                )}
                              >
                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {tab === 'reviews' && analytics && (
              <div className="space-y-4">
                {(analytics.recentReviews || []).map((r) => (
                  <div key={r._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                          {r.customer?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{r.customer?.name}</p>
                          <p className="text-sm text-gray-400">→ {r.business?.name}</p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
