import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register() {
    // TODO: Implement registration
    return { message: 'Registration endpoint - to be implemented' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login() {
    // TODO: Implement login
    return { message: 'Login endpoint - to be implemented' };
  }

  @Post('refresh')
  refreshToken() {
    // TODO: Implement refresh token
    return { message: 'Refresh token endpoint - to be implemented' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // TODO: Implement logout
    return { message: 'Logout endpoint - to be implemented' };
  }
}
