import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NUSKA_etno API is running';
  }

  getHealth(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
