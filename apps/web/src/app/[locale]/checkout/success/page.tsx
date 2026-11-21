'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { OrderReceipt, orderIdFrom } from '@/components/account/order-receipt';

/** "Order placed": /checkout/success?order=<id> (the id is found even if a payment page appended to it). */
function Success() {
  return <OrderReceipt id={orderIdFrom(useSearchParams().get('order'))} />;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}
