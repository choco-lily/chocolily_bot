import app from './app';

// 대시보드 서버 시작
console.log('쵸코릴리봇 대시보드를 시작합니다...');

const port = process.env.DASHBOARD_PORT || 3000;
app.listen(port, () => {
  console.log(`✅ 대시보드 서버가 포트 ${port}에서 실행 중입니다.`);
}); 