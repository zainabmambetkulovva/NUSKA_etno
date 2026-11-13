import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { Request, Response } from 'express';

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

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin(req.user);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${error.message}`);
    }
  }
}
