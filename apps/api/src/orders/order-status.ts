import { OrderStatus } from '@prisma/client';

/** Allowed order status transitions (TZ §12). COMPLETED and CANCELLED are final. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  READY_FOR_PICKUP: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

/** A customer may cancel only before the shop has confirmed the order. */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = [OrderStatus.PENDING];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
