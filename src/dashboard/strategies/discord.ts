import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from '../config';
import { saveUser } from '../../utils/database';

// 디스코드 인증 전략 설정
passport.use(new DiscordStrategy({
  clientID: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackURL: config.discord.callbackUrl,
  scope: ['identify', 'guilds']
}, async (
  accessToken: string,
  refreshToken: string,
  profile: DiscordStrategy.Profile,
  done: (error: any, user?: any) => void
) => {
  try {
    // 사용자 정보와 서버 목록을 함께 저장
    const user = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      guilds: profile.guilds || []
    };
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

// 세션에 사용자 정보 직렬화
passport.serializeUser((user, done) => {
  done(null, user);
});

// 세션에서 사용자 정보 역직렬화
passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

export default passport; 