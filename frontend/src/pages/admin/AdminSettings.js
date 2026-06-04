import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data.settings)).catch(() => {});
  }, []);

  const update = (field) => (e) => setSettings(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { setting_id, ...data } = settings;
      await api.put('/settings', data);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded" />)}</div>;

  return (
    <div data-testid="admin-settings" className="max-w-2xl">
      <h2 className="text-xl font-heading mb-6">Website Settings</h2>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Bank Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs mb-1 block">Bank Name</Label><Input data-testid="settings-bank-name" value={settings.bank_name || ''} onChange={update('bank_name')} placeholder="Enter bank name" /></div>
            <div><Label className="text-xs mb-1 block">Account Name</Label><Input data-testid="settings-account-name" value={settings.account_name || ''} onChange={update('account_name')} placeholder="Enter account name" /></div>
            <div><Label className="text-xs mb-1 block">Account Number</Label><Input data-testid="settings-account-number" value={settings.account_number || ''} onChange={update('account_number')} placeholder="Enter account number" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs mb-1 block">CEO Name</Label><Input value={settings.ceo_name || ''} onChange={update('ceo_name')} /></div>
            <div><Label className="text-xs mb-1 block">Contact Phone</Label><Input value={settings.contact_phone || ''} onChange={update('contact_phone')} /></div>
            <div><Label className="text-xs mb-1 block">WhatsApp Number</Label><Input value={settings.whatsapp_number || ''} onChange={update('whatsapp_number')} placeholder="2349xxxxxxxxx" /></div>
            <div><Label className="text-xs mb-1 block">Address</Label><Input value={settings.address || ''} onChange={update('address')} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Homepage Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs mb-1 block">Homepage Text / Tagline</Label><Input value={settings.homepage_text || ''} onChange={update('homepage_text')} /></div>
          </CardContent>
        </Card>

        <Button data-testid="save-settings-btn" onClick={handleSave} disabled={saving} className="bg-[#0A0A0A] text-white hover:bg-black/80 gap-2">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
