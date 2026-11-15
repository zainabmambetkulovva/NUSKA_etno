'use client';

import { useState } from 'react';

import type { ProductDetail } from '@nuska/types';

import { AddToCartButton } from './add-to-cart-button';
import { FavoriteButton } from './favorite-button';
import { QuantityStepper } from './quantity-stepper';

import { useI18n } from '@/i18n/i18n-provider';

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(99, product.availableQuantity ?? 99);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {product.inStock && (
        <QuantityStepper
          value={quantity}
          max={max}
          onChange={setQuantity}
          label={t.product.quantity}
        />
      )}
      <AddToCartButton
        product={product}
        quantity={quantity}
        size="lg"
        onAdded={() => setQuantity(1)}
      />
      <FavoriteButton productId={product.id} className="h-12 w-12 border border-cream-dark" />
    </div>
  );
}
