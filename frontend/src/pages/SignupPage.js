import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiErrorDetail } from '@/lib/api';
import { toast } from 'sonner';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', state: '', country: 'Nigeria' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div data-testid="signup-page" className="pt-20 lg:pt-24 min-h-screen flex items-center justify-center bg-[#fbfaf8]">
      <div className="w-full max-w-md px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 mt-2 font-body">Join NENATH AFFORDABLES</p>
        </div>

        {error && <div data-testid="signup-error" className="mb-4 p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="label-uppercase text-gray-500 mb-2 block">Full Name</Label>
            <Input data-testid="signup-name" value={form.name} onChange={update('name')} required className="h-12 border-gray-200" placeholder="Your full name" />
          </div>
          <div>
            <Label className="label-uppercase text-gray-500 mb-2 block">Email</Label>
            <Input data-testid="signup-email" type="email" value={form.email} onChange={update('email')} required className="h-12 border-gray-200" placeholder="your@email.com" />
          </div>
          <div>
            <Label className="label-uppercase text-gray-500 mb-2 block">Phone Number</Label>
            <Input data-testid="signup-phone" type="tel" value={form.phone} onChange={update('phone')} className="h-12 border-gray-200" placeholder="080xxxxxxxx" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="label-uppercase text-gray-500 mb-2 block">State</Label>
              <Input data-testid="signup-state" value={form.state} onChange={update('state')} className="h-12 border-gray-200" placeholder="FCT" />
            </div>
            <div>
              <Label className="label-uppercase text-gray-500 mb-2 block">Country</Label>
              <Input data-testid="signup-country" value={form.country} onChange={update('country')} className="h-12 border-gray-200" placeholder="Nigeria" />
            </div>
          </div>
          <div>
            <Label className="label-uppercase text-gray-500 mb-2 block">Password</Label>
            <Input data-testid="signup-password" type="password" value={form.password} onChange={update('password')} required className="h-12 border-gray-200" placeholder="Min 6 characters" />
          </div>
          <Button data-testid="signup-submit-btn" type="submit" disabled={loading}
            className="w-full bg-[#1c1a17] text-white hover:bg-black/80 py-6 uppercase text-xs tracking-[0.15em]">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8 font-body">
          Already have an account? <Link to="/login" data-testid="login-link" className="text-[#1c1a17] font-semibold hover:text-[#C6A85B]">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
