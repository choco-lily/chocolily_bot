import * as fs from 'fs';
import * as path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// 데이터베이스 타입 정의
interface User {
  id: string;
  username: string;
  discriminator: string;
  avatarURL: string;
  joined: Date;
}

interface Guild {
  id: string;
  name: string;
  iconURL: string;
  joined: Date;
  enabledCommands: string[];
}

interface Rating {
  userId: string;
  game: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  lastPlayed: Date;
}

interface GameResult {
  id: string;
  game: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null; // null인 경우 무승부
  player1RatingBefore: number;
  player1RatingAfter: number;
  player2RatingBefore: number;
  player2RatingAfter: number;
  date: Date;
}

interface DatabaseSchema {
  users: User[];
  guilds: Guild[];
  ratings: Rating[];
  gameResults: GameResult[];
}

// 데이터베이스 디렉토리 확인 및 생성
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 각 데이터 파일 경로
const usersFile = path.join(dbDir, 'users.json');
const guildsFile = path.join(dbDir, 'guilds.json');
const ratingsFile = path.join(dbDir, 'ratings.json');
const gameResultsFile = path.join(dbDir, 'gameResults.json');

// 각 데이터베이스 어댑터 및 인스턴스
const usersAdapter = new JSONFile<User[]>(usersFile);
const guildsAdapter = new JSONFile<Guild[]>(guildsFile);
const ratingsAdapter = new JSONFile<Rating[]>(ratingsFile);
const gameResultsAdapter = new JSONFile<GameResult[]>(gameResultsFile);

export const usersDb = new Low<{ data: User[] }>(usersAdapter as any, { data: [] });
export const guildsDb = new Low<{ data: Guild[] }>(guildsAdapter as any, { data: [] });
export const ratingsDb = new Low<{ data: Rating[] }>(ratingsAdapter as any, { data: [] });
export const gameResultsDb = new Low<{ data: GameResult[] }>(gameResultsAdapter as any, { data: [] });

// 각 데이터베이스 초기화
(async () => {
  if (!fs.existsSync(usersFile)) await usersDb.write();
  if (!fs.existsSync(guildsFile)) await guildsDb.write();
  if (!fs.existsSync(ratingsFile)) await ratingsDb.write();
  if (!fs.existsSync(gameResultsFile)) await gameResultsDb.write();
  await usersDb.read();
  await guildsDb.read();
  await ratingsDb.read();
  await gameResultsDb.read();
})();

// ELO 레이팅 계산 함수
export function calculateEloRating(
  winnerRating: number, 
  loserRating: number, 
  isDraw = false
): { winnerNewRating: number; loserNewRating: number } {
  const K = 32; // K 팩터: 레이팅 변동의 최대값
  
  // 기대 승률 계산
  const winnerExpected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const loserExpected = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  let winnerNewRating: number;
  let loserNewRating: number;
  
  if (isDraw) {
    // 무승부의 경우 결과는 0.5
    winnerNewRating = Math.round(winnerRating + K * (0.5 - winnerExpected));
    loserNewRating = Math.round(loserRating + K * (0.5 - loserExpected));
  } else {
    // 승패가 결정된 경우
    winnerNewRating = Math.round(winnerRating + K * (1 - winnerExpected));
    loserNewRating = Math.round(loserRating + K * (0 - loserExpected));
  }
  
  return { winnerNewRating, loserNewRating };
}

// 사용자 레이팅 가져오기
export async function getUserRating(userId: string, game: string): Promise<Rating> {
  await ratingsDb.read();
  
  let rating = ratingsDb.data.data.find(r => r.userId === userId && r.game === game);
  
  if (!rating) {
    // 새 사용자는 1000 레이팅으로 시작
    rating = {
      userId,
      game,
      rating: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      lastPlayed: new Date()
    };
    
    ratingsDb.data.data.push(rating);
    await ratingsDb.write();
  }
  
  return rating;
}

// 게임 결과 기록 및 레이팅 업데이트
export async function recordGameResult(
  game: string,
  player1Id: string,
  player2Id: string,
  winnerId: string | null // null인 경우 무승부
): Promise<{ player1Rating: Rating; player2Rating: Rating; player1RatingBefore: number; player2RatingBefore: number }> {
  await ratingsDb.read();
  
  // 플레이어 레이팅 가져오기
  const player1Rating = await getUserRating(player1Id, game);
  const player2Rating = await getUserRating(player2Id, game);
  
  const player1RatingBefore = player1Rating.rating;
  const player2RatingBefore = player2Rating.rating;
  
  // 무승부 여부 확인
  const isDraw = winnerId === null;
  
  // 승자와 패자 결정
  let winnerRating, loserRating, winnerRatingBefore, loserRatingBefore, winnerId2, loserId;
  
  if (isDraw) {
    // 무승부인 경우
    player1Rating.draws += 1;
    player2Rating.draws += 1;
    
    const result = calculateEloRating(player1Rating.rating, player2Rating.rating, true);
    player1Rating.rating = result.winnerNewRating;
    player2Rating.rating = result.loserNewRating;
    
    winnerId2 = null;
    loserId = null;
    winnerRating = player1Rating;
    loserRating = player2Rating;
    winnerRatingBefore = player1RatingBefore;
    loserRatingBefore = player2RatingBefore;
  } else {
    // 승패가 결정된 경우
    if (winnerId === player1Id) {
      // 사용자가 이긴 경우
      player1Rating.wins += 1;
      player2Rating.losses += 1;
      
      const result = calculateEloRating(player1Rating.rating, player2Rating.rating);
      player1Rating.rating = result.winnerNewRating;
      player2Rating.rating = result.loserNewRating;
      
      winnerId2 = player1Id;
      loserId = player2Id;
      winnerRating = player1Rating;
      loserRating = player2Rating;
      winnerRatingBefore = player1RatingBefore;
      loserRatingBefore = player2RatingBefore;
    } else {
      // 봇이 이긴 경우
      player1Rating.losses += 1;
      player2Rating.wins += 1;
      
      const result = calculateEloRating(player2Rating.rating, player1Rating.rating);
      player2Rating.rating = result.winnerNewRating;
      player1Rating.rating = result.loserNewRating;
      
      winnerId2 = player2Id;
      loserId = player1Id;
      winnerRating = player2Rating;
      loserRating = player1Rating;
      winnerRatingBefore = player2RatingBefore;
      loserRatingBefore = player1RatingBefore;
    }
  }
  
  // 마지막 플레이 시간 업데이트
  player1Rating.lastPlayed = new Date();
  player2Rating.lastPlayed = new Date();
  
  // 게임 결과 기록
  const gameResult: GameResult = {
    id: Date.now().toString(),
    game,
    player1Id,
    player2Id,
    winnerId: winnerId,
    player1RatingBefore,
    player1RatingAfter: player1Rating.rating,
    player2RatingBefore: player2RatingBefore,
    player2RatingAfter: player2Rating.rating,
    date: new Date()
  };
  
  gameResultsDb.data.data.push(gameResult);
  
  // 데이터베이스 저장
  await ratingsDb.read();
  const existingRating1 = ratingsDb.data.data.find(r => r.userId === player1Id && r.game === game);
  const existingRating2 = ratingsDb.data.data.find(r => r.userId === player2Id && r.game === game);
  
  if (existingRating1) {
    existingRating1.rating = player1Rating.rating;
    existingRating1.wins = player1Rating.wins;
    existingRating1.losses = player1Rating.losses;
    existingRating1.draws = player1Rating.draws;
    existingRating1.lastPlayed = player1Rating.lastPlayed;
  }
  
  if (existingRating2) {
    existingRating2.rating = player2Rating.rating;
    existingRating2.wins = player2Rating.wins;
    existingRating2.losses = player2Rating.losses;
    existingRating2.draws = player2Rating.draws;
    existingRating2.lastPlayed = player2Rating.lastPlayed;
  }
  
  await ratingsDb.write();
  await gameResultsDb.write();
  
  return { player1Rating, player2Rating, player1RatingBefore, player2RatingBefore };
}

// 특정 게임의 레이팅 순위 가져오기
export async function getGameRankings(game: string, limit = 10): Promise<Rating[]> {
  await ratingsDb.read();
  
  const rankings = ratingsDb.data.data.filter(r => r.game === game && (r.wins + r.losses + r.draws) >= 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
  
  return rankings;
}

// 서버에 명령어 활성화/비활성화
export async function setCommandEnabledStatus(
  guildId: string,
  commandName: string,
  enabled: boolean,
  name: string,
  iconURL?: string,
  joined?: Date
): Promise<Guild> {
  await guildsDb.read();
  let guild = guildsDb.data.data.find(g => g.id === guildId);

  if (!guild) {
    guild = {
      id: guildId,
      name: name,
      iconURL: iconURL || '',
      joined: joined || new Date(),
      enabledCommands: []
    };
    guildsDb.data.data.push(guild);
  }

  if (enabled) {
    // 명령어 활성화
    if (!guild.enabledCommands.includes(commandName)) {
      guild.enabledCommands.push(commandName);
    }
  } else {
    // 명령어 비활성화
    guild.enabledCommands = guild.enabledCommands.filter(name => name !== commandName);
  }

  await guildsDb.write();
  return guild;
}

// 서버의 활성화된 명령어 목록 가져오기
export async function getEnabledCommands(guildId: string): Promise<string[]> {
  await guildsDb.read();
  const guild = guildsDb.data.data.find(g => g.id === guildId);
  return guild ? guild.enabledCommands : [];
}

// 명령어가 활성화되어 있는지 확인
export async function isCommandEnabled(guildId: string, commandName: string): Promise<boolean> {
  const enabledCommands = await getEnabledCommands(guildId);
  return enabledCommands.includes(commandName);
}

// 사용자 정보 저장 또는 업데이트
export async function saveUser(user: User): Promise<User> {
  await usersDb.read();
  
  const existingUser = usersDb.data.data.find(u => u.id === user.id);
  
  if (existingUser) {
    // 기존 사용자 정보 업데이트
    Object.assign(existingUser, user);
  } else {
    // 새 사용자 추가
    usersDb.data.data.push(user);
  }
  
  await usersDb.write();
  return user;
}

// 서버 정보 저장 또는 업데이트
export async function saveGuild(guild: Guild): Promise<Guild> {
  await guildsDb.read();
  const existingGuild = guildsDb.data.data.find(g => g.id === guild.id);
  
  if (existingGuild) {
    // 기존 서버 정보 업데이트 (활성화된 명령어 목록은 유지)
    const enabledCommands = existingGuild.enabledCommands;
    Object.assign(existingGuild, guild);
    existingGuild.enabledCommands = enabledCommands;
  } else {
    // 새 서버 추가
    guildsDb.data.data.push(guild);
  }
  
  await guildsDb.write();
  return guild;
}

// 승률 계산 함수
export function calculateWinRate(rating: Rating): number {
  const totalGames = rating.wins + rating.losses + rating.draws;
  if (totalGames === 0) return 0;
  return Math.round((rating.wins / totalGames) * 100);
}

// 데이터베이스 유틸리티 함수들 내보내기
export {
  type User,
  type Guild,
  type Rating,
  type GameResult,
  type DatabaseSchema
}; 