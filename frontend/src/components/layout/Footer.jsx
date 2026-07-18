import { Link } from 'react-router-dom';
import { Sparkles, Mail, Globe } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Browse Businesses', to: '/businesses' },
    { label: 'For Business Owners', to: '/register?role=business_owner' },
    { label: 'Book Appointment', to: '/businesses' },
    { label: 'Reviews', to: '/businesses' },
  ],
  Categories: [
    { label: 'Salon & Beauty', to: '/businesses?category=salon' },
    { label: 'Health & Medical', to: '/businesses?category=hospital' },
    { label: 'Fitness & Gym', to: '/businesses?category=gym' },
    { label: 'Restaurants', to: '/businesses?category=restaurant' },
  ],
  Company: [
    { label: 'About Us', to: '/#about' },
    { label: 'Contact', to: '/#contact' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">BizConnect</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Discover local businesses and book appointments online. Your go-to platform for seamless service booking.
            </p>
            <div className="flex items-center gap-3">
              {['𝕏', '📸', '📘', '💼'].map((emoji, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-indigo-600 flex items-center justify-center transition-colors text-sm">
                  {emoji}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white mb-4 text-sm">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm hover:text-indigo-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Stay Updated</h3>
            <p className="text-sm text-gray-400">Get the latest business updates and offers.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 sm:w-64 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="btn-primary text-sm whitespace-nowrap px-4 py-2.5">
              Subscribe
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2024 BizConnect. All rights reserved.</p>
          <div className="flex items-center gap-1 text-sm">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:support@bizconnect.com" className="hover:text-indigo-400 transition-colors">
              support@bizconnect.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
