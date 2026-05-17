import React from 'react';
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-natural-text text-white/90 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-8 h-8 text-secondary" />
              <span className="text-2xl font-serif font-bold tracking-tighter">CleanEase.</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-medium mb-8">
              Premium hyperlocal services for modern homes. Connecting you with verified experts for every household need.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-secondary/20 transition-all text-white/60 hover:text-secondary">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-secondary/20 transition-all text-white/60 hover:text-secondary">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-secondary/20 transition-all text-white/60 hover:text-secondary">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-secondary/20 transition-all text-white/60 hover:text-secondary">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/home" className="hover:text-white transition-colors">Find Services</Link></li>
              <li><Link to="/role-selection" className="hover:text-white transition-colors">Become a Provider</Link></li>
              <li><Link to="/pro" className="hover:text-white transition-colors font-bold text-primary">CleanEase Pro</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Help & Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">Services</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/services?category=cleaning" className="hover:text-white transition-colors">Deep Cleaning</Link></li>
              <li><Link to="/services?category=repairs" className="hover:text-white transition-colors">Electric Repairs</Link></li>
              <li><Link to="/services?category=repairs" className="hover:text-white transition-colors">Plumbing Works</Link></li>
              <li><Link to="/services?category=cooking" className="hover:text-white transition-colors">Cooking & Tiffin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">Contact</h4>
            <ul className="space-y-6 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-white/60">hyd -500018</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <a href="mailto:support@cleanease.in" className="text-white/60 hover:text-white transition-colors">support@cleanease.in</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+919502337968" className="text-white/60 hover:text-white transition-colors">+91 95023 37968</a>
                  <a href="tel:+918790934547" className="text-white/60 hover:text-white transition-colors">+91 87909 34547</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-top border-white/5 flex flex-col md:row items-center justify-between gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            © 2026 CleanEase Technologies Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
