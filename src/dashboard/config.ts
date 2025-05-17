import dotenv from 'dotenv';

dotenv.config();

// 디스코드 OAuth2 설정
export const config = {
  // 서버 설정
  port: process.env.DASHBOARD_PORT || 3000,
  
  // 디스코드 OAuth2 설정
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    botToken: process.env.DISCORD_TOKEN || '',
    scope: ['identify', 'guilds']
  },
  
  // 세션 설정
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 24시간
    },
    resave: false,
    saveUninitialized: false
  },
  
  // 대시보드 URL
  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000'
}; 