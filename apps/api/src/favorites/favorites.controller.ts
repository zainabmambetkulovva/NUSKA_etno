import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';

import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites() {
    // TODO: Get favorites for authenticated user
    return { message: 'Get favorites - to be implemented' };
  }

  @Post(':productId')
  addToFavorites(@Param('productId') productId: string) {
    // TODO: Add product to favorites for authenticated user
    return { message: 'Add to favorites - to be implemented' };
  }

  @Delete(':productId')
  removeFromFavorites(@Param('productId') productId: string) {
    // TODO: Remove product from favorites for authenticated user
    return { message: 'Remove from favorites - to be implemented' };
  }
}
