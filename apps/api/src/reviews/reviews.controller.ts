import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user';

import { AdminReviewsQueryDto, CreateReviewDto, ModerateReviewDto } from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('products/:slug/reviews')
  listForProduct(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.reviews.listForProduct(slug, query.limit, query.offset);
  }

  @Post('reviews')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @Get('reviews/mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.reviews.listMine(user.id);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query() query: AdminReviewsQueryDto) {
    return this.reviews.adminList(query);
  }

  @Patch(':id')
  moderate(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto
  ) {
    return this.reviews.moderate(admin.id, id, dto);
  }
}
