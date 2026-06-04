import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const HERO_IMAGE = "https://images.unsplash.com/photo-1758900727792-e411697fc0a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZWRpdG9yaWFsJTIwd29tZW4lMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories)).catch(() => {});
    api.get('/products?sort=popular&limit=8').then(r => setTrendingProducts(r.data.products)).catch(() => {});
    api.get('/products?sort=newest&limit=4').then(r => setNewProducts(r.data.products)).catch(() => {});
    if (user) {
      api.get('/wishlist').then(r => setWishlist(r.data.wishlist.map(p => p.product_id))).catch(() => {});
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) return;
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data.wishlist);
    } catch {}
  };

  return (
    <div data-testid="home-page" className="bg-[#fbfaf8] text-[#1c1a17] overflow-x-hidden font-mono text-xs">
      
      {/* Frame 1: Hero / The Hook (Tom Ford inspired Architectural Split layout) */}
      <section className="min-h-screen grid grid-cols-1 lg:grid-cols-12 border-b border-[#1c1a17]">
        {/* Left Side: Massive, high-contrast warm visual frame */}
        <div className="lg:col-span-6 relative bg-[#1c1a17] overflow-hidden flex items-center justify-center min-h-[50vh] lg:min-h-screen">
          <img 
            src={HERO_IMAGE} 
            alt="NENATH EDITORIAL" 
            className="w-full h-full object-cover filter sepia-[5%] contrast-[1.01] brightness-[1.0] transition-transform duration-[20000ms] hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a17]/90 via-[#1c1a17]/10 to-transparent" />
          
          <div className="absolute bottom-12 left-12 text-left space-y-2">
            <span className="text-[9px] font-mono tracking-[0.3em] text-white/50 uppercase">[ IDENTITY LAYER ]</span>
            <h2 className="text-white text-3xl font-light tracking-[0.15em] font-heading uppercase leading-none">NENNATH KINDY</h2>
          </div>
        </div>

        {/* Right Side: Centered typography and hook statement */}
        <div className="lg:col-span-6 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-24 py-20 bg-[#f5f1eb] space-y-12 text-left relative">
          <div className="space-y-4">
            <p className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 uppercase">[ CULTURAL ARCHITECTURE // 2026 ]</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[0.1em] font-heading uppercase text-[#1c1a17] leading-[1.05]">
              The Disruption <br /> of Form
            </h1>
            <p className="text-[9px] font-mono tracking-[0.2em] text-[#1c1a17]/30 uppercase">
              [ STAGE 01 // OVERRIDING TRADITIONAL MEDIA ]
            </p>
          </div>

          <div className="space-y-6 max-w-lg">
            <p className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 uppercase">[ THE HOOK ]</p>
            <div className="space-y-4 font-heading text-lg sm:text-xl font-light leading-relaxed text-[#1c1a17]/90">
              <p>Most brands believe they lack visibility.</p>
              <p className="font-semibold underline underline-offset-8 decoration-1 decoration-[#1c1a17]/40">In reality? They lack structural gravity.</p>
            </div>
            <div className="space-y-4 font-body text-xs sm:text-sm text-[#1c1a17]/60 font-light leading-relaxed pt-4">
              <p>
                When your presentation is fragile, your premium pricing feels unearned. Traditional production is an endless series of slow compromises. You are waiting for shoots, waiting for revisions, waiting for agencies.
              </p>
              <p className="font-semibold text-[#1c1a17]">
                While you wait, the cultural window slams shut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frame 2: The Reconstruction (The Miyake Systemic Reframe) */}
      <section className="min-h-screen flex items-center justify-center bg-[#1c1a17] text-[#f5f1eb] border-b border-[#1c1a17] px-4 sm:px-6 lg:px-8 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(244,244,244,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center relative z-10">
          {/* Left Column: Reconstruction Statement */}
          <div className="lg:col-span-6 space-y-10 text-left">
            <p className="text-[9px] font-mono tracking-[0.25em] text-[#f5f1eb]/50 uppercase">[ THE RECONSTRUCTION // MIYAKE REFRACT ]</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[0.1em] font-heading uppercase text-white leading-[1.1]">
              We do not build generic design tools. <br />
              We build creative leverage systems.
            </h2>
            <div className="w-16 h-[1px] bg-[#f5f1eb]/30" />
            <p className="font-body text-xs sm:text-sm text-[#f5f1eb]/70 font-light leading-relaxed max-w-lg">
              Nennath Kindy converts high-end visual identity into an automated, continuous asset layer. We have stripped away the noise of traditional media production and replaced it with weightless execution.
            </p>
            <p className="text-[10px] font-mono tracking-[0.2em] text-[#f5f1eb]/60 uppercase italic">
              * Presentation is no longer an occasional event. It is an infrastructure layer.
            </p>
          </div>

          {/* Right Column: Spaced Pleat Blocks Grid */}
          <div className="lg:col-span-6 space-y-8">
            <div className="grid grid-cols-1 gap-6 font-mono text-[9px] tracking-widest uppercase text-white">
              <div className="border border-[#f5f1eb]/20 p-8 bg-[#1c1a17] hover:border-white transition-all duration-500 space-y-3">
                <p className="font-bold text-xs text-white">[ 01 // ASYMMETRICAL DRAPING ]</p>
                <p className="lowercase text-[#f5f1eb]/60 leading-relaxed font-body text-xs">
                  Upload your high-concept references. Let structural algorithms align elements with asymmetrical flow.
                </p>
              </div>

              <div className="border border-[#f5f1eb]/20 p-8 bg-[#1c1a17] hover:border-white transition-all duration-500 space-y-3">
                <p className="font-bold text-xs text-white">[ 02 // SYSTEMIC PLEATING ]</p>
                <p className="lowercase text-[#f5f1eb]/60 leading-relaxed font-body text-xs">
                  Shape your brand geometry instantly. Automate complex layout folds and visual patterns under rules of mathematical weight.
                </p>
              </div>

              <div className="border border-[#f5f1eb]/20 p-8 bg-[#1c1a17] hover:border-white transition-all duration-500 space-y-3">
                <p className="font-bold text-xs text-white">[ 03 // FRICTIONLESS OUTPUT ]</p>
                <p className="lowercase text-[#f5f1eb]/60 leading-relaxed font-body text-xs">
                  Generate campaign-ready visual art at the speed of thought. Distribute assets to active endpoints in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frame 3: The Identity Pull (The High-Status Ultimatum) */}
      <section className="min-h-screen flex items-center justify-center border-b border-[#1c1a17] px-4 sm:px-6 lg:px-8 py-24 bg-[#fbfaf8]">
        <div className="max-w-[1000px] w-full mx-auto text-left space-y-12">
          <p className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 uppercase">[ THE IDENTITY PULL // ARCHITECTURAL LAWS ]</p>
          
          <div className="space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light font-heading tracking-[0.05em] text-[#1c1a17] leading-relaxed">
              "The next generation of luxury operators will not win by spending more on traditional production."
            </h2>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-heading tracking-[0.05em] text-[#1c1a17] leading-relaxed">
              "They will win because their systems move faster than culture."
            </h2>
          </div>

          <div className="w-24 h-[1px] bg-[#1c1a17]/30" />

          <div className="max-w-xl font-body text-xs sm:text-sm text-[#1c1a17]/70 font-light leading-relaxed space-y-4">
            <p>
              If your visual identity cannot scale without burning out your team, you don't have a luxury brand.
            </p>
            <p className="font-bold text-[#1c1a17] uppercase font-mono text-xs tracking-wider">
              [ You have an expensive bottleneck. ]
            </p>
          </div>
        </div>
      </section>

      {/* Frame 4: The NEPQ Victory Call (The Conversion Slat) */}
      <section className="min-h-screen flex items-center justify-center border-b border-[#1c1a17] px-4 sm:px-6 lg:px-8 py-24 bg-[#f5f1eb]">
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          {/* Left Column: Antigravity stream visual placeholder */}
          <div className="lg:col-span-6 relative aspect-[4/3] bg-[#1c1a17] border border-[#1c1a17] overflow-hidden flex items-center justify-center shadow-lg">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Animated floating line wireframe */}
            <div className="absolute top-1/4 left-1/4 right-1/4 h-[1px] bg-white/10 animate-pulse" />
            <div className="absolute top-2/4 left-1/4 right-1/4 h-[1px] bg-white/20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-3/4 left-1/4 right-1/4 h-[1px] bg-white/15 animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="z-10 text-center font-mono text-[9px] tracking-widest text-[#f5f1eb]/50 uppercase">
              [ STAGE_RECONSTRUCTION_DRAFT // N.01 ]
            </div>
          </div>

          {/* Right Column: Pulled-Right Transaction Box */}
          <div className="lg:col-span-6 flex justify-end">
            <div className="bg-[#1c1a17] text-[#f5f1eb] p-12 border border-[#1c1a17] space-y-8 text-left shadow-2xl relative w-full max-w-[500px]">
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-[#f5f1eb]/30 uppercase tracking-widest">
                SYSTEM_ACCESS_LICENSE
              </div>
              
              <p className="text-[9px] font-mono tracking-[0.25em] text-[#f5f1eb]/50 uppercase">[ CLIMAX // CONVERSION ]</p>
              
              <h3 className="text-2xl sm:text-3xl font-light font-heading tracking-wide uppercase leading-tight">
                Look closely at your current digital storefront.
              </h3>
              
              <div className="space-y-4 text-xs font-body font-light text-[#f5f1eb]/70 leading-relaxed border-l border-[#f5f1eb]/20 pl-4">
                <p>Is it an asset that builds authority...</p>
                <p className="font-semibold text-white">or a liability you are constantly maintaining?</p>
              </div>

              <Link to="/shop" className="block pt-6">
                <button 
                  data-testid="shop-now-btn"
                  className="w-full bg-[#f5f1eb] text-[#1c1a17] font-mono text-xs tracking-[0.2em] font-bold py-5 uppercase border border-[#f5f1eb] hover:bg-[#1c1a17] hover:text-[#f5f1eb] transition-all duration-300"
                >
                  [ SECURE THE INFRASTRUCTURE ]
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frame 5: Active Catalogues (Tom Ford inspired Architectural Grid layout) */}
      <section className="py-36 bg-[#fbfaf8] border-b border-[#1c1a17] relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-20">
            <div className="text-left space-y-2">
              <span className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 block uppercase">[ SHOP BY ARCHITECTURE // THE CATALOGS ]</span>
              <h2 className="text-4xl font-light font-heading tracking-[0.1em] text-[#1c1a17] uppercase">
                The Active Catalogues
              </h2>
            </div>
            <Link to="/shop" className="mt-4 sm:mt-0 font-mono text-[9px] tracking-widest text-[#1c1a17] hover:underline uppercase">
              [ ACCESS FULL ARCHIVES ]
            </Link>
          </div>

          {/* Symmetrical, thin border architectural grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-[#1c1a17]">
            {categories.slice(0, 4).map((cat) => (
              <Link 
                key={cat.category_id} 
                to={`/shop?category=${cat.slug}`} 
                data-testid={`category-card-${cat.slug}`}
                className="group relative overflow-hidden aspect-[3/4] bg-[#1c1a17] border-r border-b border-[#1c1a17] flex flex-col justify-end transition-all duration-500"
              >
                {cat.image ? (
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-102 filter sepia-[5%] group-hover:sepia-0 contrast-[1.01] brightness-[1.01] opacity-100" 
                    loading="lazy" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#1c1a17] flex items-center justify-center">
                    <span className="font-mono text-[9px] text-[#f5f1eb]">[ NO IMAGE ]</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#1c1a17] to-transparent text-left">
                  <h3 className="text-white text-base font-heading font-light tracking-wide uppercase leading-none">{cat.name}</h3>
                  <span className="text-white/60 font-mono text-[8px] tracking-[0.15em] mt-2 inline-flex items-center gap-1 group-hover:underline">
                    Access_Category →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Frame 6: Trending Products (Architectural Grid layout) */}
      {trendingProducts.length > 0 && (
        <section className="py-36 bg-[#fbfaf8] border-b border-[#1c1a17] relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-20">
              <div className="text-left space-y-2">
                <span className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 block uppercase">[ INTEGRITY METRIC // MOST COVETED ]</span>
                <h2 className="text-4xl font-light font-heading tracking-[0.1em] text-[#1c1a17] uppercase">
                  Trending Formations
                </h2>
              </div>
              <Link to="/shop?sort=popular" className="mt-4 sm:mt-0 font-mono text-[9px] tracking-widest text-[#1c1a17] hover:underline uppercase">
                [ EXPLORE POPULARITY MATRIX ]
              </Link>
            </div>
            
            {/* Symmetrical grid with thin black borders */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-[#1c1a17]">
              {trendingProducts.slice(0, 8).map(product => (
                <div key={product.product_id} className="p-6 bg-[#f5f1eb] border-r border-b border-[#1c1a17] flex flex-col justify-between transition-all duration-300 hover:bg-[#1c1a17] hover:text-[#f5f1eb] group">
                  <ProductCard 
                    product={product} 
                    onWishlist={user ? toggleWishlist : null} 
                    isWishlisted={wishlist.includes(product.product_id)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Frame 7: Technical specification and visual art alignment */}
      <section className="py-36 bg-[#1c1a17] text-[#f5f1eb] relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            {/* Visual Frame */}
            <div className="md:col-span-7 relative overflow-hidden aspect-[4/5] bg-[#1c1a17] border border-[#f5f1eb]/20 p-4 shadow-2xl">
              <div className="absolute inset-0 m-4 border border-[#f5f1eb]/10 overflow-hidden relative">
                <img 
                  src={HERO_IMAGE} 
                  alt="NENATH EDITORIAL" 
                  className="w-full h-full object-cover filter sepia-[6%] opacity-100 transition-transform duration-[15000ms] hover:scale-105" 
                  loading="lazy" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a17] via-transparent to-transparent" />
              </div>
            </div>

            {/* Description Text */}
            <div className="md:col-span-5 flex flex-col justify-center text-left md:p-4 space-y-8">
              <span className="text-[9px] font-mono tracking-[0.25em] text-[#f5f1eb]/60 uppercase">[ TECHNICAL SPECIFICATIONS ]</span>
              <h2 className="text-4xl font-light font-heading tracking-[0.1em] uppercase text-white leading-tight">
                Redefining Creative Infrastructure
              </h2>
              <div className="w-12 h-[1px] bg-[#f5f1eb]/45" />
              <p className="font-body text-xs sm:text-sm text-[#f5f1eb]/70 font-light leading-relaxed">
                Every NENATH garment represents the intersection of luxury craftsmanship and structural gravity. We build physical artifacts with champagne-gold satins, structured brocades, and weightless, asymmetrical tailoring.
              </p>
              <p className="font-body text-xs sm:text-sm text-[#f5f1eb]/70 font-light leading-relaxed">
                Designed for speed and durability, allowing high-end brand assets to scale automatically without compromising structural identity.
              </p>
              <Link to="/shop" className="pt-4">
                <button className="bg-[#f5f1eb] text-[#1c1a17] font-mono text-[10px] tracking-[0.2em] font-bold px-8 py-4 uppercase border border-[#f5f1eb] hover:bg-[#1c1a17] hover:text-[#f5f1eb] transition-all duration-300">
                  [ DEPLOY VISUAL ASSETS ]
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frame 8: New Additions (Architectural Grid layout) */}
      {newProducts.length > 0 && (
        <section className="py-36 bg-[#fbfaf8] border-t border-[#1c1a17]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <span className="text-[9px] font-mono tracking-[0.25em] text-[#1c1a17]/50 block uppercase">[ RECENT FORMATIONS ]</span>
              <h2 className="text-4xl font-light font-heading tracking-[0.1em] text-[#1c1a17] uppercase">
                New Additions
              </h2>
            </div>
            
            {/* Symmetrical grid with thin black borders */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-[#1c1a17]">
              {newProducts.map(product => (
                <div key={product.product_id} className="p-4 bg-[#f5f1eb] border-r border-b border-[#1c1a17] flex flex-col justify-between transition-all duration-300 hover:bg-[#1c1a17] hover:text-[#f5f1eb] group">
                  <ProductCard 
                    product={product} 
                    onWishlist={user ? toggleWishlist : null} 
                    isWishlisted={wishlist.includes(product.product_id)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Frame 9: Trust & Identity Banner (Pristine spaced lookup) */}
      <section className="bg-[#1c1a17] text-[#f5f1eb] py-36 relative overflow-hidden text-center border-t border-[#f5f1eb]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[#f5f1eb]/60 block uppercase">[ NENNATH KINDY INTEGRATION ]</span>
          <h2 className="text-4xl sm:text-5xl font-heading font-light text-white tracking-[0.1em] uppercase leading-tight">
            Style Without Limits. <br />
            Execution Without Friction.
          </h2>
          <p className="text-gray-400 font-body text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-light">
            All formations are limited in quantity to maintain strict architectural rarity. Deploy your visual identity layer instantly.
          </p>
          <Link to="/shop" className="block pt-6">
            <button className="bg-[#f5f1eb] text-[#1c1a17] font-mono text-[10px] tracking-[0.2em] font-bold px-12 py-5 uppercase border border-[#f5f1eb] hover:bg-[#1c1a17] hover:text-[#f5f1eb] transition-all duration-300">
              [ INITIALIZE ACCESS ]
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
}
