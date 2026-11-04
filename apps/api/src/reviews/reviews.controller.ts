import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  getReviews() {
    // TODO: Get reviews for product or user
    return { message: 'Get reviews - to be implemented' };
  }

  @Post()
  createReview(@Body() createReviewDto: any) {
    // TODO: Create review for authenticated user
    return { message: 'Create review - to be implemented' };
  }
}
