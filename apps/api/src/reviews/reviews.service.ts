import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, ReviewStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PRODUCT_WHERE } from '../products/products.service';

import { AdminReviewsQueryDto, CreateReviewDto, ModerateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  /** Approved reviews only. The author is shown by first name and the initial of the last name. */
  async listForProduct(slug: string, limit: number, offset: number) {
    const product = await this.prisma.product.findFirst({
      where: { slug, ...PUBLIC_PRODUCT_WHERE },
      select: { id: true },
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    const where = { productId: product.id, status: ReviewStatus.APPROVED };
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        author: [r.user.firstName, r.user.lastName ? `${r.user.lastName[0]}.` : null]
          .filter(Boolean)
          .join(' '),
      })),
      total,
      limit,
      offset
    );
  }

  /** A review is allowed for an item of the user's own completed order, once per item. */
  async create(userId: string, dto: CreateReviewDto) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: dto.orderItemId, order: { userId } },
      include: { order: { select: { status: true } }, review: { select: { id: true } } },
    });
    if (!item) throw AppError.notFound('ORDER_ITEM_NOT_FOUND', 'Order item not found');
    if (item.order.status !== OrderStatus.COMPLETED) {
      throw AppError.conflict(
        'ORDER_NOT_COMPLETED',
        'You can review a product after receiving the order'
      );
    }
    if (!item.productId)
      throw AppError.conflict('PRODUCT_UNAVAILABLE', 'This product no longer exists');
    if (item.review)
      throw AppError.conflict('ALREADY_REVIEWED', 'You have already reviewed this purchase');

    try {
      return await this.prisma.review.create({
        data: {
          userId,
          productId: item.productId,
          orderItemId: item.id,
          rating: dto.rating,
          comment: dto.comment || null,
          status: ReviewStatus.PENDING,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppError.conflict('ALREADY_REVIEWED', 'You have already reviewed this purchase');
      }
      throw error;
    }
  }

  listMine(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItem: { select: { productName: true, orderId: true } } },
    });
  }

  async adminList(query: AdminReviewsQueryDto) {
    const where = { status: query.status };
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          orderItem: { select: { productName: true, productSku: true, orderId: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(reviews, total, query.limit, query.offset);
  }

  async moderate(adminId: string, id: string, dto: ModerateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id } });
      if (!review) throw AppError.notFound('REVIEW_NOT_FOUND', 'Review not found');
      const updated = await tx.review.update({ where: { id }, data: { status: dto.status } });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'review.moderate',
        entityType: 'Review',
        entityId: id,
        metadata: { from: review.status, to: dto.status },
      });
      return updated;
    });
  }
}
