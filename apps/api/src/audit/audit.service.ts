import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { DbClient } from '../prisma/prisma.types';

export interface AuditEntry {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/** Records important admin actions (DATABASE.md §15). Call inside the same transaction as the change. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(db: DbClient, entry: AuditEntry) {
    return db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
      },
    });
  }

  async list(query: PaginationQueryDto & { entityType?: string; entityId?: string }) {
    const where: Prisma.AuditLogWhereInput = {
      entityType: query.entityType,
      entityId: query.entityId,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(rows, total, query.limit, query.offset);
  }
}
