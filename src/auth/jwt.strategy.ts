import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'DO_NOT_USE_THIS_IN_PROD', // Use ENV var!
    });
  }

  async validate(payload: any) {
    // This object is injected into the Request object (req.user)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}