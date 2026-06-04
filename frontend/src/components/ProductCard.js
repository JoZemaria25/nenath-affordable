import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import { formatPrice } from '@/lib/api';

const BADGE_STYLES = {
  new: "bg-[#1c1a17] text-[#f5f1eb] border border-[#1c1a17]",
  hot: "bg-[#1c1a17] text-white",
  limited: "bg-[#f5f1eb] text-[#1c1a17] border border-[#1c1a17]",
};

export default function ProductCard({ product, onWishlist, isWishlisted }) {
  const effectivePrice = product.discount_price || product.price;
  const [hovering, setHovering] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(0);
  const intervalRef = useRef(null);
  const hasMultipleImages = product.images?.length > 1;

  useEffect(() => {
    if (hovering && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setHoverIdx(prev => (prev + 1) % product.images.length);
      }, 1200);
      return () => clearInterval(intervalRef.current);
    } else {
      setHoverIdx(0);
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovering, hasMultipleImages, product.images?.length]);

  return (
    <Link to={`/product/${product.product_id}`} data-testid={`product-card-${product.product_id}`}
      className="group cursor-pointer flex flex-col gap-3 text-left w-full h-full justify-between"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative overflow-hidden aspect-[3/4] bg-[#f5f1eb] border border-[#1c1a17]/10 group-hover:border-[#1c1a17] transition-colors duration-300">
        {/* Image slideshow on hover */}
        {product.images?.map((img, idx) => (
          <img
            key={idx}
            src={img} alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover filter sepia-[5%] group-hover:sepia-0 contrast-[1.01] brightness-[1.01] transition-all duration-750 ease-out ${
              idx === (hovering && hasMultipleImages ? hoverIdx : 0)
                ? 'opacity-100 scale-100 group-hover:scale-102'
                : 'opacity-0 scale-102'
            }`}
            loading="lazy"
          />
        ))}

        {/* Badges */}
        {product.badge && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 font-mono text-[8px] tracking-wider uppercase">
            <span className={`${BADGE_STYLES[product.badge] || BADGE_STYLES.new} px-2 py-0.5`}>
              [{product.badge}]
            </span>
          </div>
        )}

        {/* Multiple images indicator */}
        {hasMultipleImages && (
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black text-[#f5f1eb] text-[8px] font-mono px-1.5 py-0.5 flex items-center gap-1 border border-[#f5f1eb]/20">
              <Play size={6} /> {hoverIdx + 1}/{product.images.length}
            </div>
          </div>
        )}

        {/* Image dots indicator */}
        {hasMultipleImages && hovering && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {product.images.map((_, idx) => (
              <div key={idx} className={`h-0.5 transition-all duration-300 ${idx === hoverIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Wishlist */}
        {onWishlist && (
          <button
            data-testid={`wishlist-btn-${product.product_id}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlist(product.product_id); }}
            className="absolute top-4 right-4 p-2 bg-[#f5f1eb]/90 border border-[#1c1a17] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#1c1a17] hover:text-[#f5f1eb] z-10"
            style={{ top: hasMultipleImages ? '2.5rem' : '1rem' }}
          >
            <Heart size={12} className={isWishlisted ? 'fill-[#1c1a17] text-[#1c1a17] group-hover:fill-white group-hover:text-white' : ''} />
          </button>
        )}

        {/* Quick view overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1c1a17] text-[#f5f1eb] text-center py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-[#f5f1eb]/15">
          <span className="font-mono text-[9px] tracking-widest uppercase">Quick View</span>
        </div>
      </div>
      <div className="space-y-1 mt-1 font-mono text-[10px] tracking-widest uppercase">
        <h3 className="font-bold truncate text-[#1c1a17] group-hover:underline">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatPrice(effectivePrice)}</span>
          {product.discount_price && product.discount_price < product.price && (
            <span className="text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
