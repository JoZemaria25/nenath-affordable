import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { formatPrice } from '@/lib/api';

export default function ProductCard({ product, onWishlist, isWishlisted }) {
  const effectivePrice = product.discount_price || product.price;
  const [hovering, setHovering] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(0);
  const intervalRef = useRef(null);
  const hasMultipleImages = product.images?.length > 1;
  const navigate = useNavigate();

  useEffect(() => {
    if (hovering && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setHoverIdx(prev => (prev + 1) % product.images.length);
      }, 1500);
      return () => clearInterval(intervalRef.current);
    } else {
      setHoverIdx(0);
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovering, hasMultipleImages, product.images?.length]);

  return (
    <div 
      className="group flex flex-col gap-4 text-left w-full h-full justify-between"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link to={`/product/${product.product_id}`} data-testid={`product-card-${product.product_id}`} className="relative overflow-hidden aspect-[3/4] bg-[#fbfaf8] block">
        {/* Image slideshow on hover */}
        {product.images?.map((img, idx) => (
          <img
            key={idx}
            src={img} alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
              idx === (hovering && hasMultipleImages ? hoverIdx : 0) ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        ))}

        {/* Badges - Refined */}
        {product.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-black text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist */}
        {onWishlist && (
          <button
            data-testid={`wishlist-btn-${product.product_id}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlist(product.product_id); }}
            className="absolute top-4 right-4 p-2 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 z-10"
          >
            <Heart size={16} className={isWishlisted ? 'fill-black text-black' : 'text-gray-600'} />
          </button>
        )}

        {/* Quick Add overlay */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
          <button 
            className="w-full bg-white/95 text-black font-semibold text-xs tracking-widest uppercase py-3 shadow-md hover:bg-black hover:text-white transition-colors"
            onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               navigate(`/product/${product.product_id}`);
            }}
          >
            Quick View
          </button>
        </div>
      </Link>
      
      <Link to={`/product/${product.product_id}`} className="space-y-1 mt-2">
        <h3 className="font-heading text-lg text-[#111] truncate group-hover:text-gray-600 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{formatPrice(effectivePrice)}</span>
          {product.discount_price && product.discount_price < product.price && (
            <span className="text-gray-400 text-sm line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
