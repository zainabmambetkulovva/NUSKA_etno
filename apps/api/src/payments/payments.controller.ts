import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

import { PaymentsService } from './payments.service';

class AdminPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

/** Customers see their payments inside GET /orders/:id. */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@Query() query: AdminPaymentsQueryDto) {
    return this.payments.adminList(query);
  }
}
