import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
    constructor() {
        super({
            clientID: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/microsoft/callback`,
            scope: ['user.read'],
            authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
        const email =
            profile.emails?.[0]?.value ||
            profile._json?.mail ||
            profile._json?.userPrincipalName;
        const name = profile.displayName || 'ผู้ใช้ Microsoft';

        done(null, { email, name });
    }
}