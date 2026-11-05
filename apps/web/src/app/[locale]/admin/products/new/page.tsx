'use client';

import { useRouter } from 'next/navigation';

import { AdminTitle } from '@/components/admin/admin-ui';
import { ProductForm } from '@/components/admin/product-form';
import { useI18n } from '@/i18n/i18n-provider';
import { useToast } from '@/stores/toast';

export default function NewProductPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  return (
    <div>
      <AdminTitle>{t.admin.newProduct}</AdminTitle>
      <ProductForm
        onSaved={(p) => (
          toast(t.common.saved),
          router.replace(`/${locale}/admin/products/${p.id}`)
        )}
      />
    </div>
  );
}
