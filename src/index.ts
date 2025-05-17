import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { loadEvents } from './utils/loadEvents';
import { config } from './dashboard/config';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// 시작 시간 측정
const startTime = Date.now();

// .env 파일 로드
dotenv.config();

// 토큰 확인
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ 디스코드 토큰이 설정되지 않았습니다. .env 파일을 확인해주세요.');
  process.exit(1);
}

// 클라이언트 설정
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// 명령어 컬렉션 초기화
client.commands = new Collection();

// 명령어 등록
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// 이벤트 핸들러 로드
loadEvents(client).then(() => {
  // 디스코드에 로그인
  client.login(token).then(() => {
    const botStartTime = Date.now() - startTime;
    console.log(`✅ 디스코드 봇이 시작되었습니다! 봇 계정: ${client.user?.username} (${client.user?.tag}) - 시작 시간: ${botStartTime}ms`);

    // 봇이 시작된 후에 대시보드 서버 시작
    const dashboardStartTime = Date.now();
    const { spawn } = require('child_process');
    const nodemon = spawn('npx', ['nodemon', '--watch', 'src/dashboard', '--ext', 'ts,js', '--ignore', 'src/dashboard/views/**/*.ejs', '--exec', 'ts-node', 'src/dashboard/app.ts'], {
      stdio: 'inherit',
      shell: true,
      env: { 
        ...process.env, 
        DASHBOARD_PORT: process.env.DASHBOARD_PORT || '3000',
        DASHBOARD_START_TIME: dashboardStartTime.toString()
      }
    });

    nodemon.on('error', (error: Error) => {
      console.error('❌ 대시보드 서버 시작 실패:', error);
    });

    // 봇이 종료될 때 대시보드 서버도 종료
    process.on('SIGINT', () => {
      nodemon.kill();
      process.exit();
    });
  }).catch(error => {
    console.error('❌ 디스코드 봇 로그인 실패:', error);
    process.exit(1);
  });
});

// TypeScript 타입 선언
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
} 