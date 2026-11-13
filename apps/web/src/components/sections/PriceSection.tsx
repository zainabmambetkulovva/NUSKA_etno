'use client';

import { ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';

const products = [
  {
    id: 1,
    name: 'Нават 0,5 кг',
    nameKg: 'Нават 0,5',
    price: 100,
    image: '🍬',
    category: 'Нават',
    description: 'Табигый таттуулук',
    gradient: 'from-amber-100 to-amber-300',
  },
  {
    id: 2,
    name: 'Нават 0,6 кг',
    nameKg: 'Нават 0,6',
    price: 115,
    image: '🍬',
    category: 'Нават',
    description: 'Табигый таттуулук',
    gradient: 'from-amber-200 to-amber-400',
  },
  {
    id: 3,
    name: 'Нават 0,7 кг',
    nameKg: 'Нават 0,7',
    price: 145,
    image: '🍬',
    category: 'Нават',
    description: 'Табигый таттуулук',
    gradient: 'from-amber-300 to-amber-500',
  },
  {
    id: 4,
    name: 'Беш бармак',
    nameKg: 'Беш бармак',
    price: 97,
    image: '🍝',
    category: 'Улуттук тамак',
    description: 'Ден соолук үчүн табиый тандоо',
    gradient: 'from-yellow-100 to-yellow-300',
  },
  {
    id: 5,
    name: 'Каттама',
    nameKg: 'Каттама',
    price: 170,
    image: '🥞',
    category: 'Улуттук тамак',
    description: 'Жумшак жана даамдуу',
    gradient: 'from-orange-100 to-orange-300',
  },
  {
    id: 6,
    name: 'Керемет шыпаа классик',
    nameKg: 'Керемет шыпаа классик',
    price: 65,
    image: '🍶',
    category: 'Керемет шыпаа',
    description: 'Ден соолук үчүн табиий тандоо',
    gradient: 'from-green-100 to-green-300',
  },
  {
    id: 7,
    name: 'Керемет шыпаа чычырканак',
    nameKg: 'Керемет шыпаа чычырканак',
    price: 85,
    image: '🍶',
    category: 'Керемет шыпаа',
    description: 'Ден соолук үчүн табиий тандоо',
    gradient: 'from-green-200 to-green-400',
  },
  {
    id: 8,
    name: 'Холодец',
    nameKg: 'Холодец',
    price: 110,
    image: '🍖',
    category: 'Ден соолукка',
    description: 'Пайдалуу жана даамдуу',
    gradient: 'from-red-100 to-red-300',
  },
  {
    id: 9,
    name: 'Кымыз',
    nameKg: 'Кымыз',
    price: 300,
    image: '🥛',
    category: 'Суусундуктар',
    description: 'Ден соолук үчүн табиый тандоо',
    gradient: 'from-blue-100 to-blue-300',
  },
  {
    id: 10,
    name: 'Жупка',
    nameKg: 'Жупка',
    price: 85,
    image: '🧀',
    category: 'Ден соолукка',
    description: 'Сапаттуу сүт продукту',
    gradient: 'from-yellow-200 to-yellow-400',
  },
  {
    id: 11,
    name: 'Сары-май',
    nameKg: 'Сары-май',
    price: 235,
    image: '🧈',
    category: 'Ден соолукка',
    description: 'Табигый майлуу продукт',
    gradient: 'from-amber-200 to-amber-400',
  },
  {
    id: 12,
    name: 'Бал',
    nameKg: 'Бал',
    price: 235,
    image: '🍯',
    category: 'Таттуулук',
    description: 'Таза табигый бал',
    gradient: 'from-amber-300 to-amber-500',
  },
];

const categories = ['Баардыгы', 'Нават', 'Улуттук тамак', 'Керемет шыпаа', 'Ден соолукка', 'Суусундуктар', 'Таттуулук'];

export default function PriceSection() {
  const [selectedCategory, setSelectedCategory] = useState('Баардыгы');
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const filteredProducts =
    selectedCategory === 'Баардыгы'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <section id="prices" className="relative py-24 bg-gradient-to-b from-[#243D2B] to-brand overflow-hidden">
      {/* Фоновые горы */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <path
            d="M0,400 L200,350 L400,300 L600,250 L800,300 L1000,350 L1200,400 L1200,600 L0,600 Z"
            fill="currentColor"
            className="text-brand-dark"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-px w-12 bg-cream"></div>
            <span className="text-cream text-sm tracking-widest uppercase">Биздин баалар</span>
            <div className="h-px w-12 bg-cream"></div>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-6">
            Табигый сапат, ар бир үй-бүлөгө жеткиликтүү баада.
          </h2>

          <p className="text-xl text-cream/80 max-w-3xl mx-auto">
            Биздин продуктылар — бул сапат жана баада оңой эмес баланс.
          </p>
        </div>

        {/* Фильтр категорий */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-cream text-brand shadow-lg scale-105'
                  : 'bg-brand-light/20 text-cream hover:bg-brand-light/30 border border-cream/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Сетка продуктов */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="group relative"
              style={{
                animation: 'scale-in 0.5s ease-out forwards',
                animationDelay: `${index * 0.05}s`,
                opacity: 0,
              }}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Карточка продукта */}
              <div className="relative h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-cream/10 hover:border-cream/30 transition-all duration-500 hover:transform hover:-translate-y-3 hover:shadow-2xl hover:shadow-cream/20">
                {/* NUSKA_etno логотип */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-12 h-12 bg-brand/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-cream/30">
                    <svg
                      className="w-6 h-6 text-cream"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                    </svg>
                  </div>
                </div>

                {/* Изображение продукта */}
                <div className={`relative h-64 bg-gradient-to-br ${product.gradient} flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                  <div
                    className={`text-8xl transform transition-all duration-500 ${
                      hoveredProduct === product.id ? 'scale-125 rotate-12' : 'scale-100 rotate-0'
                    }`}
                  >
                    {product.image}
                  </div>

                  {/* Декоративные элементы */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cream/30 rounded-tl-xl"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cream/30 rounded-br-xl"></div>
                  </div>

                  {/* Категория */}
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-brand/80 backdrop-blur-sm rounded-full border border-cream/30">
                    <span className="text-cream text-xs font-medium">{product.category}</span>
                  </div>
                </div>

                {/* Информация о продукте */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-cream mb-2 group-hover:text-white transition-colors duration-300">
                      {product.nameKg}
                    </h3>
                    <p className="text-sm text-cream/70">{product.description}</p>
                  </div>

                  {/* Рейтинг */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="text-cream/70 text-sm ml-2">(4.9)</span>
                  </div>

                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between pt-4 border-t border-cream/10">
                    <div>
                      <div className="text-3xl font-bold text-cream">{product.price}</div>
                      <div className="text-sm text-cream/70">сом</div>
                    </div>

                    <button className="p-3 bg-cream text-brand rounded-xl hover:bg-cream-dark transition-all duration-300 hover:scale-110 shadow-lg group/btn">
                      <ShoppingCart className="w-5 h-5 group-hover/btn:animate-bounce" />
                    </button>
                  </div>
                </div>

                {/* Hover эффект свечения */}
                <div className={`absolute inset-0 bg-gradient-to-t from-cream/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
              </div>

              {/* Внешнее свечение */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}></div>
            </div>
          ))}
        </div>

        {/* Нижний CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center space-y-4 px-8 py-6 bg-cream/10 backdrop-blur-sm rounded-2xl border border-cream/20">
            <p className="text-cream text-lg">
              <strong>Жогорку сапат</strong> • <strong>Жеткиликтүү баа</strong> • <strong>Тез жеткирүү</strong>
            </p>
            <a
              href="#contact"
              className="px-8 py-4 bg-cream text-brand rounded-xl font-bold hover:bg-cream-dark transition-all duration-300 shadow-lg hover:scale-105"
            >
              Азыр заказ берүү →
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}
