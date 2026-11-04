import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-brand">
            Вкус кыргызских традиций
          </h1>
          <p className="text-xl text-neutral mb-8 max-w-2xl">
            Премиальный интернет-магазин натуральных и традиционных кыргызских продуктов.
            Качество, которое вы чувствуете в каждом bite.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-brand hover:bg-brand-dark text-white">
              Перейти в каталог
            </Button>
            <Button size="lg" variant="outline" className="border-brand text-brand hover:bg-cream">
              О нашей философии
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
