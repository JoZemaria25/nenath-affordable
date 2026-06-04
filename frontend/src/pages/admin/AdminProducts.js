import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import api, { formatPrice } from '@/lib/api';
import { toast } from 'sonner';

const EMPTY_PRODUCT = {
  name: '', description: '', features: '', rules: '', care_instructions: '', promotional_text: '',
  price: '', discount_price: '', category_id: '', sizes: '', colors: '', images: '',
  stock: '', badge: '', status: 'in_stock', video_url: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = () => {
    api.get(`/products?limit=20&page=${page}`).then(r => {
      setProducts(r.data.products);
      setTotal(r.data.total);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.categories)).catch(() => {}); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PRODUCT); setModalOpen(true); };
  const openEdit = (product) => {
    setEditing(product.product_id);
    setForm({
      name: product.name, description: product.description || '',
      features: (product.features || []).join('\n'), rules: product.rules || '',
      care_instructions: product.care_instructions || '', promotional_text: product.promotional_text || '',
      price: product.price, discount_price: product.discount_price || '',
      category_id: product.category_id || '', sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '), images: (product.images || []).join('\n'),
      stock: product.stock, badge: product.badge || '', status: product.status || 'in_stock',
      video_url: product.video_url || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name, description: form.description,
      features: form.features.split('\n').filter(Boolean),
      rules: form.rules, care_instructions: form.care_instructions,
      promotional_text: form.promotional_text,
      price: parseFloat(form.price) || 0,
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      category_id: form.category_id,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      images: form.images.split('\n').filter(Boolean),
      stock: parseInt(form.stock) || 0,
      badge: form.badge || null,
      status: form.status,
      video_url: form.video_url || ''
    };
    try {
      if (editing) {
        await api.put(`/products/${editing}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetchProducts();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload/public', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${data.url}`;
        setForm(prev => ({ ...prev, images: prev.images ? prev.images + '\n' + fullUrl : fullUrl }));
        toast.success(`Uploaded ${file.name}`);
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value || e }));

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-heading">Products</h2><p className="text-sm text-gray-500">{total} total products</p></div>
        <Button data-testid="add-product-btn" onClick={openCreate} className="bg-[#0A0A0A] text-white hover:bg-black/80 gap-2"><Plus size={16} /> Add Product</Button>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white animate-pulse rounded" />)}</div> : (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Product</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden sm:table-cell">Price</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden md:table-cell">Stock</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden lg:table-cell">Badge</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-[#F5F1EB] overflow-hidden flex-shrink-0">{p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}</div>
                      <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">{formatPrice(p.discount_price || p.price)}</td>
                  <td className="py-3 px-4 hidden md:table-cell"><span className={p.stock <= 5 ? 'text-red-600 font-semibold' : ''}>{p.stock}</span></td>
                  <td className="py-3 px-4 hidden lg:table-cell">{p.badge && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-100">{p.badge}</span>}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded mr-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.product_id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs mb-1 block">Name *</Label><Input data-testid="product-name-input" value={form.name} onChange={update('name')} /></div>
              <div><Label className="text-xs mb-1 block">Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm(prev => ({ ...prev, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs mb-1 block">Description</Label><Textarea value={form.description} onChange={update('description')} rows={3} /></div>
            <div><Label className="text-xs mb-1 block">Features (one per line)</Label><Textarea value={form.features} onChange={update('features')} rows={3} placeholder="Premium material&#10;Durable stitching" /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><Label className="text-xs mb-1 block">Price *</Label><Input type="number" value={form.price} onChange={update('price')} /></div>
              <div><Label className="text-xs mb-1 block">Discount Price</Label><Input type="number" value={form.discount_price} onChange={update('discount_price')} /></div>
              <div><Label className="text-xs mb-1 block">Stock *</Label><Input type="number" value={form.stock} onChange={update('stock')} /></div>
              <div><Label className="text-xs mb-1 block">Badge</Label>
                <Select value={form.badge} onValueChange={(v) => setForm(prev => ({ ...prev, badge: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="limited">Limited</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-xs mb-1 block">Sizes (comma separated)</Label><Input value={form.sizes} onChange={update('sizes')} placeholder="S, M, L, XL" /></div>
              <div><Label className="text-xs mb-1 block">Colors (comma separated)</Label><Input value={form.colors} onChange={update('colors')} placeholder="Black, White, Red" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="in_stock">In Stock</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Product Rules/Policy</Label><Textarea value={form.rules} onChange={update('rules')} rows={3} /></div>
            <div><Label className="text-xs mb-1 block">Care Instructions</Label><Textarea value={form.care_instructions} onChange={update('care_instructions')} rows={2} /></div>
            <div><Label className="text-xs mb-1 block">Promotional Text</Label><Input value={form.promotional_text} onChange={update('promotional_text')} placeholder="Limited stock available" /></div>
            <div>
              <Label className="text-xs mb-2 block font-semibold">Product Images</Label>
              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C6A85B] transition-colors mb-3">
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-[#F5F1EB] rounded-full flex items-center justify-center">
                    <Plus size={20} className="text-[#C6A85B]" />
                  </div>
                  <span className="text-sm font-medium">Click to upload product photos</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 10MB each</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {/* Image previews */}
              {form.images && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.split('\n').filter(Boolean).map((url, i) => (
                    <div key={i} className="relative w-16 h-20 bg-[#F5F1EB] overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      <button type="button" onClick={() => {
                        const imgs = form.images.split('\n').filter(Boolean);
                        imgs.splice(i, 1);
                        setForm(prev => ({ ...prev, images: imgs.join('\n') }));
                      }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea value={form.images} onChange={update('images')} rows={2} placeholder="Or paste image URLs (one per line)" className="text-xs" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Video Preview URL (YouTube/MP4)</Label>
              <Input data-testid="product-video-url" value={form.video_url} onChange={update('video_url')} placeholder="https://youtube.com/watch?v=... or https://...mp4" />
              <p className="text-[10px] text-gray-400 mt-1">Add a video to showcase models wearing this product</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button data-testid="save-product-btn" onClick={handleSave} disabled={saving || !form.name} className="bg-[#0A0A0A] text-white gap-2">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
