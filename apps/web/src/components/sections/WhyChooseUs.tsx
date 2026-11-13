'use client';

import { Leaf, Mountain, Heart, Shield } from 'lucide-react';

const reasons = [
  {
    number: '01',
    icon: Leaf,
    title: '100% Табигый продукттар',
    description: 'Биздин азыктарда эч кандай жасалма кошулмалар жок. Таза табият — таза даам.',
    product: '🍯',
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    number: '02',
    icon: Mountain,
    title: 'Кыргызстандын экологиялык чистый аймактарынан',
    description: 'Биздин өнүмдөр: өлкөнүн коюз аймактарында, таза абада жана табигый шарттарда өндүрүлөт.',
    product: '🧈',
    gradient: 'from-green-400 to-green-600',
  },
  {
    number: '03',
    icon: Heart,
    title: 'Салат жана кооопсуздук',
    description: 'Ар бир продукт катуу сынактарданса - сиздин максаттарыбыз — сиздин жакшыланган жеткирүү.',
    product: '🥛',
    gradient: 'from-red-400 to-red-600',
  },
  {
    number: '04',
    icon: Shield,
    title: 'Сиздин ден соолугуңуз үчүн',
    description: 'Биздин табигый азыктар ден соолукка пайда берет, иммунитетти жакшыртууга жардам берет.',
    product: '🍶',
    gradient: 'from-blue-400 to-blue-600',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-brand to-[#243D2B] overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern
              id="why-pattern"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="1" fill="currentColor" />
              <path d="M10 5 L15 10 L10 15 L5 10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#why-pattern)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-px w-12 bg-cream"></div>
            <span className="text-cream text-sm tracking-widest uppercase">Биз жөнүндө</span>
            <div className="h-px w-12 bg-cream"></div>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-cream mb-6">
            Эмне үчүн бизди тандашат?
          </h2>

          <p className="text-xl text-cream/80 max-w-3xl mx-auto">
            Биздин ар бир продукт — бул табигый белең, уруулар жана сиздин камы көрүү жана сиздин ден соолугуңуз үчүн кам көрүү.
          </p>
        </div>

        {/* Сетка с причинами */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group relative"
              style={{
                animation: 'slide-up 0.6s ease-out forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
              }}
            >
              {/* Карточка */}
              <div className="relative h-full bg-gradient-to-b from-brand-light/20 to-brand-dark/20 backdrop-blur-sm rounded-2xl p-8 border border-cream/10 hover:border-cream/30 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cream/10">
                {/* Номер */}
                <div className="absolute -top-6 -left-6 text-8xl font-bold text-cream/10 group-hover:text-cream/20 transition-all duration-500">
                  {reason.number}
                </div>

                {/* Иконка */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <reason.icon className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>

                  {/* Продукт эмодзи */}
                  <div className="absolute -bottom-2 -right-2 text-4xl group-hover:scale-125 transition-transform duration-500">
                    {reason.product}
                  </div>
                </div>

                {/* Контент */}
                <div className="relative space-y-4">
                  <h3 className="text-xl font-bold text-cream group-hover:text-white transition-colors duration-300">
                    {reason.title}
                  </h3>

                  <p className="text-cream/70 leading-relaxed group-hover:text-cream/90 transition-colors duration-300">
                    {reason.description}
                  </p>
                </div>

                {/* Декоративный элемент */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cream/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Свечение при hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10`}></div>
            </div>
          ))}
        </div>

        {/* Нижний декоративный элемент */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 px-8 py-4 bg-cream/10 backdrop-blur-sm rounded-full border border-cream/20">
            <Leaf className="w-6 h-6 text-cream" />
            <span className="text-cream font-medium">
              NUSKA_etno — Табигаттын төөлөт, сиздин үй-бүлөңүз үчүн!
            </span>
            <Leaf className="w-6 h-6 text-cream" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
