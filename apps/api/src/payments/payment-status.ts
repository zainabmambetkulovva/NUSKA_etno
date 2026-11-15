import { PaymentStatus } from '@prisma/client';

/** Allowed payment status transitions. FAILED, CANCELLED and REFUNDED are final. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: [
    PaymentStatus.PROCESSING,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  PROCESSING: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
  PAID: [PaymentStatus.REFUNDED],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus) {
  return PAYMENT_TRANSITIONS[from].includes(to);
}
