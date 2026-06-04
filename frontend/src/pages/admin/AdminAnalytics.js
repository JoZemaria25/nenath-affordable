import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api, { formatPrice } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, TrendingUp, ShoppingBag } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 bg-white animate-pulse rounded" />)}</div>;

  return (
    <div data-testid="admin-analytics">
      <h2 className="text-xl font-heading mb-6">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><TrendingUp size={16} /> Revenue Trends</CardTitle></CardHeader>
          <CardContent>
            {data?.revenue_trends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.revenue_trends.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Bar dataKey="revenue" fill="#C6A85B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-500 text-center py-8">No revenue data yet</p>}
          </CardContent>
        </Card>

        {/* Best Selling */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><ShoppingBag size={16} /> Best Selling Products</CardTitle></CardHeader>
          <CardContent>
            {data?.best_selling?.length > 0 ? (
              <div className="space-y-3">
                {data.best_selling.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                      <span className="text-sm">{item.name || 'Unknown'}</span>
                    </div>
                    <span className="text-sm font-medium">{item.total_sold} sold</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No sales data yet</p>}
          </CardContent>
        </Card>

        {/* Most Viewed */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><Eye size={16} /> Most Viewed Products</CardTitle></CardHeader>
          <CardContent>
            {data?.most_viewed?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.most_viewed.map((product, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50">
                    <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                    <div className="w-10 h-12 bg-[#F5F1EB] overflow-hidden flex-shrink-0">{product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.views} views</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(product.discount_price || product.price)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">No view data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
