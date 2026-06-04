import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  const categorySlug = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const badge = searchParams.get('badge') || '';

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    if (user) {
      api.get('/wishlist').then(r => setWishlist(r.data.wishlist.map(p => p.product_id))).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const cat = categories.find(c => c.slug === categorySlug);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat.category_id);
    if (sort) params.set('sort', sort);
    if (search) params.set('search', search);
    if (badge) params.set('badge', badge);
    params.set('page', page);
    params.set('limit', '12');

    api.get(`/products?${params.toString()}`)
      .then(r => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug, sort, search, badge, page, categories]);

  const toggleWishlist = async (productId) => {
    if (!user) return;
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data.wishlist);
    } catch {}
  };

  const updateSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    setSearchParams(params);
    setPage(1);
  };

  const activeCat = categories.find(c => c.slug === categorySlug);

  return (
    <div data-testid="catalog-page" className="pt-20 lg:pt-24 min-h-screen">
      {/* Header */}
      <div className="bg-[#F5F1EB] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-body">
            <Link to="/" className="hover:text-[#1c1a17]">Home</Link>
            <span>/</span>
            <span className="text-[#1c1a17]">{activeCat ? activeCat.name : search ? `Search: "${search}"` : 'Shop All'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight font-heading">
            {activeCat ? activeCat.name : search ? `Results for "${search}"` : badge ? `${badge.charAt(0).toUpperCase() + badge.slice(1)} Items` : 'Shop All'}
          </h1>
          <p className="text-sm text-gray-600 mt-2 font-body">{total} products</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <h3 className="label-uppercase text-gray-400 mb-4">Categories</h3>
            <div className="space-y-2">
              <button onClick={() => { setSearchParams({}); setPage(1); }}
                className={`block w-full text-left text-sm py-2 transition-colors ${!categorySlug ? 'font-semibold text-[#1c1a17]' : 'text-gray-500 hover:text-[#1c1a17]'}`}>
                All Products
              </button>
              {categories.map(cat => (
                <button key={cat.category_id} onClick={() => { const p = new URLSearchParams(searchParams); p.set('category', cat.slug); setSearchParams(p); setPage(1); }}
                  className={`block w-full text-left text-sm py-2 transition-colors ${categorySlug === cat.slug ? 'font-semibold text-[#1c1a17]' : 'text-gray-500 hover:text-[#1c1a17]'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <button data-testid="filters-toggle" className="lg:hidden flex items-center gap-2 text-sm font-medium" onClick={() => setFiltersOpen(!filtersOpen)}>
                <SlidersHorizontal size={16} /> Filters
              </button>
              <div className="flex items-center gap-4 ml-auto">
                <Select value={sort} onValueChange={updateSort}>
                  <SelectTrigger data-testid="sort-select" className="w-40 text-sm border-gray-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile filters */}
            {filtersOpen && (
              <div className="lg:hidden mb-6 p-4 bg-[#F5F1EB] animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="label-uppercase text-gray-500">Categories</h3>
                  <button onClick={() => setFiltersOpen(false)}><X size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setSearchParams({}); setFiltersOpen(false); }}
                    className={`px-3 py-1.5 text-xs border ${!categorySlug ? 'bg-[#1c1a17] text-white border-[#1c1a17]' : 'border-gray-300 hover:border-[#1c1a17]'}`}>All</button>
                  {categories.map(cat => (
                    <button key={cat.category_id} onClick={() => { const p = new URLSearchParams(); p.set('category', cat.slug); setSearchParams(p); setFiltersOpen(false); }}
                      className={`px-3 py-1.5 text-xs border ${categorySlug === cat.slug ? 'bg-[#1c1a17] text-white border-[#1c1a17]' : 'border-gray-300 hover:border-[#1c1a17]'}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-200 mb-3" />
                    <div className="h-4 bg-gray-200 w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 font-body">No products found</p>
                <Link to="/shop"><Button className="mt-4 bg-[#1c1a17] text-white uppercase text-xs tracking-wider px-8 py-3">View All Products</Button></Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {products.map(product => (
                    <ProductCard key={product.product_id} product={product} onWishlist={user ? toggleWishlist : null} isWishlisted={wishlist.includes(product.product_id)} />
                  ))}
                </div>
                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {[...Array(pages)].map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 text-sm border ${page === i + 1 ? 'bg-[#1c1a17] text-white border-[#1c1a17]' : 'border-gray-200 hover:border-[#1c1a17]'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
