import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/wishlist').then(r => setWishlist(r.data.wishlist)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    try {
      await api.post(`/wishlist/${productId}`);
      setWishlist(prev => prev.filter(p => p.product_id !== productId));
    } catch {}
  };

  if (!user) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">Please login to view wishlist</p>
        <Link to="/login" className="text-[#1c1a17] font-semibold hover:text-[#C6A85B]">Sign In</Link></div>
    </div>
  );

  return (
    <div data-testid="wishlist-page" className="pt-20 lg:pt-24 min-h-screen bg-[#fbfaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight mb-8">Wishlist</h1>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="animate-pulse"><div className="aspect-[3/4] bg-gray-200" /></div>)}</div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-body">Your wishlist is empty</p>
            <Link to="/shop" className="inline-block mt-4 bg-[#1c1a17] text-white px-8 py-3 uppercase text-xs tracking-wider">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {wishlist.map(product => (
              <ProductCard key={product.product_id} product={product} onWishlist={toggleWishlist} isWishlisted={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
