'use client';

import Link from 'next/link';

import { OrnamentLoader } from '@/components/brand/ornament';
import { ProductImage } from '@/components/product/product-image';
import { QuantityStepper } from '@/components/product/quantity-stepper';
import { ButtonLink } from '@/components/ui/button';
import { TrashIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/misc';
import { useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { errorMessage } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { useToast } from '@/stores/toast';

export default function CartPage() {
  const { t, locale } = useI18n();
  const cart = useCart();
  const toast = useToast((s) => s.show);
  const onError = (error: unknown) => toast(errorMessage(error, t.errors), 'error');

  if (cart.loading) return <OrnamentLoader label={t.common.loading} className="py-24" />;

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-4xl font-semibold">{t.cart.title}</h1>
      {cart.lines.length === 0 ? (
        <EmptyState
          title={t.cart.empty}
          action={<ButtonLink href={`/${locale}/catalog`}>{t.cart.toCatalog}</ButtonLink>}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {(cart.needsFix || cart.removedMissing) && (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-2xl border border-honey/60 bg-[#FFF7E6] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-semibold text-ink">{t.cart.attention}</p>
                  {cart.blocked && <p className="text-ink-muted">{t.cart.attentionBlocking}</p>}
                  {cart.priceChanged && <p className="text-ink-muted">{t.cart.attentionPrice}</p>}
                  {cart.removedMissing && <p className="text-ink-muted">{t.cart.removedMissing}</p>}
                </div>
                {cart.needsFix && (
                  <button
                    type="button"
                    onClick={() =>
                      cart.fix.mutate(undefined, {
                        onSuccess: () => toast(t.cart.fixed),
                        onError,
                      })
                    }
                    disabled={cart.fix.isPending}
                    className="btn-forest shrink-0 px-5 py-2.5 text-sm"
                  >
                    {t.cart.fix}
                  </button>
                )}
              </div>
            )}
            <ul className="space-y-4">
              {cart.lines.map((line) => (
                <li key={line.productId} className="card flex gap-4 p-4">
                  <Link href={`/${locale}/product/${line.product.slug}`} className="shrink-0">
                    <ProductImage
                      url={line.product.image?.url}
                      slug={line.product.slug}
                      alt={line.product.image?.alt}
                      name={line.product.name}
                      sizes="96px"
                      className="h-24 w-24 rounded-xl"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/${locale}/product/${line.product.slug}`}
                        className="font-serif text-lg font-semibold hover:text-brand"
                      >
                        {line.product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => cart.remove.mutate(line.productId, { onError })}
                        className="rounded-full p-2 text-ink-soft hover:bg-cream-50 hover:text-danger"
                        aria-label={`${t.cart.remove}: ${line.product.name}`}
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    </div>
                    <span className="text-sm text-ink-muted">
                      {formatMoney(line.product.price, locale, t.common.som)}
                    </span>
                    {line.issue === 'UNAVAILABLE' && (
                      <p className="text-sm text-danger">{t.cart.issues.UNAVAILABLE}</p>
                    )}
                    {line.issue === 'INSUFFICIENT_STOCK' && (
                      <p className="text-sm text-danger">
                        {line.available
                          ? t.cart.onlyLeft.replace('{n}', String(line.available))
                          : t.cart.soldOut}
                      </p>
                    )}
                    {line.previousPrice && (
                      <p className="text-sm text-honey-dark">
                        {t.cart.priceWas
                          .replace('{old}', formatMoney(line.previousPrice, locale, t.common.som))
                          .replace('{new}', formatMoney(line.product.price, locale, t.common.som))}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        max={Math.max(1, Math.min(99, line.available ?? 99))}
                        label={t.product.quantity}
                        disabled={cart.setQuantity.isPending || line.issue === 'UNAVAILABLE'}
                        onChange={(quantity) =>
                          cart.setQuantity.mutate(
                            { productId: line.productId, quantity },
                            { onError }
                          )
                        }
                      />
                      <span className="font-semibold">
                        {formatMoney(line.lineTotal, locale, t.common.som)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
            <div className="flex justify-between text-ink-muted">
              <span>
                {cart.count} {t.cart.items}
              </span>
            </div>
            <div className="space-y-2 border-t border-cream-dark/60 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">{t.cart.subtotal}</span>
                <span>{formatMoney(cart.subtotal, locale, t.common.som)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-muted">{t.cart.delivery}</span>
                <span className="text-right text-ink-soft">{t.cart.deliveryLater}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-cream-dark/60 pt-4">
              <span className="font-medium">{t.cart.total}</span>
              <span className="text-2xl font-semibold text-brand-dark">
                {formatMoney(cart.subtotal, locale, t.common.som)}
              </span>
            </div>
            {cart.blocked && <p className="text-xs text-danger">{t.cart.attentionBlocking}</p>}
            {cart.signedIn ? (
              <ButtonLink
                href={`/${locale}/checkout`}
                size="lg"
                className="w-full"
                aria-disabled={!cart.canCheckout}
                onClick={(e) => !cart.canCheckout && e.preventDefault()}
              >
                {t.cart.checkout}
              </ButtonLink>
            ) : (
              <ButtonLink
                href={`/${locale}/login?next=/${locale}/checkout`}
                size="lg"
                className="w-full"
              >
                {t.cart.loginToCheckout}
              </ButtonLink>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
