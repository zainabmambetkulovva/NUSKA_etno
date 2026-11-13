'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const compositionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compositionRef.current) return;

    let rotation = 0;
    let animationId: number;

    const animate = () => {
      rotation -= 0.002; // Медленное вращение против часовой стрелки
      
      if (compositionRef.current) {
        compositionRef.current.style.transform = `
          perspective(1200px) 
          rotateY(${rotation}rad) 
          translateZ(0px)
        `;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#243D2B] via-brand to-[#2a4732] overflow-hidden pt-20">
      {/* Фоновые декоративные элементы */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cream rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-cream rounded-full blur-3xl"></div>
      </div>

      {/* Парящие листья */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            🍃
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)]">
          {/* Левая часть - Текст */}
          <div className="text-center lg:text-left space-y-6 animate-fade-in">
            <div className="inline-block">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                <div className="h-px w-12 bg-cream"></div>
                <span className="text-cream text-sm tracking-widest uppercase">NUSKA_etno</span>
                <div className="h-px w-12 bg-cream"></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-cream leading-tight">
              Табигый дөөлөт —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cream to-white">
                ар бир үй-бүлөгө!
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-cream/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Биздин ар бир продукт — бул табигый белең, уруулар жана сиздин ден соолугуңуз үчүн кам көрүү.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a
                href="#prices"
                className="px-8 py-4 bg-cream text-brand rounded-xl font-bold text-lg hover:bg-cream-dark transition-all duration-300 shadow-2xl hover:shadow-cream/20 hover:scale-105"
              >
                Биздин баалар →
              </a>
              <a
                href="#about"
                className="px-8 py-4 border-2 border-cream text-cream rounded-xl font-bold text-lg hover:bg-cream hover:text-brand transition-all duration-300"
              >
                Биз жөнүндө
              </a>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-cream">100%</div>
                <div className="text-sm text-cream/70">Табигый</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-cream">12+</div>
                <div className="text-sm text-cream/70">Продукт</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-cream">500+</div>
                <div className="text-sm text-cream/70">Кардар</div>
              </div>
            </div>
          </div>

          {/* Правая часть - 3D Композиция */}
          <div className="relative flex items-center justify-center">
            <div
              ref={compositionRef}
              className="relative w-full max-w-2xl aspect-square"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s linear',
              }}
            >
              {/* Центральный подиум */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative w-96 h-96 rounded-full"
                  style={{
                    background: 'linear-gradient(145deg, #5a3a2a, #3d2618)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 -10px 30px rgba(0,0,0,0.3)',
                    transform: 'rotateX(60deg)',
                  }}
                >
                  {/* Кыргызский орнамент на подиуме */}
                  <div className="absolute inset-0 rounded-full opacity-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <pattern
                        id="pattern"
                        x="0"
                        y="0"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="10" cy="10" r="2" fill="#F4E9B9" />
                        <path
                          d="M10 5 L15 10 L10 15 L5 10 Z"
                          fill="none"
                          stroke="#F4E9B9"
                          strokeWidth="0.5"
                        />
                      </pattern>
                      <rect width="100" height="100" fill="url(#pattern)" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Продукты */}
              {/* Мёд */}
              <div
                className="absolute top-1/4 left-1/4"
                style={{
                  transform: 'translateZ(80px)',
                  animation: 'float 4s ease-in-out infinite',
                }}
              >
                <div className="relative w-32 h-40 bg-gradient-to-b from-amber-400 to-amber-600 rounded-lg shadow-2xl">
                  <div className="absolute inset-0 bg-white/20 rounded-lg backdrop-blur-sm"></div>
                  <div className="absolute top-2 left-2 right-2 h-8 bg-amber-800 rounded-t-lg"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="text-2xl">🍯</div>
                  </div>
                </div>
              </div>

              {/* Нават */}
              <div
                className="absolute top-1/3 right-1/4"
                style={{
                  transform: 'translateZ(60px)',
                  animation: 'float 5s ease-in-out infinite 1s',
                }}
              >
                <div className="relative w-28 h-28 bg-gradient-to-br from-cream to-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 flex flex-wrap gap-1 p-2">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-6 h-6 bg-white/80 rounded" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Кымыз */}
              <div
                className="absolute bottom-1/3 left-1/3"
                style={{
                  transform: 'translateZ(70px)',
                  animation: 'float 4.5s ease-in-out infinite 0.5s',
                }}
              >
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-950 rounded-full shadow-2xl">
                    <div className="absolute inset-4 bg-gradient-to-b from-cream-light to-cream rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Дополнительные продукты */}
              <div
                className="absolute top-1/2 right-1/3"
                style={{
                  transform: 'translateZ(50px)',
                  animation: 'float 5.5s ease-in-out infinite 1.5s',
                }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl shadow-2xl flex items-center justify-center text-4xl">
                  🧈
                </div>
              </div>

              <div
                className="absolute bottom-1/4 right-1/4"
                style={{
                  transform: 'translateZ(45px)',
                  animation: 'float 6s ease-in-out infinite 2s',
                }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-300 rounded-full shadow-2xl flex items-center justify-center text-3xl">
                  🥛
                </div>
              </div>
            </div>

            {/* Световые эффекты */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 right-10 w-64 h-64 bg-cream/10 rounded-full blur-3xl animate-pulse-slow"></div>
              <div className="absolute bottom-10 left-10 w-48 h-48 bg-amber-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-cream" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateZ(var(--z, 50px)) translateY(0px);
          }
          50% {
            transform: translateZ(var(--z, 50px)) translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
}
