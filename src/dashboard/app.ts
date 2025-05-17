import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from './config';
import dashboardRouter from './routes/dashboard';
import authRouter from './routes/auth';
import { isAuthenticated } from './middleware/auth';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileStore = require('session-file-store')(session);

const app = express();

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('view cache', false);
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.set('layout extractMetas', true);

// 미들웨어 설정
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// 세션 설정
app.use(session({
  store: new FileStore({
    path: path.join(__dirname, '../sessions'),
    ttl: 60 * 60 * 24, // 24시간
    retries: 1
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// Passport 설정
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Discord 전략 설정
passport.use(new DiscordStrategy({
  clientID: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackURL: `${config.dashboardUrl}/auth/discord/callback`,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile: any, done) => {
  return done(null, profile);
}));

// 템플릿에서 사용할 전역 변수
app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  res.locals.user = req.user || null;
  res.locals.config = config;
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://stackpath.bootstrapcdn.com; ` +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://stackpath.bootstrapcdn.com; " +
    "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "img-src 'self' data: https://cdn.discordapp.com https://i.ibb.co"
  );
  next();
});

// 라우터 설정
app.use('/dashboard', isAuthenticated, dashboardRouter);
app.use('/auth', authRouter);

// 메인 페이지
app.get('/', (req, res) => {
  res.render('index', {
    title: '쵸코릴리봇 대시보드',
    user: req.user || null,
    config
  });
});

// 404 오류 처리
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).render('error', {
      error: '페이지를 찾을 수 없습니다.',
      user: req.user || null,
      config
    });
  }
});

// 오류 처리
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(err.status || 500).render('error', {
      error: err.message || '서버 오류가 발생했습니다.',
      user: req.user || null,
      config
    });
  }
});

// 서버 시작
const port = process.env.DASHBOARD_PORT || 3000;
const dashboardStartTime = parseInt(process.env.DASHBOARD_START_TIME || '0');
const startTime = Date.now() - dashboardStartTime;

app.listen(port, () => {
  console.log(`✅ 대시보드 서버가 시작되었습니다! - 시작 시간: ${startTime}ms`);
});

export default app; 