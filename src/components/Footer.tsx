import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-zinc-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Section - Logo & Description */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/Sarothilogopro.png" 
              alt="Sarothi Logo" 
              className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=S";
              }}
            />
            <span className="text-2xl font-bold text-emerald-500">Sarothi</span>
          </Link>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Sarothi is a website where we primarily work with students and help them save time. 
            Here, students can access HSC/SSC previous year questions and past questions from various 
            admission exams for free. They will also get the latest admission updates and clearly 
            organized information about the requirements for sitting exams at different universities.
          </p>
        </div>

        {/* Center Section - Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 text-emerald-500">Quick Links</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link to="/" className="hover:text-emerald-500 transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-emerald-500 transition-colors">About Us</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-500 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Right Section - Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2 text-emerald-500">Contact</h3>
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Email:</span> support@sarothi.com
            </p>
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Admin:</span> alamnishat456@gmail.com
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Sarothi – Student Support Platform. All rights reserved.
      </div>
    </footer>
  );
};
