import { Events, Guild } from 'discord.js';
import { saveGuild, setCommandEnabledStatus } from '../utils/database';

module.exports = {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    console.log(`✅ 새로운 서버에 참가했습니다: ${guild.name} (ID: ${guild.id})`);
    
    try {
      // 서버 정보 저장
      await saveGuild({
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL() || '',
        joined: new Date(),
        enabledCommands: []
      });
      
      // 관리자 명령어만 활성화 (다른 명령어는 기본적으로 비활성화 상태)
      await setCommandEnabledStatus(guild.id, '관리자', true, guild.name, guild.iconURL() || '');
      
      console.log(`✅ 서버 "${guild.name}"에 관리자 명령어가 활성화되었습니다.`);
    } catch (error) {
      console.error(`❌ 서버 초기화 중 오류 발생: ${error}`);
    }
  },
}; 