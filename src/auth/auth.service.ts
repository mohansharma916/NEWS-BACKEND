import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. Validate User (Check email & password)
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);

    console.log('Validating user:', user);
    
    // In production, use bcrypt.compare(pass, user.password)
    // For now, if you seeded with plain text, just compare strings. 
    // BUT recommended:
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result; // Return user without password
    }
    return null;
  }

  // 2. Login (Generate JWT)
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}