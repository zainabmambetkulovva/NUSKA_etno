'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  product: string;
}

// Кыргызские отзывы покупателей
const reviews: Review[] = [
  {
    id: 1,
    name: 'Айгуль Токтогулова',
    rating: 5,
    comment: 'Навет абдан даамдуу! Үй-бүлөм менен жакшы көрүп жейбиз. Сапаты өтө жакшы, таза продукт.',
    date: '15 октября 2024',
    product: 'Навет 0.5кг',
  },
  {
    id: 2,
    name: 'Нургуль Бекмуратова',
    rating: 5,
    comment: 'Курут абдан сапаттуу! Балдарым аябай жакшы көрүшөт. Рахмат NUSKA тиби!',
    date: '3 ноября 2024',
    product: 'Курут 250г',
  },
  {
    id: 3,
    name: 'Жамиля Асанова',
    rating: 5,
    comment: 'Первый раз заказывала через интернет, очень довольна! Продукты свежие, вкусные. Доставка быстрая.',
    date: '20 октября 2024',
    product: 'Быштак 300г',
  },
  {
    id: 4,
    name: 'Гульмира Султанова',
    rating: 5,
    comment: 'Навет жана курут өтө даамдуу! Кыргыз продуктуларын ушундай жерден алуу өтө ыңгайлуу.',
    date: '28 октября 2024',
    product: 'Навет + Курут комплект',
  },
  {
    id: 5,
    name: 'Айзада Токтосунова',
    rating: 5,
    comment: 'Качество на высшем уровне! Настоящие традиционные продукты. Всем рекомендую!',
    date: '5 ноября 2024',
    product: 'Быштак 500г',
  },
];

export default function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      nextReview();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextReview = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToReview = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-cream/30 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-brand rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-brand mb-4"
          >
            Биздин кардарлар айтышат
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Отзывы наших довольных покупателей о качестве продукции
          </motion.p>
        </div>

        {/* Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 min-h-[320px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 p-8 md:p-12"
              >
                {/* Rating Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < reviews[currentIndex].rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xl md:text-2xl text-gray-700 text-center mb-8 font-medium leading-relaxed">
                  "{reviews[currentIndex].comment}"
                </p>

                {/* Author Info */}
                <div className="text-center">
                  <p className="text-lg font-bold text-brand mb-1">
                    {reviews[currentIndex].name}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    {reviews[currentIndex].product}
                  </p>
                  <p className="text-xs text-gray-400">{reviews[currentIndex].date}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevReview}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand/10 hover:bg-brand hover:text-white text-brand rounded-full flex items-center justify-center transition-all duration-300 z-20"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand/10 hover:bg-brand hover:text-white text-brand rounded-full flex items-center justify-center transition-all duration-300 z-20"
              aria-label="Next review"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToReview(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-brand w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Instagram CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            Следите за нами в Instagram и делитесь своими отзывами!
          </p>
          <a
            href="https://instagram.com/nuska_etno"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @nuska_etno
          </a>
        </motion.div>
      </div>
    </section>
  );
}
