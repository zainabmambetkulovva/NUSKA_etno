'use client';

import type { AdminProduct } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { AdminTitle } from '@/components/admin/admin-ui';
import { ProductForm } from '@/components/admin/product-form';
import { ImagesPanel, StockPanel } from '@/components/admin/product-stock-images';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

export default function EditProductPage() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const product = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api<AdminProduct>(`/admin/products/${id}`),
  });
  const remove = useMutation({
    mutationFn: () => api(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => router.replace(`/${locale}/admin/products`),
    onError: (error) => toast(errorMessage(error, t.errors), 'error'),
  });

  if (product.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!product.data) return <ErrorBox>{errorMessage(product.error, t.errors)}</ErrorBox>;
  const p = product.data;
  const name = p.translations.find((x) => x.locale === locale)?.name ?? p.sku;

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/admin/products`} className="text-sm text-brand hover:underline">
        ← {t.admin.products}
      </Link>
      <AdminTitle
        action={
          <div className="flex gap-2">
            {p.status === 'ACTIVE' && (
              <Link
                href={`/${locale}/product/${p.slug}`}
                target="_blank"
                className="text-sm text-brand hover:underline"
              >
                ↗ {t.admin.toSite}
              </Link>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={remove.isPending}
              onClick={() => window.confirm(t.admin.deleteConfirm) && remove.mutate()}
            >
              {t.common.delete}
            </Button>
          </div>
        }
      >
        {name}
      </AdminTitle>
      <StockPanel product={p} />
      <ImagesPanel product={p} />
      <ProductForm
        key={p.updatedAt}
        product={p}
        onSaved={(saved) => {
          queryClient.setQueryData(['admin', 'product', id], saved);
          void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
          toast(t.common.saved);
        }}
      />
    </div>
  );
}
