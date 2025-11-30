import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'generated/prisma/enums';
import { ROLES_KEY } from '../decorators/role.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the required roles from the route metadata (the @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If no specific roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // 3. Get the user object (attached by the JwtAuthGuard previously)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if the user exists and has the right role
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}