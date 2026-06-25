import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag, Heart, User, Search, Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import CartSheet from '@/components/CartSheet';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_dac108e2-e034-49b0-b9b6-92469beae062/artifacts/p34dttcq_nenathaff.JPG";

const categories = [
  { name: "Ready-to-Wear Traditional", slug: "ready-to-wear-traditional" },
  { name: "Bags", slug: "bags" },
  { name: "Shoes", slug: "shoes" },
  { name: "Suits", slug: "suits" },
  { name: "Underwear", slug: "underwear" },
  { name: "Clothing", slug: "clothing" },
  { name: "Accessories", slug: "accessories" },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, cartOpen, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav data-testid="main-navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#fbfaf8]/95 border-b border-[#1c1a17]' : 'bg-[#fbfaf8]'}`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          {/* Row 1: The YSL inspired typographic logo header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1c1a17] pb-3 mb-3">
            {/* Left Aligned */}
            <div className="flex flex-col text-left">
              <Link to="/" data-testid="navbar-logo" className="text-[#1c1a17] font-light text-2xl lg:text-3xl tracking-[0.2em] font-heading uppercase hover:opacity-80 transition-opacity">
                NENATH AFFORDABLES
              </Link>
              <span className="text-[10px] font-mono tracking-widest text-[#1c1a17] uppercase mt-1">
                [ Vol. 01 — Systemic Identity Layer ]
              </span>
            </div>

            {/* Right Aligned (Meta Labels) */}
            <div className="hidden md:flex flex-col text-right font-mono text-[10px] tracking-widest text-[#1c1a17] uppercase">
              <span>[ 2026 // EDITION ]</span>
              <span className="mt-1">[ ARCHITECTURE: Y.Y / I.M / YSL ]</span>
            </div>
          </div>

          {/* Row 2: Navigation Links & Actions */}
          <div className="flex items-center justify-between h-10">
            {/* Navigation menu */}
            <div className="hidden lg:flex items-center gap-8 font-mono text-[10px] tracking-widest uppercase">
              <Link to="/shop" className="text-[#1c1a17] hover:underline transition-all">Shop All</Link>
              {categories.slice(0, 5).map(cat => (
                <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="text-[#1c1a17] hover:underline transition-all">{cat.name}</Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button data-testid="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-[#1c1a17]">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-4 text-[#1c1a17] font-mono text-[10px] tracking-widest uppercase">
              <button data-testid="search-btn" onClick={() => setSearchOpen(!searchOpen)} className="p-1 hover:opacity-75 transition-opacity">
                <Search size={18} />
              </button>

              {user && (
                <Link to="/wishlist" data-testid="wishlist-link" className="p-1 hover:opacity-75 transition-opacity hidden sm:block">
                  <Heart size={18} />
                </Link>
              )}

              <button data-testid="cart-btn" onClick={() => setCartOpen(true)} className="p-1 hover:opacity-75 transition-opacity relative flex items-center gap-1.5">
                <ShoppingBag size={18} />
                <span>Cart ({cartCount})</span>
              </button>

              {isAdmin && (
                <Link to="/admin" data-testid="admin-dashboard-btn" className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#1c1a17] text-[#fbfaf8] hover:bg-[#1c1a17]/80 transition-colors">
                  Admin
                </Link>
              )}

              {user ? (
                <div className="relative">
                  <button data-testid="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-1 hover:opacity-75 transition-opacity flex items-center gap-1">
                    <User size={18} />
                    <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#f5f1eb] border border-[#1c1a17] py-2 z-50 animate-fade-in font-mono text-[10px] tracking-widest">
                      <div className="px-4 py-2 border-b border-[#1c1a17]/10">
                        <p className="font-semibold truncate uppercase">{user.name}</p>
                      </div>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-[#1c1a17] hover:text-[#fbfaf8] transition-colors">My Orders</Link>
                      <Link to="/wishlist" className="block px-4 py-2 hover:bg-[#1c1a17] hover:text-[#fbfaf8] transition-colors">Wishlist</Link>
                      {isAdmin && (
                        <Link to="/admin" data-testid="admin-link" className="block px-4 py-2 hover:bg-[#1c1a17] hover:text-[#fbfaf8] transition-colors">
                          Admin Dashboard
                        </Link>
                      )}
                      <button data-testid="logout-btn" onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition-colors text-red-600">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" data-testid="login-link" className="p-1 hover:opacity-75 transition-opacity">
                  <User size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-b border-[#1c1a17] bg-[#fbfaf8] animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-4">
                <Search size={18} className="text-[#1c1a17]" />
                <input
                  data-testid="search-input"
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." autoFocus
                  className="flex-1 bg-transparent text-sm font-mono tracking-widest uppercase outline-none placeholder:text-[#1c1a17]/40 text-[#1c1a17]"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-1 text-[#1c1a17]"><X size={18} /></button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#f5f1eb] border-r border-[#1c1a17] shadow-xl animate-slide-in-right overflow-y-auto">
            <div className="p-6 pt-24 font-mono text-[10px] tracking-widest uppercase flex flex-col gap-4">
              <p className="text-[#1c1a17]/60 mb-2">[ CATEGORIES ]</p>
              {categories.map(cat => (
                <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="block py-2 border-b border-[#1c1a17]/10 text-[#1c1a17] hover:underline" onClick={() => setMobileOpen(false)}>{cat.name}</Link>
              ))}
              <Link to="/shop" className="block py-2 border-b border-[#1c1a17]/10 text-[#1c1a17] hover:underline" onClick={() => setMobileOpen(false)}>Shop All</Link>
              <Link to="/contact" className="block py-2 border-b border-[#1c1a17]/10 text-[#1c1a17] hover:underline" onClick={() => setMobileOpen(false)}>Contact</Link>
              {user && <Link to="/wishlist" className="block py-2 border-b border-[#1c1a17]/10 text-[#1c1a17] hover:underline" onClick={() => setMobileOpen(false)}>Wishlist</Link>}
              {!user && <Link to="/login" className="block py-2 text-[#1c1a17] hover:underline" onClick={() => setMobileOpen(false)}>Sign In</Link>}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />

      {/* Click outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
