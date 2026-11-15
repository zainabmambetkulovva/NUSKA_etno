import { OrderStatus } from '@prisma/client';

import { canTransition, ORDER_TRANSITIONS } from './order-status';

describe('order status transitions', () => {
  it('follows the pickup flow', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.PREPARING)).toBe(true);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP)).toBe(true);
    expect(canTransition(OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED)).toBe(true);
  });

  it('does not skip steps or go back', () => {
    expect(canTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toBe(false);
    expect(canTransition(OrderStatus.PREPARING, OrderStatus.CONFIRMED)).toBe(false);
  });

  it('treats COMPLETED and CANCELLED as final', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('allows cancelling any non-final order', () => {
    for (const status of [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ]) {
      expect(canTransition(status, OrderStatus.CANCELLED)).toBe(true);
    }
  });
});
