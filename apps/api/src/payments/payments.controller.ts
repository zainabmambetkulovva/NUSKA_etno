import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  getPayments() {
    // TODO: Get payments for authenticated user
    return { message: 'Get payments - to be implemented' };
  }

  @Get(':id')
  getPaymentById(@Param('id') id: string) {
    // TODO: Get single payment by id
    return { message: 'Get payment by id - to be implemented' };
  }

  @Post('create')
  createPayment(@Body() createPaymentDto: any) {
    // TODO: Create payment for order
    return { message: 'Create payment - to be implemented' };
  }
}
