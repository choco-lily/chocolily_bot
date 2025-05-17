import express from 'express';
import passport from 'passport';
import { config } from '../config';

const router = express.Router();

// 디스코드 로그인 라우트
router.get('/discord', passport.authenticate('discord'));

// 디스코드 OAuth 콜백 라우트
router.get('/discord/callback', 
  passport.authenticate('discord', {
    failureRedirect: '/'
  }), 
  (req, res) => {
    // 성공적으로 인증되면 대시보드로 리다이렉트
    res.redirect('/dashboard');
  }
);

// 로그아웃 라우트
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('로그아웃 중 오류 발생:', err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

export default router; 