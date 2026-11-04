import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async createReview(
    userId: string,
    productId: string,
    orderItemId: string,
    rating: number,
    comment: string
  ) {
    return this.prisma.review.create({
      data: {
        userId,
        productId,
        orderItemId,
        rating,
        comment,
        status: 'PENDING',
      },
    });
  }

  async updateReview(userId: string, reviewId: string, data: any) {
    return this.prisma.review.update({
      where: { id: reviewId, userId },
      data,
    });
  }

  async deleteReview(userId: string, reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId, userId },
    });
  }
}
