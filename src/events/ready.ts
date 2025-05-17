import { Events, Collection } from 'discord.js';
import { client } from '../index';
import fs from 'fs';
import path from 'path';

export const name = Events.ClientReady;
export const once = true;

export async function execute() {
  // 명령어 컬렉션 초기화
  client.commands = new Collection();
  
  // 명령어 파일 로드
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`⚠️ ${file} 파일에 필수 속성이 없습니다.`);
      }
    } catch (error) {
      console.error(`❌ ${file} 파일 로드 중 오류 발생:`, error);
    }
  }
} 