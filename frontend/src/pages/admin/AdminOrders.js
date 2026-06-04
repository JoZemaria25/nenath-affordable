import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { formatPrice } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['pending', 'payment_received', 'processing', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['pending', 'submitted', 'approved', 'rejected'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/admin/orders?${params}`).then(r => {
      setOrders(r.data.orders); setTotal(r.data.total); setPages(r.data.pages);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  const updateOrderStatus = async (orderId, field, value) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { [field]: value });
      toast.success(`Order ${field.replace('_', ' ')} updated`);
      fetchOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, [field]: value }));
      }
    } catch { toast.error('Update failed'); }
  };

  return (
    <div data-testid="admin-orders">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-heading">Orders</h2><p className="text-sm text-gray-500">{total} total orders</p></div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Order</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden sm:table-cell">Customer</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Amount</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Status</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden md:table-cell">Payment</th>
            <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium">#{order.order_id.slice(0, 8)}</p>
                  <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-gray-500">{order.customer_phone}</p>
                </td>
                <td className="py-3 px-4 font-medium">{formatPrice(order.total)}</td>
                <td className="py-3 px-4">
                  <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.order_id, 'status', v)}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <Select value={order.payment_status || 'pending'} onValueChange={(v) => updateOrderStatus(order.order_id, 'payment_status', v)}>
                    <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-gray-100 rounded"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
          <span className="text-sm">{page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Order #{selectedOrder?.order_id?.slice(0, 8)}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500 text-xs">Customer</p><p className="font-medium">{selectedOrder.customer_name}</p></div>
                <div><p className="text-gray-500 text-xs">Phone</p><p>{selectedOrder.customer_phone}</p></div>
                <div><p className="text-gray-500 text-xs">Email</p><p>{selectedOrder.customer_email}</p></div>
                <div><p className="text-gray-500 text-xs">Total</p><p className="font-semibold">{formatPrice(selectedOrder.total)}</p></div>
              </div>
              <div><p className="text-gray-500 text-xs">Address</p><p>{selectedOrder.shipping_address}{selectedOrder.city && `, ${selectedOrder.city}`}{selectedOrder.state && `, ${selectedOrder.state}`}</p></div>
              <div className="border-t pt-3"><p className="text-xs text-gray-500 uppercase mb-2">Items</p>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-gray-50">
                    <span>{item.name} {item.size && `(${item.size})`} x{item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.item_total)}</span>
                  </div>
                ))}
              </div>
              {selectedOrder.payment_proof && (
                <div className="border-t pt-3"><p className="text-xs text-gray-500 uppercase mb-2">Payment Proof</p>
                  <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${selectedOrder.payment_proof}`} alt="Payment proof" className="max-w-full h-auto border" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
