import Image from 'next/image';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { cn } from '@/lib/cn';

/**
 * Product photo, or an ornamental placeholder until the company provides
 * real photos (TZ §26). Remote images are optimised by next/image.
 */
export function ProductImage({
  url,
  alt,
  name,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority,
  className,
  placeholderLabel,
}: {
  url?: string | null;
  alt?: string | null;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  placeholderLabel?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden bg-cream-light', className)}>
      {url ? (
        <Image
          src={url}
          alt={alt || name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOST}
        />
      ) : (
        <div className="bg-ornament absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <KochkorMuyuz className="h-10 w-20 text-brand/35" />
          <span className="font-serif text-lg font-semibold text-brand/80">{name}</span>
          {placeholderLabel && (
            <span className="text-xs uppercase tracking-widest text-ink-soft">
              {placeholderLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
