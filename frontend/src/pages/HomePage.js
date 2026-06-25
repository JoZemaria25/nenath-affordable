import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const HERO_IMAGE = "https://images.unsplash.com/photo-1758900727792-e411697fc0a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZWRpdG9yaWFsJTIwd29tZW4lMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85";
const STORY_IMAGE = "https://images.unsplash.com/photo-1630780565118-511258d74d08?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    api.get('/products?sort=popular&limit=4').then(r => setTrendingProducts(r.data.products)).catch(() => {});
    api.get('/products?sort=newest&limit=4').then(r => setNewProducts(r.data.products)).catch(() => {});
    if (user) {
      api.get('/wishlist').then(r => setWishlist(r.data.wishlist.map(p => p.product_id))).catch(() => {});
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data.wishlist);
    } catch {}
  };

  return (
    <div data-testid="home-page" className="bg-white text-[#111] overflow-x-hidden font-body">
      
      {/* 1. Hero Section: High Impact, Direct to Shop */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        <img 
          src={HERO_IMAGE} 
          alt="Nenath Affordables Luxury Collection" 
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] transition-transform duration-[20000ms] hover:scale-105"
          loading="eager"
        />
        <div className="relative z-10 text-center text-white px-4 flex flex-col items-center max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-heading font-normal mb-6 tracking-wide drop-shadow-lg">
            Elegance Redefined
          </h1>
          <p className="text-lg md:text-xl font-light mb-10 max-w-xl mx-auto drop-shadow-md">
            Discover the new standard of luxury. Uncompromising quality meets timeless design.
          </p>
          <Link to="/shop">
            <button className="bg-white text-black font-body font-semibold tracking-widest uppercase text-sm px-10 py-4 hover:bg-[#111] hover:text-white transition-all duration-300">
              Shop the Collection
            </button>
          </Link>
        </div>
      </section>

      {/* 2. Categories: The Walmart Funnel (Direct and Visual) */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading text-[#111]">The Collection</h2>
            <div className="w-16 h-[1px] bg-[#111] mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link 
                key={cat.category_id} 
                to={`/shop?category=${cat.slug}`} 
                className="group relative overflow-hidden aspect-[4/5] bg-gray-100 flex items-center justify-center"
              >
                {cat.image && (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.8] group-hover:scale-105 transition-transform duration-700 ease-out" 
                    loading="lazy" 
                  />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-white text-2xl font-heading font-medium tracking-wide mb-3 text-center px-4">{cat.name}</h3>
                  <span className="text-white/90 text-sm font-semibold uppercase tracking-widest border-b border-white/50 group-hover:border-white pb-1 transition-all">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bestsellers: High Conversion Grid */}
      {trendingProducts.length > 0 && (
        <section className="py-20 bg-[#fbfaf8]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading text-[#111]">Bestsellers</h2>
              </div>
              <Link to="/shop?sort=popular" className="text-sm font-semibold uppercase tracking-widest border-b border-[#111] pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors mt-4 sm:mt-0">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingProducts.map(product => (
                <ProductCard 
                  key={product.product_id}
                  product={product} 
                  onWishlist={toggleWishlist} 
                  isWishlisted={wishlist.includes(product.product_id)} 
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Visual Storytelling: Craftsmanship & Desire */}
      <section className="py-24 bg-[#111] text-white relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[3/4] lg:aspect-[4/5] overflow-hidden">
              <img 
                src={STORY_IMAGE} 
                alt="Craftsmanship" 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
            </div>
            <div className="flex flex-col justify-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-heading font-normal leading-tight">
                The Art of Tailoring
              </h2>
              <div className="w-12 h-[1px] bg-white/40"></div>
              <p className="text-lg text-gray-300 font-light leading-relaxed max-w-lg">
                Crafted for those who demand excellence. Every Nenath Affordables piece is a statement of uncompromising quality, blending traditional heritage with modern sophistication. We believe in clothing that empowers you to leave a lasting impression.
              </p>
              <div>
                <Link to="/about">
                  <span className="inline-block text-sm font-semibold uppercase tracking-widest border-b border-white pb-1 hover:text-gray-300 hover:border-gray-300 transition-colors cursor-pointer">
                    Discover Our Story
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals */}
      {newProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading text-[#111]">New Arrivals</h2>
              <div className="w-16 h-[1px] bg-[#111] mx-auto mt-6"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newProducts.map(product => (
                <ProductCard 
                  key={product.product_id}
                  product={product} 
                  onWishlist={toggleWishlist} 
                  isWishlisted={wishlist.includes(product.product_id)} 
                />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link to="/shop?sort=newest">
                <button className="bg-transparent border border-[#111] text-[#111] font-semibold tracking-widest uppercase text-sm px-10 py-4 hover:bg-[#111] hover:text-white transition-all duration-300">
                  Shop New Arrivals
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 6. Footer Call to Action */}
      <section className="bg-[#fbfaf8] py-32 text-center border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-heading font-normal mb-6 text-[#111]">
            Experience Nenath Affordables
          </h2>
          <p className="text-lg text-gray-600 mb-10 font-light">
            Luxury within reach. Style without limits. Join us today and elevate your wardrobe.
          </p>
          <Link to="/shop">
            <button className="bg-[#111] text-white font-semibold tracking-widest uppercase text-sm px-12 py-5 hover:bg-black transition-all duration-300">
              Enter the Boutique
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
}
