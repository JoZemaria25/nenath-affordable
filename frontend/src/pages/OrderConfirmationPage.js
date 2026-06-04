import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api, { formatPrice } from '@/lib/api';
import { toast } from 'sonner';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(r => setOrder(r.data.order)).catch(() => {});
    api.get('/settings').then(r => setSettings(r.data.settings)).catch(() => {});
  }, [orderId]);

  const handleUploadProof = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/orders/${orderId}/payment-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success("Payment proof uploaded!");
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.order);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  if (!order) return <div className="pt-24 min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#1c1a17] border-t-transparent rounded-full" /></div>;

  return (
    <div data-testid="order-confirmation-page" className="pt-20 lg:pt-24 min-h-screen bg-[#fbfaf8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8">
          <CheckCircle size={48} className="mx-auto text-[#166534] mb-4" />
          <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight">Order Confirmed</h1>
          <p className="text-sm text-gray-500 mt-2 font-body">Order #{order.order_id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Bank details */}
        {settings && (settings.bank_name || settings.account_name) && (
          <div className="bg-[#F5F1EB] p-6 mb-6 space-y-3">
            <h3 className="label-uppercase text-gray-700">Complete Your Payment</h3>
            <p className="text-sm text-gray-600">Transfer {formatPrice(order.total)} to:</p>
            <div className="space-y-1 text-sm font-medium">
              {settings.bank_name && <p>Bank: {settings.bank_name}</p>}
              {settings.account_name && <p>Account Name: {settings.account_name}</p>}
              {settings.account_number && <p>Account Number: {settings.account_number}</p>}
            </div>
          </div>
        )}

        {/* Upload payment proof */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="label-uppercase text-gray-500 mb-3">Upload Payment Proof</h3>
          {order.payment_proof ? (
            <p className="text-sm text-[#166534] font-medium">Payment proof uploaded. Awaiting verification.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">Upload a screenshot of your payment for faster processing.</p>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-[#1c1a17] text-white px-6 py-3 uppercase text-xs tracking-wider hover:bg-black/80 transition-colors">
                <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Proof'}
                <input data-testid="upload-payment-proof" type="file" accept="image/*" onChange={handleUploadProof} className="hidden" disabled={uploading} />
              </label>
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="label-uppercase text-gray-500 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.size && `Size: ${item.size}`}{item.color && ` / ${item.color}`} x{item.quantity}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.item_total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
            <span>Total</span><span className="font-heading text-lg">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Shipping info */}
        <div className="border border-gray-200 p-6 mb-8">
          <h3 className="label-uppercase text-gray-500 mb-3">Shipping Details</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">Name:</span> {order.customer_name}</p>
            <p><span className="text-gray-500">Phone:</span> {order.customer_phone}</p>
            <p><span className="text-gray-500">Address:</span> {order.shipping_address}</p>
            {order.city && <p><span className="text-gray-500">City:</span> {order.city}, {order.state}</p>}
            <p><span className="text-gray-500">Status:</span> <span className="uppercase text-xs tracking-wider font-semibold text-[#C6A85B]">{order.status}</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/orders" className="flex-1"><Button variant="outline" className="w-full py-5 uppercase text-xs tracking-wider border-gray-200">View All Orders</Button></Link>
          <Link to="/shop" className="flex-1"><Button className="w-full bg-[#1c1a17] text-white py-5 uppercase text-xs tracking-wider">Continue Shopping <ArrowRight size={14} className="ml-2" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
