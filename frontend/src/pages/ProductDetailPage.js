import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Minus, Plus, ShieldCheck, Truck, RotateCcw, ChevronRight, Share2, Copy, Check, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ProductCard from '@/components/ProductCard';
import ProductShowcase from '@/components/ProductShowcase';
import api, { formatPrice } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${productId}`)
      .then(r => {
        setProduct(r.data.product);
        setRelated(r.data.related || []);
        setActiveImage(0);
        setSelectedSize(r.data.product.sizes?.[0] || '');
        setSelectedColor(r.data.product.colors?.[0] || '');
        setQuantity(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (user && product) {
      api.get('/wishlist').then(r => {
        setIsWishlisted(r.data.wishlist.some(p => p.product_id === product.product_id));
      }).catch(() => {});
    }
  }, [user, product]);

  useEffect(() => {
    if (productId) {
      api.get(`/products/${productId}/reviews`).then(r => {
        setReviews(r.data.reviews);
        setAvgRating(r.data.average_rating);
      }).catch(() => {});
    }
  }, [productId]);

  const handleSubmitReview = async () => {
    if (!user) { toast.error("Please login to leave a review"); return; }
    if (!reviewText.trim()) { toast.error("Please write a comment"); return; }
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, { rating: reviewRating, comment: reviewText });
      setReviews(prev => [data.review, ...prev]);
      setReviewText('');
      setReviewRating(5);
      toast.success("Review posted!");
      // Refresh average
      api.get(`/products/${productId}/reviews`).then(r => setAvgRating(r.data.average_rating)).catch(() => {});
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to post review");
    } finally { setSubmittingReview(false); }
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error("Please login to add items to cart"); return; }
    try {
      await addToCart(product.product_id, quantity, selectedSize, selectedColor);
      toast.success("Added to bag!");
    } catch { toast.error("Failed to add to cart"); }
  };

  const toggleWishlist = async () => {
    if (!user) { toast.error("Please login to save items"); return; }
    try {
      const { data } = await api.post(`/wishlist/${product.product_id}`);
      setIsWishlisted(data.action === 'added');
      toast.success(data.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {}
  };

  if (loading) return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[3/4] bg-gray-200" />
          <div className="space-y-4"><div className="h-8 bg-gray-200 w-3/4" /><div className="h-6 bg-gray-200 w-1/4" /><div className="h-32 bg-gray-200" /></div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Product not found</p>
    </div>
  );

  const effectivePrice = product.discount_price || product.price;

  return (
    <div data-testid="product-detail-page" className="pt-20 lg:pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-body">
          <Link to="/" className="hover:text-[#1c1a17]">Home</Link><ChevronRight size={12} />
          <Link to="/shop" className="hover:text-[#1c1a17]">Shop</Link><ChevronRight size={12} />
          <span className="text-[#1c1a17] truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-[#F5F1EB] overflow-hidden">
              {product.images?.[activeImage] && (
                <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              )}
            </div>
            {/* Cinematic Product Showcase - auto-playing image slideshow + video */}
            {product.images?.length > 1 && (
              <ProductShowcase
                images={product.images}
                videoUrl={product.video_url || ''}
                productName={product.name}
              />
            )}
            {/* Single video if only 1 image but has video */}
            {product.images?.length <= 1 && product.video_url && (
              <ProductShowcase
                images={product.images || []}
                videoUrl={product.video_url}
                productName={product.name}
              />
            )}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-20 h-24 flex-shrink-0 overflow-hidden border-2 ${i === activeImage ? 'border-[#1c1a17]' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-6">
            {product.badge && (
              <span className={`inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 ${
                product.badge === 'new' ? 'bg-[#1c1a17] text-white' :
                product.badge === 'hot' ? 'bg-[#991B1B] text-white' :
                'bg-[#C6A85B] text-white'
              }`}>{product.badge}</span>
            )}
            <h1 data-testid="product-name" className="text-3xl sm:text-4xl font-heading font-light tracking-tight">{product.name}</h1>

            <div className="flex items-center gap-3">
              <span data-testid="product-price" className="text-2xl font-heading font-semibold">{formatPrice(effectivePrice)}</span>
              {product.discount_price && product.discount_price < product.price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>

            <p className="text-sm text-gray-600 font-body leading-relaxed">{product.description}</p>

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="label-uppercase text-gray-500 mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button key={size} data-testid={`size-option-${size}`} onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-11 px-4 text-sm border transition-all ${selectedSize === size ? 'bg-[#1c1a17] text-white border-[#1c1a17]' : 'border-gray-200 hover:border-[#1c1a17]'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color */}
            {product.colors?.length > 0 && (
              <div>
                <p className="label-uppercase text-gray-500 mb-3">Color</p>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger data-testid="color-select" className="w-full border-gray-200"><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>{product.colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="label-uppercase text-gray-500 mb-3">Quantity</p>
              <div className="inline-flex items-center border border-gray-200">
                <button data-testid="decrease-qty" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-50"><Minus size={14} /></button>
                <span className="px-6 text-sm font-medium">{quantity}</span>
                <button data-testid="increase-qty" onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50"><Plus size={14} /></button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button data-testid="add-to-cart-button" onClick={handleAddToCart}
                className="flex-1 bg-[#1c1a17] text-white hover:bg-black/80 py-6 uppercase text-xs tracking-[0.15em]">
                Add to Bag
              </Button>
              <Button data-testid="wishlist-toggle" variant="outline" onClick={toggleWishlist}
                className={`px-4 py-6 border-gray-200 ${isWishlisted ? 'text-red-500' : ''}`}>
                <Heart size={20} className={isWishlisted ? 'fill-red-500' : ''} />
              </Button>
            </div>

            {/* Share Section */}
            <div className="flex items-center gap-3 pt-2">
              <a
                data-testid="share-whatsapp-btn"
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on NENATH AFFORDABLES!\n${formatPrice(product.discount_price || product.price)}\n${window.location.href}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-xs uppercase tracking-wider hover:bg-[#20bd5a] transition-colors"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </a>
              <button
                data-testid="copy-link-btn"
                onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                data-testid="share-native-btn"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, text: `${product.name} - ${formatPrice(product.discount_price || product.price)} on NENATH AFFORDABLES`, url: window.location.href });
                  } else { toast.info('Use the copy link button to share'); }
                }}
                className="p-2.5 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Share2 size={14} />
              </button>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center"><ShieldCheck size={20} className="mx-auto text-[#C6A85B] mb-1" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Authentic</span></div>
              <div className="text-center"><Truck size={20} className="mx-auto text-[#C6A85B] mb-1" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Fast Delivery</span></div>
              <div className="text-center"><RotateCcw size={20} className="mx-auto text-[#C6A85B] mb-1" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">48hr Exchange</span></div>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="pt-4">
                <h3 className="label-uppercase text-gray-500 mb-3">Features</h3>
                <ul className="space-y-2">
                  {product.features.map((f, i) => <li key={i} className="text-sm text-gray-600 font-body flex items-start gap-2"><span className="w-1.5 h-1.5 bg-[#C6A85B] rounded-full mt-1.5 flex-shrink-0" />{f}</li>)}
                </ul>
              </div>
            )}

            {/* Product Rules */}
            {product.rules && (
              <div className="bg-[#F5F1EB] p-6">
                <h3 className="label-uppercase text-gray-700 mb-3">Product Policy</h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed whitespace-pre-line">{product.rules}</p>
              </div>
            )}

            {/* Care Instructions */}
            {product.care_instructions && (
              <div className="pt-4">
                <h3 className="label-uppercase text-gray-500 mb-3">Care Instructions</h3>
                <p className="text-sm text-gray-600 font-body leading-relaxed whitespace-pre-line">{product.care_instructions}</p>
              </div>
            )}

            {/* Trust text */}
            <div className="text-center py-4 border-t border-gray-100">
              <p className="text-sm font-accent italic text-gray-500">"Quality you can trust. Style you deserve."</p>
              {product.promotional_text && <p className="text-xs text-[#991B1B] font-semibold mt-1">{product.promotional_text}</p>}
            </div>
          </div>
        </div>

        {/* Reviews / Comments Section */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-light tracking-tight flex items-center gap-3">
                Customer Reviews
                {reviews.length > 0 && (
                  <span className="flex items-center gap-1 text-lg">
                    <Star size={18} className="fill-[#C6A85B] text-[#C6A85B]" />
                    <span className="font-body text-base">{avgRating}/5</span>
                    <span className="text-sm text-gray-400 font-body">({reviews.length})</span>
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Write a review */}
          {user ? (
            <div data-testid="review-form" className="bg-[#F5F1EB] p-6 mb-8">
              <h3 className="label-uppercase text-gray-700 mb-4">Write a Review</h3>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs text-gray-500 mr-2 uppercase tracking-wider">Rating:</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} data-testid={`rating-star-${star}`} onClick={() => setReviewRating(star)} className="p-0.5">
                    <Star size={20} className={star <= reviewRating ? 'fill-[#C6A85B] text-[#C6A85B]' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <Textarea
                data-testid="review-comment-input"
                value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="border-gray-200 mb-3 bg-white min-h-[80px]"
              />
              <Button data-testid="submit-review-btn" onClick={handleSubmitReview} disabled={submittingReview}
                className="bg-[#1c1a17] text-white hover:bg-black/80 uppercase text-xs tracking-[0.15em] px-6 py-3">
                {submittingReview ? 'Posting...' : 'Post Review'}
              </Button>
            </div>
          ) : (
            <div className="bg-[#F5F1EB] p-6 mb-8 text-center">
              <p className="text-sm text-gray-600 font-body"><Link to="/login" className="text-[#1c1a17] font-semibold hover:text-[#C6A85B]">Sign in</Link> to leave a review</p>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-body">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.review_id} data-testid={`review-${review.review_id}`} className="border-b border-gray-100 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1c1a17] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {review.user_name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{review.user_name}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={12} className={star <= review.rating ? 'fill-[#C6A85B] text-[#C6A85B]' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-body leading-relaxed ml-11">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 sm:mt-24 pt-12 border-t border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-heading font-light tracking-tight mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {related.map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
