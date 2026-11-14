import Image from 'next/image';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { cn } from '@/lib/cn';
import { companyPhoto } from '@/lib/product-photos';

/**
 * Product photo. Without an uploaded photo, products the company sent photos
 * of (matched by `slug`) show that package photo, whole, on a warm glow; the
 * others show an ornamental placeholder. Remote images are optimised by
 * next/image.
 */
export function ProductImage({
  url,
  slug,
  alt,
  name,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority,
  className,
  placeholderLabel,
  bare = false,
}: {
  /** No background or glow (the photo floats over its own scene). */
  bare?: boolean;
  url?: string | null;
  slug?: string | null;
  alt?: string | null;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  placeholderLabel?: string;
}) {
  const fallback = url ? null : companyPhoto(slug);
  return (
    <div className={cn('relative overflow-hidden', !bare && 'bg-cream-light', className)}>
      {fallback ? (
        // the company's package photo (transparent background) on a warm glow
        <div
          className={cn(
            'absolute inset-0',
            !bare && 'bg-[radial-gradient(circle_at_50%_45%,#FFFDF5,#F1E2C2_70%,#E6D2A8)]'
          )}
        >
          <Image
            src={fallback}
            alt={alt || name}
            fill
            sizes={sizes}
            quality={95}
            priority={priority}
            className="object-contain p-[7%] drop-shadow-[0_14px_16px_rgba(60,40,15,0.35)]"
          />
        </div>
      ) : url ? (
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
