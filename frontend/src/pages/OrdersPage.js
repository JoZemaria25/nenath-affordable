import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { formatPrice } from '@/lib/api';
import { Package, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  payment_received: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/orders').then(r => setOrders(r.data.orders)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">Please login to view orders</p>
        <Link to="/login" className="text-[#1c1a17] font-semibold hover:text-[#C6A85B]">Sign In</Link></div>
    </div>
  );

  return (
    <div data-testid="orders-page" className="pt-20 lg:pt-24 min-h-screen bg-[#fbfaf8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-body">No orders yet</p>
            <Link to="/shop" className="inline-block mt-4 bg-[#1c1a17] text-white px-8 py-3 uppercase text-xs tracking-wider">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.order_id} to={`/order-confirmation/${order.order_id}`} data-testid={`order-item-${order.order_id}`}
                className="block border border-gray-200 p-4 sm:p-6 hover:border-[#C6A85B] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Order #{order.order_id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold font-heading">{formatPrice(order.total)}</p>
                      <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 mt-1 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="w-12 h-14 bg-[#F5F1EB] flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  ))}
                  {order.items.length > 4 && <div className="w-12 h-14 bg-[#F5F1EB] flex items-center justify-center text-xs text-gray-500">+{order.items.length - 4}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
