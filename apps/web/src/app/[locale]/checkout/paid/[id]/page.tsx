'use client';

import { use } from 'react';

import { OrderReceipt, orderIdFrom } from '@/components/account/order-receipt';

/** Where Finik returns the customer after paying: /checkout/paid/<order id> (no query string). */
export default function CheckoutPaidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderReceipt id={orderIdFrom(id)} />;
}
