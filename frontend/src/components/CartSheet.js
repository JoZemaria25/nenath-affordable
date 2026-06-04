import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/api';

export default function CartSheet({ open, onOpenChange }) {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid="cart-sheet" className="w-full sm:max-w-md flex flex-col z-[60]">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Shopping Bag ({cart.items.length})</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag size={48} className="text-gray-300" />
            <p className="text-gray-500 font-body">Your bag is empty</p>
            <Button data-testid="continue-shopping-btn" onClick={() => { onOpenChange(false); navigate('/shop'); }} className="bg-[#1c1a17] text-white hover:bg-black/80 uppercase text-xs tracking-[0.15em] px-8 py-3">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.items.map((item, idx) => (
                <div key={idx} data-testid={`cart-item-${idx}`} className="flex gap-4 pb-4 border-b border-gray-100">
                  <div className="w-20 h-24 bg-[#F5F1EB] overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold truncate pr-2">{item.product?.name}</h4>
                      <button data-testid={`remove-cart-item-${idx}`} onClick={() => removeItem(item.product_id, item.size, item.color)} className="p-1 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                    {(item.size || item.color) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.size && `Size: ${item.size}`}{item.size && item.color && ' / '}{item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200">
                        <button onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1), item.size, item.color)} className="p-1.5 hover:bg-gray-50"><Minus size={12} /></button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.size, item.color)} className="p-1.5 hover:bg-gray-50"><Plus size={12} /></button>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.item_total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 pb-2 space-y-4">
              <div className="flex justify-between items-center">
                <span className="label-uppercase text-gray-500">Subtotal</span>
                <span className="text-lg font-heading font-semibold">{formatPrice(cart.total)}</span>
              </div>
              <Button data-testid="checkout-btn" onClick={() => { onOpenChange(false); navigate('/checkout'); }}
                className="w-full bg-[#1c1a17] text-white hover:bg-black/80 uppercase text-xs tracking-[0.15em] py-6 relative z-[70]">
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
