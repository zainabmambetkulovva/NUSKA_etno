'use client';

import type { ProductCard } from '@nuska/types';

import { Button } from '@/components/ui/button';
import { CartIcon } from '@/components/ui/icons';
import { useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { errorMessage } from '@/lib/api/errors';
import { flyToCart } from '@/lib/fly-to-cart';
import { useToast } from '@/stores/toast';

export function AddToCartButton({
  product,
  quantity = 1,
  size = 'md',
  className,
  onAdded,
}: {
  product: ProductCard;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onAdded?: () => void;
}) {
  const { t } = useI18n();
  const { add } = useCart();
  const toast = useToast((s) => s.show);

  if (!product.inStock) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        {t.product.outOfStock}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className={className}
      loading={add.isPending}
      onClick={(event) => {
        const button = event.currentTarget;
        add.mutate(
          { product, quantity },
          {
            onSuccess: () => {
              flyToCart(button, product.image?.url);
              toast(`${t.product.added}: ${product.name}`);
              onAdded?.();
            },
            onError: (error) => toast(errorMessage(error, t.errors), 'error'),
          }
        );
      }}
    >
      <CartIcon width={18} height={18} />
      {t.product.addToCart}
    </Button>
  );
}
