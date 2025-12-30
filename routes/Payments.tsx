
import React, { useEffect, useState, useMemo } from 'react';
import { mockApi } from '../services/mockApi';
import { Transaction, Payout } from '../types';
import Badge from '../components/Badge';
import { 
  CreditCard, DollarSign, TrendingUp, ExternalLink, Download, CheckCircle, 
  Clock, ArrowUpRight, AlertCircle, PieChart as PieChartIcon, Search, 
  Filter, MoreHorizontal, X, Smartphone, Wallet, Globe, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const Payments: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'WEEK' | 'MONTH'>('MONTH');

  useEffect(() => {
    const fetchData = async () => {
      const [txs, pos] = await Promise.all([
        mockApi.getTransactions(),
        mockApi.getPayouts()
      ]);
      setTransactions(txs);
      setPayouts(pos);
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- Calculations ---
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const revenue = currentMonthTxs.reduce((acc, t) => t.status === 'PAID' ? acc + t.amount : acc, 0);
    const pending = currentMonthTxs.reduce((acc, t) => t.status === 'PENDING' ? acc + t.amount : acc, 0);
    const successful = currentMonthTxs.filter(t => t.status === 'PAID').length;
    const successRate = transactions.length > 0 ? Math.round((successful / transactions.length) * 100) : 0;

    return [
      { label: 'Revenue (MTD)', value: `$${revenue.toLocaleString()}`, icon: <DollarSign size={20} />, trend: '+14%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Pending Volume', value: `$${pending.toLocaleString()}`, icon: <Clock size={20} />, trend: '+2%', color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Total Payouts', value: `$${payouts.reduce((acc, p) => p.status === 'COMPLETED' ? acc + p.amount : acc, 0).toLocaleString()}`, icon: <CheckCircle size={20} />, trend: 'Stable', color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Success Rate', value: `${successRate}%`, icon: <TrendingUp size={20} />, trend: '+0.5%', color: 'text-blue-600', bg: 'bg-blue-50' },
    ];
  }, [transactions, payouts]);

  // Chart Data
  const chartData = useMemo(() => {
    // Generate last 7 days or last 4 weeks mock distribution
    if (chartPeriod === 'WEEK') {
        return [
            { name: 'Mon', revenue: 450 },
            { name: 'Tue', revenue: 800 },
            { name: 'Wed', revenue: 600 },
            { name: 'Thu', revenue: 1100 },
            { name: 'Fri', revenue: 950 },
            { name: 'Sat', revenue: 1400 },
            { name: 'Sun', revenue: 300 },
        ];
    }
    return [
        { name: 'Week 1', revenue: 3400 },
        { name: 'Week 2', revenue: 4200 },
        { name: 'Week 3', revenue: 2900 },
        { name: 'Week 4', revenue: 5100 },
    ];
  }, [chartPeriod]);

  const methodData = [
    { name: 'Card', value: 65, color: '#4f46e5' },
    { name: 'Apple Pay', value: 20, color: '#818cf8' },
    { name: 'G Pay', value: 10, color: '#c7d2fe' },
    { name: 'Other', value: 5, color: '#e0e7ff' },
  ];

  const topServices = useMemo(() => {
     const counts: Record<string, number> = {};
     transactions.filter(t => t.status === 'PAID').forEach(t => {
         counts[t.serviceName] = (counts[t.serviceName] || 0) + t.amount;
     });
     return Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const maxServiceVal = Math.max(...topServices.map(s => s.value), 1);

  const getMethodIcon = (method: string) => {
    switch (method) {
        case 'CARD': return <CreditCard size={14} />;
        case 'WALLET': return <Smartphone size={14} />;
        default: return <Globe size={14} />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50/50 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Payments
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by</span>
                <span className="text-sm font-black text-[#635BFF] flex items-center gap-1">
                    Stripe
                </span>
            </div>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage transactions, payouts, and financial health.</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm shadow-sm transition-all">
                <Download size={16} /> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white font-bold rounded-xl hover:bg-[#5851E0] text-sm shadow-md shadow-indigo-100 transition-all">
                View Stripe Dashboard <ExternalLink size={16} />
            </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="flex items-center text-green-500 text-[10px] font-bold bg-green-50 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-0.5">{stat.value}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Transaction History */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Transaction History</h3>
                        <p className="text-xs text-gray-500 mt-1">Real-time payment logs</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search client or ID..." 
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <button className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-[10px] text-gray-400 font-bold uppercase bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4">Client / Service</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Loading transactions...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No transactions recorded.</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr 
                                        key={tx.id} 
                                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedTx(tx)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                                    {tx.clientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-xs">{tx.clientName}</p>
                                                    <p className="text-[10px] text-gray-400">{tx.serviceName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={tx.status} className="scale-90 origin-left" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">${tx.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-700">{new Date(tx.date).toLocaleDateString()}</span>
                                                <span className="text-[9px] text-gray-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                {getMethodIcon(tx.paymentMethod)}
                                                <span className="text-[10px] font-medium">{tx.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-300 group-hover:text-gray-600">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payouts Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Wallet className="text-green-500" size={20} /> Payout Status
                    </h3>
                    <span className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">Manage Bank Account</span>
                </div>
                <div className="p-6 space-y-4">
                    {payouts.map(po => (
                        <div key={po.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${po.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {po.status === 'COMPLETED' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">${po.amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500">{po.bankName} • {po.status === 'COMPLETED' ? 'Arrived on' : 'Arrives'} {new Date(po.arrivalDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    po.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>{po.status}</span>
                                <button className="text-[10px] text-gray-400 mt-2 hover:underline">View Breakdown</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Revenue Trend</h3>
                    <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                        <button 
                            onClick={() => setChartPeriod('WEEK')} 
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartPeriod === 'WEEK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            Week
                        </button>
                        <button 
                             onClick={() => setChartPeriod('MONTH')} 
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartPeriod === 'MONTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>
                
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                            <Tooltip 
                                cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Services by Revenue */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-6">Top Services</h3>
                <div className="space-y-5">
                    {topServices.map((service, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="text-xs font-bold text-gray-700 truncate max-w-[70%]">{service.name}</span>
                                <span className="text-xs font-black text-gray-900">${service.value.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(service.value / maxServiceVal) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">Methods</h3>
                    <PieChartIcon size={18} className="text-indigo-400" />
                </div>
                <div className="h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={methodData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {methodData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-gray-800">Card</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mt-4">
                    {methodData.map(m => (
                        <div key={m.name} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: m.color}}></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-lg space-y-4">
                <h3 className="font-bold flex items-center gap-2"><AlertCircle size={18} /> Financial Alerts</h3>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-3">
                    <p className="text-xs text-indigo-100 leading-relaxed">
                        <span className="font-bold text-white">Projected Growth:</span> Based on your current booking rate, next month's revenue is estimated to grow by <span className="text-green-300 font-bold">18%</span>.
                    </p>
                    <button className="w-full py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-400 transition-colors flex items-center justify-center gap-2">
                        View Detailed Forecast <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTx(null)}></div>
              <div className="relative z-50 w-full max-w-lg bg-white shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
                      <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <X size={20} className="text-gray-400" />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      {/* Amount Header */}
                      <div className="text-center">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                          <h3 className="text-5xl font-black text-gray-900">${selectedTx.amount.toFixed(2)}</h3>
                          <div className="mt-4 flex justify-center">
                              <Badge status={selectedTx.status} />
                          </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                              <p className="text-sm font-bold text-gray-900">{selectedTx.clientName}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service</p>
                              <p className="text-sm font-bold text-gray-900">{selectedTx.serviceName}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stripe ID</p>
                              <p className="text-[10px] font-mono font-medium text-gray-600 truncate">{selectedTx.stripeTransactionId}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 capitalize">
                                  {getMethodIcon(selectedTx.paymentMethod)}
                                  {selectedTx.paymentMethod.toLowerCase()}
                              </div>
                          </div>
                      </div>

                      {/* History & Timeline (Mock) */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Billing Timeline</h4>
                        <div className="space-y-4 relative pl-5">
                            <div className="absolute left-[3px] top-1.5 bottom-1.5 w-0.5 bg-gray-100"></div>
                            <div className="relative">
                                <span className="absolute -left-[23px] top-0.5 w-2 h-2 rounded-full bg-green-500 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-gray-900">Payment {selectedTx.status === 'PAID' ? 'Succeeded' : 'Initiated'}</p>
                                <p className="text-[10px] text-gray-400">{new Date(selectedTx.date).toLocaleString()}</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[23px] top-0.5 w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white"></span>
                                <p className="text-xs font-bold text-gray-500">Invoice Generated</p>
                                <p className="text-[10px] text-gray-400">{new Date(new Date(selectedTx.date).getTime() - 120000).toLocaleString()}</p>
                            </div>
                        </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                      <button className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                          <Download size={14} /> Download Receipt
                      </button>
                      <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                          Issue Refund
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Payments;
