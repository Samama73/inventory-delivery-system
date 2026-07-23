import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [daySummary, setDaySummary] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDaySummary(selectedDate);
    } else {
      setDaySummary(null);
    }
  }, [selectedDate]);

  async function fetchSummary() {
    try {
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
    } catch (err) {
      setError('System Exception: Unable to retrieve dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDaySummary(date) {
    setDayLoading(true);
    try {
      const res = await api.get(`/dashboard/day-summary?date=${date}`);
      setDaySummary(res.data);
    } catch (err) {
      setDaySummary(null);
    } finally {
      setDayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 w-full">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-wide animate-pulse">Retrieving Executive Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center w-full">
        <div className="bg-rose-50 text-rose-700 px-6 py-5 rounded-2xl border border-rose-200 shadow-sm font-bold flex items-center gap-3">
          <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Overview</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            A comprehensive summary of current inventory levels and logistical operations.
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <SummaryCard
          title="Total Inventory"
          value={summary.totalItems}
          theme="blue"
        />
        <SummaryCard
          title="Low Stock Items"
          value={summary.lowStockItems}
          theme="rose"
        />
        <SummaryCard
          title="Pending Deliveries"
          value={summary.pendingDeliveries}
          theme="amber"
        />
        <SummaryCard
          title="Completed Deliveries"
          value={summary.completedDeliveries}
          theme="emerald"
        />
      </div>

      {/* Recent Pending Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden w-full">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Recent Pending Dispatches
          </h2>
        </div>

        {summary.recentPending.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="text-3xl">🎉</span>
            </div>
            <p className="text-slate-800 font-bold text-lg">All caught up!</p>
            <p className="text-slate-500 text-sm mt-1">No pending dispatches currently logged in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Designation</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Count</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client Profile</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summary.recentPending.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{d.item_name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">{d.quantity}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{d.customer_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {d.delivery_date ? (
                        <span className="text-slate-700">{new Date(d.delivery_date).toLocaleDateString('en-GB')}</span>
                      ) : (
                        <span className="text-amber-500 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Not Scheduled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Date Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden w-full">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Day-wise Activity Lookup
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Clear Date"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {!selectedDate ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="text-3xl">📅</span>
            </div>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">
              Select a specific date from the calendar above to view that day's complete dispatch and operational activity.
            </p>
          </div>
        ) : dayLoading ? (
          <div className="p-12 flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading day records...</p>
          </div>
        ) : !daySummary || daySummary.totalDeliveries === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="text-3xl">📭</span>
            </div>
            <p className="text-slate-800 font-bold text-lg">No Activity</p>
            <p className="text-slate-500 text-sm mt-1">
              No dispatch activity recorded for <span className="font-bold text-slate-700">{new Date(selectedDate).toLocaleDateString('en-GB')}</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-6 bg-slate-50/30">
              <MiniStat label="Total Dispatches" value={daySummary.totalDeliveries} theme="blue" />
              <MiniStat label="Fulfilled" value={daySummary.completed} theme="emerald" />
              <MiniStat label="Awaiting Dispatch" value={daySummary.pending} theme="amber" />
            </div>

            <div className="overflow-x-auto border-t border-slate-100 w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Count</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {daySummary.deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{d.item_name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">{d.quantity}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{d.customer_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border shadow-sm ${
                          d.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {d.status === 'completed' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2"></span>
                              Fulfilled
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                              Awaiting Dispatch
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, theme }) {
  const themes = {
    blue: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      text: 'text-blue-600',
      dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    },
    rose: {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100',
      text: 'text-rose-600',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    },
    amber: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-100',
      text: 'text-amber-600',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    },
    emerald: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    },
  };

  const current = themes[theme];

  return (
    <div className={`p-6 rounded-2xl border ${current.border} bg-white shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${current.bg} rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110`}></div>
      <h3 className="text-sm font-bold text-slate-500 tracking-wide uppercase">{title}</h3>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-4xl font-extrabold text-slate-900">{value}</span>
        <div className={`w-3.5 h-3.5 rounded-full mb-1.5 ${current.dot}`}></div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, theme }) {
  const themes = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  };
  
  const current = themes[theme];

  return (
    <div className={`${current.bg} ${current.border} rounded-xl border p-5 text-center shadow-sm`}>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${current.text}`}>{value}</p>
    </div>
  );
}

export default Dashboard;