import Image from 'next/image';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { cn } from '@/lib/cn';
import { companyPhoto } from '@/lib/product-photos';

/**
 * Product photo. Without an uploaded photo, products the company sent photos
 * of (matched by `slug`) show that photo, whole, on a blurred copy of itself;
 * the others show an ornamental placeholder. Remote images are optimised by
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
}: {
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
    <div className={cn('relative overflow-hidden bg-cream-light', className)}>
      {fallback ? (
        <>
          <Image
            src={fallback}
            alt=""
            fill
            sizes="64px"
            className="scale-110 object-cover opacity-70 blur-xl"
            aria-hidden
          />
          <Image
            src={fallback}
            alt={alt || name}
            fill
            sizes={sizes}
            priority={priority}
            className="object-contain drop-shadow-[0_12px_18px_rgba(40,25,10,0.35)]"
          />
        </>
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
