import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, CreditCard, AlertTriangle, TrendingUp, Bell, Users, Eye, Calculator, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api, { formatPrice } from '@/lib/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [visitorStats, setVisitorStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesModal, setSalesModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [saleOrderId, setSaleOrderId] = useState('');
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/notifications'),
      api.get('/admin/visitor-stats'),
      api.get('/admin/sales')
    ]).then(([dash, notif, visitors, sales]) => {
      setData(dash.data);
      setNotifications(notif.data.notifications.slice(0, 10));
      setVisitorStats(visitors.data.daily_stats.slice(0, 14).reverse());
      setSalesData(sales.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.put(`/admin/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
  };

  const recordSale = async () => {
    if (!saleAmount) return;
    try {
      await api.post('/admin/sales', { amount: parseFloat(saleAmount), description: saleDesc, order_id: saleOrderId });
      toast.success('Sale recorded!');
      setSalesModal(false);
      setSaleAmount(''); setSaleDesc(''); setSaleOrderId('');
      // Refresh data
      const [dash, sales] = await Promise.all([api.get('/admin/dashboard'), api.get('/admin/sales')]);
      setData(dash.data);
      setSalesData(sales.data);
    } catch { toast.error('Failed to record sale'); }
  };

  const deleteSale = async (saleId) => {
    try {
      await api.delete(`/admin/sales/${saleId}`);
      const [dash, sales] = await Promise.all([api.get('/admin/dashboard'), api.get('/admin/sales')]);
      setData(dash.data);
      setSalesData(sales.data);
      toast.success('Deleted');
    } catch {}
  };

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-white animate-pulse rounded-lg" />)}</div>;

  return (
    <div data-testid="admin-dashboard">
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Products</p><p className="text-2xl font-heading font-semibold mt-1">{data?.total_products || 0}</p></div>
            <Package size={22} className="text-[#C6A85B]" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Orders</p><p className="text-2xl font-heading font-semibold mt-1">{data?.total_orders || 0}</p></div>
            <ShoppingCart size={22} className="text-[#1E3A8A]" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmed Rev.</p><p className="text-2xl font-heading font-semibold mt-1">{formatPrice(data?.total_revenue || 0)}</p></div>
            <TrendingUp size={22} className="text-[#166534]" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Registered Users</p><p className="text-2xl font-heading font-semibold mt-1">{data?.total_users || 0}</p></div>
            <Users size={22} className="text-[#7C3AED]" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</p><p className="text-2xl font-heading font-semibold mt-1">{data?.pending_payments || 0}</p></div>
            <CreditCard size={22} className="text-[#991B1B]" />
          </div>
        </CardContent></Card>
      </div>

      {/* Revenue Calculator & Visitor Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Calculator */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2"><Calculator size={16} className="text-[#C6A85B]" /> Revenue Calculator</CardTitle>
              <Button data-testid="record-sale-btn" size="sm" onClick={() => setSalesModal(true)} className="bg-[#0A0A0A] text-white text-xs gap-1"><Plus size={12} /> Record Sale</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-[#F5F1EB] p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recorded Sales</p>
                <p className="text-lg font-heading font-semibold text-[#166534]">{formatPrice(salesData?.total_recorded || data?.recorded_revenue || 0)}</p>
              </div>
              <div className="bg-[#F5F1EB] p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Projected (Orders)</p>
                <p className="text-lg font-heading font-semibold text-[#1E3A8A]">{formatPrice(salesData?.projected_revenue || data?.projected_revenue || 0)}</p>
              </div>
              <div className="bg-[#F5F1EB] p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmed Paid</p>
                <p className="text-lg font-heading font-semibold text-[#C6A85B]">{formatPrice(salesData?.confirmed_revenue || data?.total_revenue || 0)}</p>
              </div>
            </div>
            {/* Recent sales */}
            <div className="max-h-48 overflow-y-auto">
              {(salesData?.records || data?.sales_records || []).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No sales recorded yet. Click "Record Sale" to start tracking.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 uppercase">Date</th><th className="text-left py-2 text-gray-500 uppercase">Description</th><th className="text-right py-2 text-gray-500 uppercase">Amount</th><th className="w-8"></th></tr></thead>
                  <tbody>
                    {(salesData?.records || data?.sales_records || []).slice(0, 10).map(s => (
                      <tr key={s.sale_id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="py-2">{s.description || '-'}</td>
                        <td className="py-2 text-right font-semibold">{formatPrice(s.amount)}</td>
                        <td className="py-2"><button onClick={() => deleteSale(s.sale_id)} className="p-1 hover:text-red-500"><Trash2 size={10} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visitor Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2"><Eye size={16} className="text-[#1E3A8A]" /> Visitor Tracking (14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#F5F1EB] p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Today's Visits</p>
                <p className="text-lg font-heading font-semibold">{data?.today_visits || 0}</p>
              </div>
              <div className="bg-[#F5F1EB] p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Registered Users</p>
                <p className="text-lg font-heading font-semibold">{data?.total_users || 0}</p>
              </div>
            </div>
            {visitorStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={visitorStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 3 }} name="Total Visits" />
                  <Line type="monotone" dataKey="unique_visitors" stroke="#C6A85B" strokeWidth={2} dot={{ r: 3 }} name="Unique" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-500 text-center py-8">Visitor data will appear as users browse the site</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-heading">Recent Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase">Order</th>
                    <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-2 px-2 text-xs text-gray-500 uppercase">Status</th>
                  </tr></thead>
                  <tbody>
                    {data?.recent_orders?.map(order => (
                      <tr key={order.order_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2"><Link to="/admin/orders" className="font-medium hover:text-[#C6A85B]">#{order.order_id.slice(0, 8)}</Link></td>
                        <td className="py-2 px-2 text-gray-600">{order.customer_name}</td>
                        <td className="py-2 px-2 font-medium">{formatPrice(order.total)}</td>
                        <td className="py-2 px-2"><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-100">{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!data?.recent_orders || data.recent_orders.length === 0) && <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>}
              </div>
            </CardContent>
          </Card>

          {data?.low_stock_count > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading flex items-center gap-2"><AlertTriangle size={16} className="text-[#C6A85B]" /> Low Stock ({data.low_stock_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.low_stock_products?.map(p => (
                    <div key={p.product_id} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5">{p.stock} left</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notifications */}
        <div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-heading flex items-center gap-2"><Bell size={16} /> Notifications</CardTitle></CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.notification_id} onClick={() => !n.read && markRead(n.notification_id)}
                      className={`p-3 text-sm cursor-pointer transition-colors ${n.read ? 'bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}>
                      <p className={`${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Sale Modal */}
      <Dialog open={salesModal} onOpenChange={setSalesModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Record Successful Sale</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Amount (NGN) *</label>
              <Input data-testid="sale-amount-input" type="number" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="e.g. 45000" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description</label>
              <Input value={saleDesc} onChange={(e) => setSaleDesc(e.target.value)} placeholder="e.g. Adire dress sale" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Order ID (optional)</label>
              <Input value={saleOrderId} onChange={(e) => setSaleOrderId(e.target.value)} placeholder="Link to order..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setSalesModal(false)} className="flex-1">Cancel</Button>
              <Button data-testid="save-sale-btn" onClick={recordSale} disabled={!saleAmount} className="flex-1 bg-[#0A0A0A] text-white">Record Sale</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
