import { supabase } from './supabaseClient';

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
};

// Custom helper function to parse URL path parameters (e.g. /products/:productId)
const matchPath = (pattern, url) => {
  const keys = [];
  const regexPattern = pattern.replace(/:[^\s/]+/g, (match) => {
    keys.push(match.substring(1));
    return '([^\\s/]+)';
  });
  const match = url.match(new RegExp(`^${regexPattern}$`));
  if (!match) return null;
  const params = {};
  keys.forEach((key, index) => {
    params[key] = match[index + 1];
  });
  return params;
};

// Extract path name from URL (strip query parameters)
const getPathname = (url) => {
  if (!url) return '';
  return url.split('?')[0];
};

// Extract query parameters from URL and merge with config params
const parseParams = (url, config) => {
  const params = { ...(config?.params || {}) };
  if (url && url.includes('?')) {
    const search = url.split('?')[1];
    const searchParams = new URLSearchParams(search);
    for (const [key, val] of searchParams.entries()) {
      params[key] = val;
    }
  }
  return params;
};

const api = {
  get: async (url, config) => {
    const pathname = getPathname(url);
    const params = parseParams(url, config);
    
    // 1. GET /categories
    if (pathname === '/categories') {
      const { data: categories, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return { data: { categories } };
    }

    // 2. GET /products
    if (pathname === '/products') {
      let query = supabase.from('products').select('*', { count: 'exact' }).neq('status', 'deleted');
      if (params.category) {
        query = query.eq('category_id', params.category);
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params.badge) {
        query = query.eq('badge', params.badge);
      }
      
      if (params.sort === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (params.sort === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (params.sort === 'popular') {
        query = query.order('views', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const pageSize = params.limit ? parseInt(params.limit) : 20;
      const pageNum = params.page ? parseInt(params.page) : 1;
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: products, count, error } = await query;
      if (error) throw error;

      const total = count || 0;
      const pages = Math.ceil(total / pageSize);
      return { data: { products, total, pages } };
    }

    // 3. GET /products/:productId
    let match = matchPath('/products/:productId', pathname);
    if (match) {
      const { productId } = match;
      const { data: product, error } = await supabase.from('products').select('*').eq('product_id', productId).single();
      if (error) throw error;

      // Increment views (non-blocking)
      supabase.from('products').update({ views: (product.views || 0) + 1 }).eq('product_id', productId).then(() => {});

      // Related products (same category, different id)
      const { data: related } = await supabase.from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('product_id', productId)
        .limit(4);

      return { data: { product, related: related || [] } };
    }

    // 4. GET /products/:productId/reviews
    match = matchPath('/products/:productId/reviews', pathname);
    if (match) {
      const { productId } = match;
      const { data: reviews, error } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
      if (error) throw error;
      const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 5;
      return { data: { reviews, average_rating: Math.round(avgRating * 10) / 10 } };
    }

    // 5. GET /wishlist
    if (pathname === '/wishlist') {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return { data: { wishlist: [] } };
      
      const { data: profile, error: profError } = await supabase.from('profiles').select('wishlist').eq('user_id', user.id).single();
      if (profError) throw profError;
      
      const wishlistIds = profile?.wishlist || [];
      if (!wishlistIds.length) {
        return { data: { wishlist: [] } };
      }
      
      const { data: wishlist, error } = await supabase.from('products').select('*').in('product_id', wishlistIds);
      if (error) throw error;
      return { data: { wishlist } };
    }

    // 6. GET /orders
    if (pathname === '/orders') {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return { data: { orders: [] } };

      const { data: orders, error } = await supabase.from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data: { orders } };
    }

    // 7. GET /orders/:orderId
    match = matchPath('/orders/:orderId', pathname);
    if (match) {
      const { orderId } = match;
      const { data: order, error } = await supabase.from('orders').select('*').eq('order_id', orderId).single();
      if (error) throw error;
      return { data: { order } };
    }

    // 8. GET /settings
    if (pathname === '/settings') {
      const { data: settingsList, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settings = settingsList?.[0] || {
        bank_name: "",
        account_name: "",
        account_number: "",
        whatsapp_number: "2349133487799",
        contact_phone: "09133487799",
        ceo_name: "Nenzab David Bunshak",
        homepage_text: "Luxury Within Reach, Style Without Limits.",
        address: "Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria",
      };
      return { data: { settings } };
    }

    // 9. GET /admin/dashboard
    if (pathname === '/admin/dashboard') {
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { data: orders } = await supabase.from('orders').select('total');
      const revenue = orders ? orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) : 0;
      return { data: { products: productCount || 0, orders: orderCount || 0, revenue } };
    }

    // 10. GET /admin/orders
    if (pathname === '/admin/orders') {
      let query = supabase.from('orders').select('*', { count: 'exact' });
      if (params.status) {
        query = query.eq('status', params.status);
      }
      query = query.order('created_at', { ascending: false });

      const pageSize = params.limit ? parseInt(params.limit) : 20;
      const pageNum = params.page ? parseInt(params.page) : 1;
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: orders, count, error } = await query;
      if (error) throw error;
      const total = count || 0;
      return { data: { orders, total, page: pageNum, pages: Math.ceil(total / pageSize) } };
    }

    // 11. GET /admin/customers
    if (pathname === '/admin/customers') {
      const { data: customers, count, error } = await supabase.from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'user')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data: { customers, total: count || 0 } };
    }

    // 12. GET /admin/analytics
    if (pathname === '/admin/analytics') {
      return { data: { most_viewed: [], best_selling: [], revenue_trends: [] } };
    }

    // 13. GET /admin/notifications
    if (pathname === '/admin/notifications') {
      return { data: { notifications: [] } };
    }

    // 14. GET /admin/visitor-stats
    if (pathname === '/admin/visitor-stats') {
      return { data: { stats: { total_visits: 0, unique_visitors: 0 } } };
    }

    // 15. GET /admin/sales
    if (pathname === '/admin/sales') {
      return { data: { sales: [] } };
    }

    // 16. GET /admin/chats
    if (pathname === '/admin/chats') {
      return { data: { chats: [] } };
    }

    // 17. GET /chat/messages/:chatId
    match = matchPath('/chat/messages/:chatId', pathname);
    if (match) {
      return { data: { messages: [] } };
    }

    throw new Error(`Endpoint GET ${url} not mapped.`);
  },

  post: async (url, data, config) => {
    const pathname = getPathname(url);

    // 1. POST /categories
    if (pathname === '/categories') {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: category, error } = await supabase.from('categories').insert({
        name: data.name,
        slug,
        description: data.description || '',
        image: data.image || '',
        gender: data.gender || 'all',
      }).select().single();
      if (error) throw error;
      return { data: { category } };
    }

    // 2. POST /products
    if (pathname === '/products') {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: product, error } = await supabase.from('products').insert({ ...data, slug }).select().single();
      if (error) throw error;
      return { data: { product } };
    }

    // 3. POST /products/:productId/reviews
    let match = matchPath('/products/:productId/reviews', pathname);
    if (match) {
      const { productId } = match;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Authentication required");
      
      const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).single();
      const { data: review, error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        user_name: profile?.name || user.user_metadata?.name || 'Customer',
        rating: data.rating,
        comment: data.comment,
      }).select().single();
      if (error) throw error;
      return { data: { review } };
    }

    // 4. POST /wishlist/:productId
    match = matchPath('/wishlist/:productId', pathname);
    if (match) {
      const { productId } = match;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Authentication required");

      const { data: profile, error: profError } = await supabase.from('profiles').select('wishlist').eq('user_id', user.id).single();
      if (profError) throw profError;
      
      let wishlist = profile?.wishlist || [];
      let action = 'added';

      if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        action = 'removed';
      } else {
        wishlist.push(productId);
      }

      const { error } = await supabase.from('profiles').update({ wishlist }).eq('user_id', user.id);
      if (error) throw error;
      return { data: { wishlist, action } };
    }

    // 5. POST /orders
    if (pathname === '/orders') {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const stored = localStorage.getItem('nenath_cart');
      const cartObj = stored ? JSON.parse(stored) : { items: [], total: 0 };

      const orderDoc = {
        user_id: user?.id || null,
        customer_name: data.customer_name,
        customer_phone: data.phone,
        customer_email: user?.email || data.customer_email || 'anonymous@example.com',
        shipping_address: data.address,
        city: data.city,
        state: data.state,
        notes: data.notes || '',
        items: cartObj.items,
        total: cartObj.total,
        status: 'pending',
        payment_status: 'pending',
      };

      const { data: order, error } = await supabase.from('orders').insert(orderDoc).select().single();
      if (error) throw error;

      // Trigger order confirmation email
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirmation',
          to: order.customer_email,
          data: order
        })
      }).catch(err => console.error("Failed to trigger order confirmation email:", err));

      localStorage.removeItem('nenath_cart');
      return { data: { order } };
    }

    // 6. POST /orders/:orderId/payment-proof
    match = matchPath('/orders/:orderId/payment-proof', pathname);
    if (match) {
      const { orderId } = match;
      const file = data.get('file');
      if (!file) throw new Error("No file provided");

      const ext = file.name.split('.').pop() || 'png';
      const storagePath = `payment-proofs/${orderId}-${Date.now()}.${ext}`;

      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nenath-assets')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('nenath-assets')
        .getPublicUrl(storagePath);

      // Update order
      const { data: order, error: updateError } = await supabase.from('orders')
        .update({ payment_proof: publicUrl, status: 'payment_received' })
        .eq('order_id', orderId)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data: { order } };
    }

    // 7. POST /settings (saving settings)
    if (pathname === '/settings') {
      const { data: settings, error } = await supabase.from('settings').update(data).eq('setting_id', 'global').select().single();
      if (error) throw error;
      return { data: { settings } };
    }

    // 8. POST /upload and /upload/public (general file upload for admin/public)
    if (pathname === '/upload' || pathname === '/upload/public') {
      const file = data.get('file');
      if (!file) throw new Error("No file provided");

      const ext = file.name.split('.').pop() || 'png';
      const storagePath = `public/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nenath-assets')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('nenath-assets')
        .getPublicUrl(storagePath);

      return { data: { url: publicUrl, storage_path: storagePath } };
    }

    // 9. POST /track-visit (stub tracking visit)
    if (pathname === '/track-visit') {
      return { data: { success: true } };
    }

    // 10. POST /auth/google-session (stub Google Auth Session handler)
    if (pathname === '/auth/google-session') {
      return { data: { success: true } };
    }

    // 11. POST /admin/sales (stub adding sales)
    if (pathname === '/admin/sales') {
      return { data: { sale: {} } };
    }

    // 12. POST /admin/chat/reply (stub chat reply)
    if (pathname === '/admin/chat/reply') {
      return { data: { success: true } };
    }

    throw new Error(`Endpoint POST ${url} not mapped.`);
  },

  put: async (url, data, config) => {
    const pathname = getPathname(url);

    // 1. PUT /categories/:catId
    let match = matchPath('/categories/:catId', pathname);
    if (match) {
      const { catId } = match;
      const { data: category, error } = await supabase.from('categories').update(data).eq('category_id', catId).select().single();
      if (error) throw error;
      return { data: { category } };
    }

    // 2. PUT /products/:productId
    match = matchPath('/products/:productId', pathname);
    if (match) {
      const { productId } = match;
      const { data: product, error } = await supabase.from('products').update(data).eq('product_id', productId).select().single();
      if (error) throw error;
      return { data: { product } };
    }

    // 3. PUT /settings (update settings)
    if (pathname === '/settings') {
      const { data: settings, error } = await supabase.from('settings').update(data).eq('setting_id', 'global').select().single();
      if (error) throw error;
      return { data: { settings } };
    }

    // 4. PUT /admin/orders/:orderId (update order status)
    match = matchPath('/admin/orders/:orderId', pathname);
    if (match) {
      const { orderId } = match;
      const { data: order, error } = await supabase.from('orders').update(data).eq('order_id', orderId).select().single();
      if (error) throw error;
      return { data: { order } };
    }

    // 5. PUT /admin/notifications/:id/read (stub notification read)
    match = matchPath('/admin/notifications/:id/read', pathname);
    if (match) {
      return { data: { success: true } };
    }

    throw new Error(`Endpoint PUT ${url} not mapped.`);
  },

  delete: async (url, config) => {
    const pathname = getPathname(url);

    // 1. DELETE /categories/:catId
    let match = matchPath('/categories/:catId', pathname);
    if (match) {
      const { catId } = match;
      const { error } = await supabase.from('categories').delete().eq('category_id', catId);
      if (error) throw error;
      return { data: { message: "Category deleted" } };
    }

    // 2. DELETE /products/:productId
    match = matchPath('/products/:productId', pathname);
    if (match) {
      const { productId } = match;
      const { error } = await supabase.from('products').update({ status: 'deleted' }).eq('product_id', productId);
      if (error) throw error;
      return { data: { message: "Product deleted" } };
    }

    // 3. DELETE /admin/sales/:saleId (stub delete sale)
    match = matchPath('/admin/sales/:saleId', pathname);
    if (match) {
      return { data: { success: true } };
    }

    throw new Error(`Endpoint DELETE ${url} not mapped.`);
  }
};

export default api;
