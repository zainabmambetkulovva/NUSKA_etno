import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Role(UserRole.ADMIN)
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Role(UserRole.ADMIN)
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('orders')
  @Role(UserRole.ADMIN)
  getOrders() {
    return this.adminService.getAllOrders();
  }
}
