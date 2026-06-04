import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', gender: 'all' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => api.get('/categories').then(r => setCategories(r.data.categories)).catch(() => {});
  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', image: '', gender: 'all' }); setModalOpen(true); };
  const openEdit = (cat) => { setEditing(cat.category_id); setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', gender: cat.gender || 'all' }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await api.put(`/categories/${editing}`, form); toast.success('Category updated'); }
      else { await api.post('/categories', form); toast.success('Category created'); }
      setModalOpen(false);
      fetchCategories();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetchCategories(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div data-testid="admin-categories">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading">Categories</h2>
        <Button data-testid="add-category-btn" onClick={openCreate} className="bg-[#0A0A0A] text-white gap-2"><Plus size={16} /> Add Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.category_id} className="bg-white border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {cat.image && <div className="w-12 h-12 bg-[#F5F1EB] overflow-hidden flex-shrink-0"><img src={cat.image} alt="" className="w-full h-full object-cover" /></div>}
                <div><h3 className="font-medium text-sm">{cat.name}</h3><p className="text-xs text-gray-500 mt-0.5">{cat.gender}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(cat.category_id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>
            <div><Label className="text-xs mb-1 block">Image URL</Label><Input value={form.image} onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))} placeholder="https://..." /></div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name} className="bg-[#0A0A0A] text-white gap-2"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
