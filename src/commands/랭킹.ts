import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getGameRankings, type Rating } from '../utils/database';

interface UserData {
  displayName: string;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('랭킹')
    .setDescription('게임별 랭킹을 표시합니다')
    .addStringOption(option =>
      option.setName('게임')
        .setDescription('랭킹을 확인할 게임')
        .setRequired(true)
        .addChoices(
          { name: '가위바위보', value: '가위바위보' }
        )
    )
    .addIntegerOption(option =>
      option.setName('인원수')
        .setDescription('표시할 랭킹의 인원 수 (기본값: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const game = interaction.options.getString('게임', true);
    const limit = interaction.options.getInteger('인원수') || 10;
    
    // 랭킹 데이터 가져오기
    await interaction.deferReply();
    const rankings = await getGameRankings(game, limit);
    
    if (rankings.length === 0) {
      await interaction.editReply({
        content: `⚠️ \`${game}\` 게임의 랭킹 데이터가 없습니다. 더 많은 사용자가 게임을 플레이해야 합니다.`
      });
      return;
    }
    
    try {
      // 사용자 정보 가져오기
      const userIds = rankings.map(r => r.userId);
      const users = new Map<string, UserData>();
      
      // 서버에서 사용자 정보 가져오기
      if (interaction.guild) {
        for (const userId of userIds) {
          try {
            // 봇인 경우 특별 처리
            if (userId === 'miku' || userId === 'teto' || userId === 'kafu') {
              const botNames: { [key: string]: string } = {
                'miku': '미쿠',
                'teto': '테토',
                'kafu': '카후'
              };
              users.set(userId, { displayName: botNames[userId] });
              continue;
            }
            
            const member = await interaction.guild.members.fetch(userId);
            users.set(userId, { displayName: member.displayName });
          } catch (error) {
            // 사용자를 찾을 수 없는 경우
            users.set(userId, { displayName: '알 수 없는 사용자' });
          }
        }
      }
      
      // 랭킹 표시
      const embed = createRankingEmbed(game, rankings, users);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`랭킹 표시 중 오류 발생: ${error}`);
      await interaction.editReply({
        content: '⚠️ 랭킹을 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
      });
    }
  }
};

// 랭킹 임베드 생성 함수
function createRankingEmbed(
  game: string, 
  rankings: Rating[], 
  users: Map<string, UserData>
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`🏆 ${game} 랭킹`)
    .setDescription(`현재 ${game} 게임의 상위 ${rankings.length}명 랭킹입니다.`)
    .setTimestamp();
  
  // 랭킹 정보 추가
  rankings.forEach((ranking, index) => {
    const user = users.get(ranking.userId);
    const displayName = user ? user.displayName : '알 수 없는 사용자';
    const winRate = calculateWinRate(ranking);
    
    let medalEmoji = '';
    if (index === 0) medalEmoji = '🥇 ';
    else if (index === 1) medalEmoji = '🥈 ';
    else if (index === 2) medalEmoji = '🥉 ';
    else medalEmoji = `${index + 1}. `;
    
    let botBadge = '';
    if (ranking.userId === 'miku' || ranking.userId === 'teto' || ranking.userId === 'kafu') {
      botBadge = ' [BOT]';
    }
    
    embed.addFields({
      name: `${medalEmoji}${displayName}${botBadge}`,
      value: `**레이팅**: ${ranking.rating} 점\n**승률**: ${winRate}% (${ranking.wins}승 ${ranking.losses}패 ${ranking.draws}무)`
    });
  });
  
  return embed;
}

// 승률 계산 함수
function calculateWinRate(rating: Rating): number {
  const totalGames = rating.wins + rating.losses + rating.draws;
  if (totalGames === 0) return 0;
  
  // 무승부는 0.5승으로 계산
  const winPoints = rating.wins + (rating.draws * 0.5);
  return Math.round((winPoints / totalGames) * 100);
} 