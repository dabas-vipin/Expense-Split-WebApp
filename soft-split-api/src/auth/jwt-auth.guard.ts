// src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
    console.log('JwtAuthGuard constructor called');
  }

  canActivate(context: ExecutionContext) {
    console.log('JwtAuthGuard canActivate called');
    return super.canActivate(context);
  }
}