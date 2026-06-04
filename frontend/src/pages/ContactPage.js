import React from 'react';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <div data-testid="contact-page" className="pt-20 lg:pt-24 min-h-screen bg-[#fbfaf8]">
      <div className="bg-[#F5F1EB] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label-uppercase text-[#C6A85B] mb-2">Get in Touch</p>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight font-heading">Contact Us</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-light tracking-tight mb-6">For inquiries, orders, or support, contact the CEO directly.</h2>
            <p className="text-sm text-gray-600 font-body leading-relaxed mb-8">
              We're here to help you find the perfect style. Whether you have questions about our products, need help with your order, or want to explore custom options, don't hesitate to reach out.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5F1EB] flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-[#C6A85B]" />
                </div>
                <div>
                  <p className="label-uppercase text-gray-400 text-[10px] mb-1">Phone</p>
                  <a href="tel:09133487799" className="text-sm font-medium hover:text-[#C6A85B] transition-colors">09133487799</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5F1EB] flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-[#C6A85B]" />
                </div>
                <div>
                  <p className="label-uppercase text-gray-400 text-[10px] mb-1">Email</p>
                  <a href="mailto:nenathaffordable@gmail.com" className="text-sm font-medium hover:text-[#C6A85B] transition-colors">nenathaffordable@gmail.com</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5F1EB] flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-[#C6A85B]" />
                </div>
                <div>
                  <p className="label-uppercase text-gray-400 text-[10px] mb-1">Headquarters</p>
                  <p className="text-sm font-medium">Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#25D366] flex items-center justify-center flex-shrink-0 rounded-full">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="label-uppercase text-gray-400 text-[10px] mb-1">WhatsApp</p>
                  <a href="https://wa.me/2349133487799" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-[#25D366] transition-colors">Chat with us on WhatsApp</a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <a href="https://wa.me/2349133487799" target="_blank" rel="noopener noreferrer">
                <Button data-testid="whatsapp-contact-btn" className="bg-[#25D366] text-white hover:bg-[#20bd5a] px-8 py-6 uppercase text-xs tracking-[0.15em]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="mr-2">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </Button>
              </a>
              <a href="tel:09133487799">
                <Button variant="outline" className="px-8 py-6 border-gray-200 uppercase text-xs tracking-[0.15em]">
                  <Phone size={14} className="mr-2" /> Call Now
                </Button>
              </a>
            </div>
          </div>

          {/* CEO Card */}
          <div className="bg-[#F5F1EB] p-8 sm:p-12 flex flex-col justify-center">
            <p className="label-uppercase text-[#C6A85B] mb-4">CEO & Founder</p>
            <h3 className="text-3xl font-heading font-light tracking-tight">Nenzab David Bunshak</h3>
            <p className="text-sm text-gray-600 font-body leading-relaxed mt-4">
              "At NENATH AFFORDABLE, we believe luxury fashion should be accessible to everyone. Our mission is to deliver premium quality at affordable prices, celebrating the beauty of African fashion on the global stage."
            </p>
            <div className="mt-8 pt-8 border-t border-gray-300/50">
              <p className="text-xs text-gray-500 font-body">NENATH AFFORDABLE</p>
              <p className="text-xs text-gray-500 font-body mt-1">Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria</p>
              <p className="font-accent italic text-lg text-gray-700 mt-4">"Luxury Within Reach, Style Without Limits."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
