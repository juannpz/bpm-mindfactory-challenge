import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../decorators';
import { OidcService } from '@infrastructure/auth/oidc.service';
import type { FastifyRequest } from 'fastify';

@ApiTags('.well-known')
@Controller('.well-known')
export class OidcController {
  constructor(private readonly oidcService: OidcService) {}

  @Public()
  @Get('jwks.json')
  @ApiOperation({
    summary: 'JWKS — JSON Web Key Set para validación de tokens OIDC',
  })
  getJwks() {
    return this.oidcService.getJwks();
  }

  @Public()
  @Get('openid-configuration')
  @ApiOperation({
    summary: 'OpenID Connect Discovery — metadata del IdP emulado',
  })
  getOpenIdConfig(@Req() req: FastifyRequest) {
    const protocol = req.protocol || 'http';
    const host = req.headers.host || 'localhost:3001';
    const baseUrl = `${protocol}://${host}/api`;
    return this.oidcService.getOidcConfig(baseUrl);
  }
}
