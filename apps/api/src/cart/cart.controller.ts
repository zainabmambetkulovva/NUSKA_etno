import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';

import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart() {
    // TODO: Get cart for authenticated user
    return { message: 'Get cart - to be implemented' };
  }

  @Post('items')
  addItem(@Body() addItemDto: { productId: string; quantity: number }) {
    // TODO: Add item to cart for authenticated user
    return { message: 'Add item - to be implemented' };
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    // TODO: Remove item from cart for authenticated user
    return { message: 'Remove item - to be implemented' };
  }

  @Patch('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() updateItemDto: { quantity: number }) {
    // TODO: Update item quantity in cart for authenticated user
    return { message: 'Update item - to be implemented' };
  }

  @Delete()
  clearCart() {
    // TODO: Clear cart for authenticated user
    return { message: 'Clear cart - to be implemented' };
  }
}
