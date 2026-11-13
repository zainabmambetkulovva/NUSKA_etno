'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Menu, X, User, ShoppingCart } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'kg' | 'ru'>('kg');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'kg' ? 'ru' : 'kg'));
  };

  const menuItems = [
    { label: 'Башкы бет', href: '/' },
    { label: 'Биз жөнүндө', href: '#about' },
    { label: 'Биздин баалар', href: '#prices' },
    { label: 'Байланыш', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand/95 backdrop-blur-sm shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-brand"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                  <circle cx="12" cy="14" r="3" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-bold text-cream tracking-wide hidden md:block">
              NUSKA_etno
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-cream hover:text-white transition-colors duration-300 font-medium relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cream group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-cream/10 hover:bg-cream/20 text-cream transition-all duration-300"
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg hover:bg-cream/10 transition-colors duration-300 text-cream"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cream text-brand text-xs font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg border-2 border-cream text-cream hover:bg-cream hover:text-brand transition-all duration-300 font-medium"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-lg bg-cream text-brand hover:bg-cream-dark transition-all duration-300 font-medium shadow-lg"
              >
                Регистрация
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-cream/10 text-cream transition-colors duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-cream/20 animate-slide-down">
            <nav className="flex flex-col space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-cream hover:text-white transition-colors duration-300 font-medium py-2"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 text-cream hover:text-white transition-colors duration-300 py-2"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{language.toUpperCase()}</span>
              </button>
              <div className="flex flex-col space-y-2 pt-3 border-t border-cream/20">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-5 py-2.5 rounded-lg border-2 border-cream text-cream hover:bg-cream hover:text-brand transition-all duration-300 font-medium text-center"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-cream text-brand hover:bg-cream-dark transition-all duration-300 font-medium text-center"
                >
                  Регистрация
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
