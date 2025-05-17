import express from 'express';
import { getEnabledCommands, setCommandEnabledStatus, getGameRankings, calculateWinRate } from '../../utils/database';
import { isAuthenticated } from '../middleware/auth';
import fetch from 'node-fetch';
import { config } from '../config';
import { REST, Routes } from 'discord.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 정적 파일 제공 설정
router.use('/assets', express.static(path.join(__dirname, '../../asset')));

// 대시보드 메인 페이지
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    
    // 봇이 있는 서버와 없는 서버 구분
    const botGuilds = await fetchBotGuilds();
    const userGuilds = user?.guilds || [];
    
    // 관리자 권한이 있는 서버만 필터링
    const adminGuilds = userGuilds.filter(guild => {
      const permissions = BigInt(guild.permissions);
      return (permissions & BigInt(0x20)) === BigInt(0x20); // ADMINISTRATOR 권한 체크
    });
    
    const guildsWithBot = adminGuilds.filter(guild => botGuilds.has(guild.id));
    const guildsWithoutBot = adminGuilds.filter(guild => !botGuilds.has(guild.id));
    
    res.render('dashboard/index', { 
      title: '대시보드',
      user, 
      guildsWithBot,
      guildsWithoutBot,
      config
    });
  } catch (error) {
    console.error('대시보드 렌더링 중 오류:', error);
    res.status(500).render('error', { error: '서버 오류가 발생했습니다.' });
  }
});

// 봇이 있는 서버 목록 가져오기
async function fetchBotGuilds() {
  const response = await fetch('https://discord.com/api/v9/users/@me/guilds', {
    headers: {
      Authorization: `Bot ${config.discord.botToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`봇 서버 목록을 가져오는 중 오류 발생: ${response.status}`);
  }
  
  const guilds = await response.json();
  return new Map(guilds.map((guild: any) => [guild.id, guild]));
}

// 특정 서버의 대시보드
router.get('/server/:guildId', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.params;
    const user = req.user;
    
    // 사용자가 해당 서버의 관리자인지 확인
    const guild = user!.guilds.find(g => g.id === guildId);
    if (!guild) {
      return res.status(403).render('error', { error: '이 서버에 대한 접근 권한이 없습니다.' });
    }
    
    const permissions = BigInt(guild.permissions);
    if ((permissions & BigInt(0x20)) !== BigInt(0x20)) {
      return res.status(403).render('error', { error: '이 서버를 관리할 권한이 없습니다.' });
    }
    
    // 서버 정보 가져오기
    const guildInfo = await fetchGuildInfo(guildId);
    
    // 활성화된 명령어 목록 가져오기
    const enabledCommands = await getEnabledCommands(guildId);
    
    // 명령어 파일 목록 가져오기
    const commandFiles = getAllCommands();
    
    res.render('server', {
      title: `${guildInfo.name} 서버 설정`,
      user,
      guild: guildInfo,
      enabledCommands,
      commands: commandFiles,
      dashboardUrl: config.dashboardUrl
    });
  } catch (error) {
    console.error('서버 대시보드 렌더링 중 오류:', error);
    res.status(500).render('error', { error: '서버 오류가 발생했습니다.' });
  }
});

// 길드의 슬래시 커맨드를 동기화하는 함수
async function syncGuildCommands(guildId: string) {
  // DB에서 활성화된 명령어 목록 가져오기
  const enabledCommands = await getEnabledCommands(guildId);
  // 개발/운영 환경에 따라 명령어 파일 경로와 확장자 분기
  const isProd = process.env.NODE_ENV === 'production';
  const commandsPath = isProd
    ? path.join(__dirname, '../../dist/commands')
    : path.join(__dirname, '../../commands');
  const ext = isProd ? '.js' : '.ts';
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(ext));
  const commands = [];
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if (enabledCommands.includes(command.data.name)) {
        commands.push(command.data.toJSON());
      }
    } catch (err) {
      console.error(`[명령어 require 실패] ${file}:`, err);
    }
  }

  if (commands.length === 0) {
    console.log(`[동기화] ${guildId} 길드에 활성화된 명령어가 없습니다.`);
  }

  // REST API 인스턴스 생성
  const rest = new REST({ version: '10' }).setToken(config.discord.botToken);
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, guildId),
      { body: commands }
    );
    console.log(`✅ [동기화] ${guildId} 길드의 슬래시 커맨드가 갱신되었습니다. (${commands.length}개)`);
  } catch (error) {
    console.error('❌ 슬래시 커맨드 동기화 중 오류:', error);
  }
}

// 명령어 활성화/비활성화 API
router.post('/server/:guildId/commands', isAuthenticated, async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;
    const { command, enabled } = req.body;
    const user = req.user;
    
    // 사용자가 해당 서버의 관리자인지 확인
    const guild = user!.guilds.find(g => g.id === guildId);
    if (!guild) {
      res.status(403).json({ error: '이 서버에 대한 접근 권한이 없습니다.' });
      return;
    }
    
    const permissions = BigInt(guild.permissions);
    if ((permissions & BigInt(0x20)) !== BigInt(0x20)) {
      res.status(403).json({ error: '이 서버를 관리할 권한이 없습니다.' });
      return;
    }

    // 명령어 활성화/비활성화
    await setCommandEnabledStatus(
      guildId,
      command,
      enabled === 'true',
      guild.name,
      guild?.icon ?? undefined,
      undefined // joined는 알 수 없으니 undefined
    );
    
    // 현재 활성화된 명령어 목록 가져오기
    const enabledCommands = await getEnabledCommands(guildId);
    
    res.json({ 
      success: true,
      enabledCommands 
    });
  } catch (error) {
    console.error('명령어 설정 변경 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 명령어 동기화 API
router.post('/server/:guildId/sync-commands', isAuthenticated, async (req, res): Promise<void> => {
  try {
    const { guildId } = req.params;
    const { enabledCommands } = req.body;
    const user = req.user;
    
    // 사용자가 해당 서버의 관리자인지 확인
    const userGuild = user!.guilds.find(g => g.id === guildId);
    if (!userGuild) {
      res.status(403).json({ error: '이 서버에 대한 접근 권한이 없습니다.' });
      return;
    }
    
    const permissions = BigInt(userGuild.permissions);
    if ((permissions & BigInt(0x20)) !== BigInt(0x20)) {
      res.status(403).json({ error: '이 서버를 관리할 권한이 없습니다.' });
      return;
    }

    // DB 업데이트
    for (const command of enabledCommands) {
      await setCommandEnabledStatus(
        guildId,
        command,
        true,
        userGuild.name,
        userGuild?.icon ?? undefined,
        undefined
      );
    }

    // Discord API 동기화
    await syncGuildCommands(guildId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('명령어 동기화 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 봇 이미지 및 승률 정보
const BOT_INFO = {
  miku: {
    name: '미쿠',
    avatarURL: 'https://i.ibb.co/jvWJ4vHs/miku.jpg'
  },
  teto: {
    name: '테토',
    avatarURL: 'https://i.ibb.co/Y4JRpJGf/teto.jpg'
  },
  kafu: {
    name: '카후',
    avatarURL: 'https://i.ibb.co/d4GzDd4s/kafu.png'
  }
};

// 랭킹 페이지
router.get('/rankings/:game', async (req, res) => {
  try {
    const { game } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // 게임 랭킹 가져오기
    const rankings = await getGameRankings(game, limit);
    
    // 사용자 정보 가져오기
    const userInfoPromises = rankings.map(async (ranking) => {
      try {
        // 봇인 경우
        if (ranking.userId === 'miku' || ranking.userId === 'teto' || ranking.userId === 'kafu') {
          const bot = BOT_INFO[ranking.userId];
          return {
            ...ranking,
            username: bot.name,
            avatarURL: bot.avatarURL
          };
        }
        
        // 일반 사용자인 경우
        const userInfo = await fetchUserInfo(ranking.userId);
        return {
          ...ranking,
          username: userInfo.username,
          avatarURL: userInfo.avatar 
            ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
      } catch (error) {
        return {
          ...ranking,
          username: '알 수 없는 사용자',
          avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
      }
    });
    
    const rankingsWithUserInfo = await Promise.all(userInfoPromises);
    
    res.render('rankings', {
      game,
      rankings: rankingsWithUserInfo,
      user: req.user || null,
      dashboardUrl: config.dashboardUrl,
      calculateWinRate
    });
  } catch (error) {
    console.error('랭킹 페이지 렌더링 중 오류:', error);
    res.status(500).render('error', { error: '서버 오류가 발생했습니다.' });
  }
});

// 디스코드 API에서 서버 정보 가져오기
async function fetchGuildInfo(guildId: string): Promise<any> {
  const response = await fetch(`https://discord.com/api/v9/guilds/${guildId}`, {
    headers: {
      Authorization: `Bot ${config.discord.botToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`서버 정보를 가져오는 중 오류 발생: ${response.status}`);
  }
  
  return await response.json();
}

// 디스코드 API에서 사용자 정보 가져오기
async function fetchUserInfo(userId: string): Promise<any> {
  const response = await fetch(`https://discord.com/api/v9/users/${userId}`, {
    headers: {
      Authorization: `Bot ${config.discord.botToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`사용자 정보를 가져오는 중 오류 발생: ${response.status}`);
  }
  
  return await response.json();
}

// 모든 명령어 목록 가져오기
function getAllCommands(): string[] {
  try {
    const commandsPath = path.join(__dirname, '../../commands');
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.ts'))
      .map(file => {
        const command = require(path.join(commandsPath, file.replace('.ts', '')));
        return command.data?.name || file.replace('.ts', '');
      });
    return commandFiles;
  } catch (error) {
    console.error('명령어 목록을 가져오는 중 오류:', error);
    return [];
  }
}

export default router; 