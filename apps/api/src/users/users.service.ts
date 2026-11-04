import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { ChangePasswordDto } from '../auth/dto/auth.dto';
import { PasswordService } from '../auth/password.service';
import { AppError } from '../common/errors';
import { paginate } from '../common/utils/pagination';
import { normalizePhone } from '../common/utils/phone';
import { PrismaService } from '../prisma/prisma.service';

import { AdminUpdateUserDto, AdminUsersQueryDto, UpdateProfileDto } from './dto/users.dto';
import { toPublicUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName === undefined ? undefined : dto.lastName || null,
      locale: dto.locale,
    };
    if (dto.phone !== undefined) {
      if (dto.phone === null || dto.phone === '') {
        data.phone = null;
      } else {
        const phone = normalizePhone(dto.phone);
        if (!phone) throw AppError.badRequest('INVALID_PHONE', 'Phone number is not valid');
        data.phone = phone;
      }
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return toPublicUser(user);
  }

  /** Changes the password and ends all other sessions. */
  async changePassword(userId: string, currentSessionId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await this.passwords.verify(dto.currentPassword, user.passwordHash);
    if (!ok) throw AppError.badRequest('INVALID_CURRENT_PASSWORD', 'Current password is incorrect');

    const passwordHash = await this.passwords.hash(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.deleteMany({ where: { userId, id: { not: currentSessionId } } }),
    ]);
  }

  // --- Admin -------------------------------------------------------------

  async adminList(query: AdminUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: query.role,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(
      users.map((user) => ({ ...toPublicUser(user), ordersCount: user._count.orders })),
      total,
      query.limit,
      query.offset
    );
  }

  async adminGet(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });
    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'User not found');
    return { ...toPublicUser(user), orders: user.orders };
  }

  async adminUpdate(adminId: string, id: string, dto: AdminUpdateUserDto) {
    if (id === adminId && (dto.role !== undefined || dto.isActive === false)) {
      throw AppError.badRequest(
        'CANNOT_MODIFY_SELF',
        'You cannot change your own role or disable yourself'
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!before) throw AppError.notFound('USER_NOT_FOUND', 'User not found');

      const user = await tx.user.update({
        where: { id },
        data: { role: dto.role, isActive: dto.isActive },
      });
      if (dto.isActive === false || (dto.role && dto.role !== before.role)) {
        await tx.session.deleteMany({ where: { userId: id } });
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'user.update',
        entityType: 'User',
        entityId: id,
        metadata: {
          before: { role: before.role, isActive: before.isActive },
          after: { role: user.role, isActive: user.isActive },
        },
      });
      return toPublicUser(user);
    });
  }
}
