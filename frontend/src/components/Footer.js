import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_dac108e2-e034-49b0-b9b6-92469beae062/artifacts/p34dttcq_nenathaff.JPG";

const categories = [
  { name: "Ready-to-Wear Traditional", slug: "ready-to-wear-traditional" },
  { name: "Bags", slug: "bags" },
  { name: "Shoes", slug: "shoes" },
  { name: "Suits", slug: "suits" },
  { name: "Clothing", slug: "clothing" },
  { name: "Accessories", slug: "accessories" },
];

export default function Footer() {
  return (
    <footer data-testid="main-footer" className="bg-[#1c1a17] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img src={LOGO_URL} alt="NENATH AFFORDABLE" className="h-12 w-auto object-contain mb-4 brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed mt-4">
              Luxury Within Reach, Style Without Limits. Premium fashion that celebrates African elegance with global standards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="label-uppercase text-gray-400 mb-6">Quick Links</h4>
            <div className="space-y-3">
              <Link to="/shop" className="block text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">Shop All</Link>
              <Link to="/contact" className="block text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">Contact Us</Link>
              <Link to="/orders" className="block text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">Track Orders</Link>
              <Link to="/wishlist" className="block text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">Wishlist</Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="label-uppercase text-gray-400 mb-6">Categories</h4>
            <div className="space-y-3">
              {categories.map(cat => (
                <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="block text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">{cat.name}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="label-uppercase text-gray-400 mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#C6A85B] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#C6A85B] flex-shrink-0" />
                <a href="tel:09133487799" className="text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">09133487799</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#C6A85B] flex-shrink-0" />
                <a href="mailto:nenathaffordable@gmail.com" className="text-sm text-gray-300 hover:text-[#C6A85B] transition-colors">nenathaffordable@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">&copy; 2026 NENATH AFFORDABLE. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500">Privacy Policy</span>
            <span className="text-xs text-gray-500">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
