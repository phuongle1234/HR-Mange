import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../repository/user.repository';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { AppConfig } from '../../../config/configuration';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Validates the Bearer JWT and re-checks the user is still active on every
 * request - this is the entire authorization model for this phase
 * (WORK-000 decision #2): no roles, no permissions, just "valid token +
 * active user".
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig>,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.accessSecret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
