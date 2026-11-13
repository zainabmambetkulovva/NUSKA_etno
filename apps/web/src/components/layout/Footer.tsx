'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-brand to-brand-dark text-white overflow-hidden">
      {/* Mountain Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="absolute bottom-0 w-full h-64"
          viewBox="0 0 1200 200"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,100 L200,40 L400,80 L600,20 L800,60 L1000,30 L1200,70 L1200,200 L0,200 Z" />
          <path
            d="M0,120 L150,80 L350,110 L550,60 L750,90 L950,70 L1200,100 L1200,200 L0,200 Z"
            opacity="0.5"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Logo & Description */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand">N</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">NUSKA</h3>
                  <p className="text-cream text-sm">etno</p>
                </div>
              </div>
            </Link>
            <p className="text-cream/90 leading-relaxed">
              Премиальный интернет-магазин натуральных и традиционных кыргызских
              продуктов. Качество, которое вы чувствуете.
            </p>
            <p className="text-cream/90 leading-relaxed">
              Кыргыз продуктуларынын таза даамын сиздин үйүңүзгө жеткирбиз.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-cream">Навигация</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/catalog"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  О нас
                </Link>
              </li>
              <li>
                <Link
                  href="/pickup-locations"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  Пункты выдачи
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  Вопросы и ответы
                </Link>
              </li>
              <li>
                <Link
                  href="/contacts"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  Контакты
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-cream/80 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cream rounded-full" />
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contacts & Social */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-cream">Контакты</h3>
            <div className="space-y-4 mb-6">
              <a
                href="tel:+996701111024"
                className="flex items-start gap-3 text-cream/80 hover:text-white transition-colors duration-200"
              >
                <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">+996 701 111 024</p>
                  <p className="text-sm text-cream/60">Ежедневно 9:00 - 20:00</p>
                </div>
              </a>
              <a
                href="mailto:info@nuska-etno.kg"
                className="flex items-start gap-3 text-cream/80 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">info@nuska-etno.kg</p>
                  <p className="text-sm text-cream/60">Ответим в течение 24 часов</p>
                </div>
              </a>
              <div className="flex items-start gap-3 text-cream/80">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Бишкек, Кыргызстан</p>
                  <p className="text-sm text-cream/60">Самовывоз из пунктов выдачи</p>
                </div>
              </div>
            </div>

            <h4 className="text-lg font-semibold mb-4 text-cream">Мы в соцсетях</h4>
            <div className="flex gap-4">
              <a
                href="https://wa.me/996701111024"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-cream/20 hover:bg-cream hover:text-brand rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="WhatsApp"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
              <a
                href="https://t.me/nuska_etnokatalog"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-cream/20 hover:bg-cream hover:text-brand rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Telegram"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://youtube.com/@nuskaetno?si=oCiBT0GwrmoR7wV0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-cream/20 hover:bg-cream hover:text-brand rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="YouTube"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/nuska_etno"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-cream/20 hover:bg-cream hover:text-brand rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Instagram"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/20 mt-12 pt-8 text-center text-cream/70">
          <p>
            © {currentYear} NUSKA_etno. Все права защищены. Создано с любовью к
            кыргызским традициям.
          </p>
        </div>
      </div>
    </footer>
  );
}
