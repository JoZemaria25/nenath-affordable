import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Tags, Users, Settings, BarChart3, Bell, LogOut, Menu, X, ChevronLeft, MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { path: '/admin/categories', icon: Tags, label: 'Categories' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/chat', icon: MessageCircle, label: 'Live Chat' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    import('@/lib/api').then(({ default: api }) => {
      api.get('/admin/notifications').then(r => {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unread_count);
      }).catch(() => {});
    });
  }, [isAdmin, navigate]);

  const isActive = (path, exact = false) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div data-testid="admin-layout" className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-[#0A0A0A] text-white fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium hover:text-[#C6A85B] transition-colors">
            <ChevronLeft size={14} /> Back to Store
          </Link>
          <h2 className="text-lg font-heading mt-3">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} data-testid={`admin-nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive(item.path, item.exact) ? 'bg-white/10 text-[#C6A85B]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button data-testid="admin-logout" onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full px-2 py-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0A0A0A] text-white z-40 flex items-center justify-between px-4 h-14">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <h2 className="text-sm font-heading">Admin Panel</h2>
        <Link to="/admin" className="relative p-2">
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>}
        </Link>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-14 bottom-0 w-64 bg-[#0A0A0A] text-white overflow-y-auto">
            <nav className="py-4">
              {navItems.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3 text-sm ${isActive(item.path, item.exact) ? 'bg-white/10 text-[#C6A85B]' : 'text-gray-400 hover:text-white'}`}>
                  <item.icon size={18} />{item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        {/* Top bar */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-lg font-heading capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</h1>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>}
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
