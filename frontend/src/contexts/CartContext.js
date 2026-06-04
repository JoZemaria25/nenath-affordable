import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveCart = (items) => {
    const total = items.reduce((sum, item) => sum + (item.item_total || 0), 0);
    const newCart = { items, total };
    setCart(newCart);
    localStorage.setItem('nenath_cart', JSON.stringify(newCart));
  };

  const fetchCart = useCallback(() => {
    try {
      const stored = localStorage.getItem('nenath_cart');
      if (stored) {
        setCart(JSON.parse(stored));
      } else {
        setCart({ items: [], total: 0 });
      }
    } catch {
      setCart({ items: [], total: 0 });
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1, size = '', color = '') => {
    setLoading(true);
    try {
      // Fetch product details to store them in the cart
      const { data } = await api.get(`/products/${productId}`);
      const product = data.product;
      const price = product.discount_price || product.price;

      const currentItems = [...cart.items];
      const existingIdx = currentItems.findIndex(
        item => item.product_id === productId && item.size === size && item.color === color
      );

      if (existingIdx > -1) {
        currentItems[existingIdx].quantity += quantity;
        currentItems[existingIdx].item_total = currentItems[existingIdx].quantity * price;
      } else {
        currentItems.push({
          product_id: productId,
          quantity,
          size,
          color,
          item_total: quantity * price,
          product: {
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            discount_price: product.discount_price,
            images: product.images,
          }
        });
      }

      saveCart(currentItems);
      setCartOpen(true);
    } catch (e) {
      console.error("Failed to add to cart:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity, size = '', color = '') => {
    const currentItems = [...cart.items];
    const idx = currentItems.findIndex(
      item => item.product_id === productId && item.size === size && item.color === color
    );

    if (idx > -1) {
      const price = currentItems[idx].product.discount_price || currentItems[idx].product.price;
      currentItems[idx].quantity = quantity;
      currentItems[idx].item_total = quantity * price;
      saveCart(currentItems);
    }
  };

  const removeItem = async (productId, size = '', color = '') => {
    const filteredItems = cart.items.filter(
      item => !(item.product_id === productId && item.size === size && item.color === color)
    );
    saveCart(filteredItems);
  };

  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, fetchCart, addToCart, updateQuantity, removeItem, cartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export default CartContext;
