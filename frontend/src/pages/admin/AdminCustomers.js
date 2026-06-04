import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Eye, ChevronRight } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/customers').then(r => { setCustomers(r.data.customers); setTotal(r.data.total); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="admin-customers">
      <div className="mb-6"><h2 className="text-xl font-heading">Customers</h2><p className="text-sm text-gray-500">{total} registered customers</p></div>
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase">Name</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden sm:table-cell">Email</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden md:table-cell">Phone</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden lg:table-cell">Location</th>
            <th className="text-left py-3 px-4 text-xs text-gray-500 uppercase hidden lg:table-cell">Joined</th>
          </tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{c.name}</td>
                <td className="py-3 px-4 hidden sm:table-cell text-gray-600">{c.email}</td>
                <td className="py-3 px-4 hidden md:table-cell">{c.phone}</td>
                <td className="py-3 px-4 hidden lg:table-cell">{c.state}{c.country && `, ${c.country}`}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
