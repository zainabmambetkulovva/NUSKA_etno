import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        pickupLocation: true,
      },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        pickupLocation: true,
      },
    });
  }

  async createOrder(userId: string, orderData: any) {
    // TODO: Implement order creation with stock management
    return { message: 'Order created' };
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
  }
}
