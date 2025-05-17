import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { recordGameResult } from '../utils/database';
import path from 'path';
import fs from 'fs';

// 봇 정보 정의
const BOTS = {
  'miku': {
    name: '미쿠',
    winRate: 0.7,
    imagePath: path.join(__dirname, '../asset/miku.jpg')
  },
  'teto': {
    name: '테토',
    winRate: 0.3,
    imagePath: path.join(__dirname, '../asset/teto.jpg')
  },
  'kafu': {
    name: '카후',
    winRate: 0.5,
    imagePath: path.join(__dirname, '../asset/kafu.png')
  }
};

// 봇의 선택을 결정하는 함수
function getBotChoice(botId: string, playerChoice: string): string {
  const bot = BOTS[botId as keyof typeof BOTS];
  const random = Math.random();
  
  if (random < bot.winRate) {
    // 봇이 이기도록 선택
    switch (playerChoice) {
      case '가위': return '바위';
      case '바위': return '보';
      case '보': return '가위';
      default: return '가위';
    }
  } else if (random < bot.winRate + (1 - bot.winRate) / 2) {
    // 무승부로 선택
    return playerChoice;
  } else {
    // 봇이 지도록 선택
    switch (playerChoice) {
      case '가위': return '보';
      case '바위': return '가위';
      case '보': return '바위';
      default: return '가위';
    }
  }
}

// 승패 결정 함수
function determineWinner(playerChoice: string, botChoice: string): string | null {
  if (playerChoice === botChoice) return null;
  
  if (
    (playerChoice === '가위' && botChoice === '보') ||
    (playerChoice === '바위' && botChoice === '가위') ||
    (playerChoice === '보' && botChoice === '바위')
  ) {
    return 'player';
  }
  
  return 'bot';
}

// 결과 메시지 생성 함수
function createResultEmbed(
  playerChoice: string,
  botChoice: string,
  winner: string | null,
  botName: string,
  botImageUrl: string,
  player1Rating: any,
  player2Rating: any,
  player1RatingBefore: number,
  player2RatingBefore: number
): EmbedBuilder {
  const player1Diff = player1Rating.rating - player1RatingBefore;
  const player2Diff = player2Rating.rating - player2RatingBefore;
  const diffText = (diff: number) => diff > 0 ? `+${diff}` : `${diff}`;

  const embed = new EmbedBuilder()
    .setTitle('가위바위보 결과')
    .setColor(winner === 'player' ? '#00ff00' : winner === 'bot' ? '#ff0000' : '#ffff00')
    .setDescription(
      `당신의 선택: ${playerChoice}\n` +
      `${botName}의 선택: ${botChoice}\n\n` +
      (winner === 'player' ? '🎉 당신이 이겼습니다!' :
       winner === 'bot' ? `😢 ${botName}이(가) 이겼습니다...` :
       '🤝 무승부입니다!')
    )
    .setThumbnail(botImageUrl)
    .addFields(
      { 
        name: '당신의 전적', 
        value: `${player1Rating.wins}승 ${player1Rating.losses}패 ${player1Rating.draws}무 (승률: ${player1Rating.wins + player1Rating.losses === 0 ? 0 : Math.round((player1Rating.wins / (player1Rating.wins + player1Rating.losses)) * 100)}%)\n점수 변화: ${diffText(player1Diff)} (${player1Rating.rating})`,
        inline: true 
      },
      { 
        name: `${botName}의 전적`, 
        value: `${player2Rating.wins}승 ${player2Rating.losses}패 ${player2Rating.draws}무 (승률: ${player2Rating.wins + player2Rating.losses === 0 ? 0 : Math.round((player2Rating.wins / (player2Rating.wins + player2Rating.losses)) * 100)}%)\n점수 변화: ${diffText(player2Diff)} (${player2Rating.rating})`,
        inline: true 
      }
    )
    .setTimestamp();

  return embed;
}

export const data = new SlashCommandBuilder()
  .setName('가위바위보')
  .setDescription('봇과 가위바위보를 합니다')
  .addStringOption(option =>
    option.setName('봇')
      .setDescription('대결할 봇을 선택하세요')
      .setRequired(true)
      .addChoices(
        { name: '미쿠', value: 'miku' },
        { name: '테토', value: 'teto' },
        { name: '카후', value: 'kafu' }
      )
  );

export async function execute(interaction: any) {
  const botId = interaction.options.getString('봇');
  const bot = BOTS[botId as keyof typeof BOTS];
  
  // 봇 이미지 파일 생성
  const botImage = new AttachmentBuilder(bot.imagePath, { name: `${botId}.${bot.imagePath.split('.').pop()}` });
  const botImageUrl = `attachment://${botId}.${bot.imagePath.split('.').pop()}`;
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('가위')
        .setLabel('가위 ✌️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('바위')
        .setLabel('바위 ✊')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('보')
        .setLabel('보 ✋')
        .setStyle(ButtonStyle.Primary)
    );

  const embed = new EmbedBuilder()
    .setTitle('가위바위보')
    .setDescription(`${bot.name}과(와) 가위바위보를 시작합니다!\n아래 버튼을 눌러 선택하세요.`)
    .setThumbnail(botImageUrl)
    .setColor('#0099ff')
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    components: [row],
    files: [botImage]
  });
  const message = await interaction.fetchReply();

  const filter = (i: any) => i.user.id === interaction.user.id;
  const collector = message.createMessageComponentCollector({ filter, time: 30000 });

  collector.on('collect', async (i: any) => {
    const playerChoice = i.customId;
    const botChoice = getBotChoice(botId, playerChoice);
    const winner = determineWinner(playerChoice, botChoice);
    
    // 게임 결과 기록
    const result = await recordGameResult(
      '가위바위보',
      interaction.user.id,
      botId,
      winner === 'player' ? interaction.user.id : winner === 'bot' ? botId : null
    );
    const { player1Rating, player2Rating, player1RatingBefore, player2RatingBefore } = {
      player1Rating: result.player1Rating,
      player2Rating: result.player2Rating,
      player1RatingBefore: result.player1RatingBefore ?? result.player1Rating.rating,
      player2RatingBefore: result.player2RatingBefore ?? result.player2Rating.rating
    };

    const resultEmbed = createResultEmbed(
      playerChoice,
      botChoice,
      winner,
      bot.name,
      botImageUrl,
      player1Rating,
      player2Rating,
      player1RatingBefore,
      player2RatingBefore
    );
    
    await i.update({
      embeds: [resultEmbed],
      components: [],
      files: [botImage]
    });
  });

  collector.on('end', async (collected: any) => {
    if (collected.size === 0) {
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('시간 초과')
        .setDescription('시간이 초과되었습니다. 다시 시도해주세요.')
        .setColor('#ff0000')
        .setTimestamp();

      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
        files: []
      });
    }
  });
} 