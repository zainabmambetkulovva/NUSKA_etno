import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getOrders() {
    // TODO: Get orders for authenticated user
    return { message: 'Get orders - to be implemented' };
  }

  @Get(':id')
  getOrderByid(@Param('id') id: string) {
    // TODO: Get single order by id
    return { message: 'Get order by id - to be implemented' };
  }

  @Post()
  createOrder(@Body() createOrderDto: any) {
    // TODO: Create order for authenticated user
    return { message: 'Create order - to be implemented' };
  }
}
