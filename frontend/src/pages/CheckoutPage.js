import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { formatPrice } from '@/lib/api';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', phone: '', address: '', city: '', state: '', notes: ''
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({ ...prev, customer_name: user.name || '', phone: user.phone || '', state: user.state || '' }));
      fetchCart();
    }
    api.get('/settings').then(r => setSettings(r.data.settings)).catch(() => {});
  }, [user, fetchCart]);

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.items.length) { toast.error("Cart is empty"); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/orders', form);
      toast.success("Order placed!");
      navigate(`/order-confirmation/${data.order.order_id}`);
    } catch (err) {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Please login to checkout</p>
        <Link to="/login"><Button className="bg-[#1c1a17] text-white uppercase text-xs tracking-wider px-8 py-3">Sign In</Button></Link>
      </div>
    </div>
  );

  return (
    <div data-testid="checkout-page" className="pt-20 lg:pt-24 min-h-screen bg-[#fbfaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h2 className="label-uppercase text-gray-500">Shipping Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Full Name</Label>
                    <Input data-testid="checkout-name" value={form.customer_name} onChange={update('customer_name')} required className="h-12 border-gray-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Phone Number</Label>
                    <Input data-testid="checkout-phone" value={form.phone} onChange={update('phone')} required className="h-12 border-gray-200" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Delivery Address</Label>
                  <Textarea data-testid="checkout-address" value={form.address} onChange={update('address')} required className="border-gray-200 min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">City</Label>
                    <Input data-testid="checkout-city" value={form.city} onChange={update('city')} required className="h-12 border-gray-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">State</Label>
                    <Input data-testid="checkout-state" value={form.state} onChange={update('state')} required className="h-12 border-gray-200" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Order Notes (optional)</Label>
                  <Textarea data-testid="checkout-notes" value={form.notes} onChange={update('notes')} className="border-gray-200" placeholder="Special instructions..." />
                </div>
              </div>

              {/* Bank Transfer Info */}
              {settings && (settings.bank_name || settings.account_name) && (
                <div className="bg-[#F5F1EB] p-6 space-y-3">
                  <h3 className="label-uppercase text-gray-700">Payment via Bank Transfer</h3>
                  <p className="text-sm text-gray-600">Please transfer the total amount to the following account:</p>
                  <div className="space-y-2 text-sm">
                    {settings.bank_name && <p><span className="font-semibold">Bank:</span> {settings.bank_name}</p>}
                    {settings.account_name && <p><span className="font-semibold">Account Name:</span> {settings.account_name}</p>}
                    {settings.account_number && <p><span className="font-semibold">Account Number:</span> {settings.account_number}</p>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">After payment, you can upload your payment proof from the order confirmation page.</p>
                </div>
              )}

              <Button data-testid="place-order-btn" type="submit" disabled={loading || !cart.items.length}
                className="w-full bg-[#1c1a17] text-white hover:bg-black/80 py-6 uppercase text-xs tracking-[0.15em]">
                {loading ? 'Placing order...' : `Place Order - ${formatPrice(cart.total)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#F5F1EB] p-6 sticky top-28">
              <h3 className="label-uppercase text-gray-500 mb-4">Order Summary</h3>
              <div className="space-y-4">
                {cart.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-gray-200/50">
                    <div className="w-16 h-20 bg-[#F5F1EB] overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">{item.size && `${item.size}`}{item.color && ` / ${item.color}`} x{item.quantity}</p>
                      <p className="text-sm font-semibold mt-1">{formatPrice(item.item_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-300 mt-4 pt-4">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(cart.total)}</span></div>
                <div className="flex justify-between text-sm mt-2"><span>Delivery</span><span className="text-gray-500">TBD</span></div>
                <div className="flex justify-between font-semibold text-lg mt-3 pt-3 border-t border-gray-300">
                  <span>Total</span><span className="font-heading">{formatPrice(cart.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
