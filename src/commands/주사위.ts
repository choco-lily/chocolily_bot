import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

// 주사위 굴리기 관련 정규식
const DICE_REGEX = /^(\d+)d(\d+)(?:([\+\-])(\d+))?$/;

// 주사위 굴리기 기능 함수
function rollDice(diceStr: string): {
  rolls: number[];
  total: number;
  notation: string;
  formula: string;
  error?: string;
} {
  // 일반 숫자인 경우
  if (/^\d+$/.test(diceStr)) {
    const num = parseInt(diceStr);
    if (num < 1 || num > 1000000) {
      return {
        rolls: [],
        total: 0,
        notation: diceStr,
        formula: diceStr,
        error: '1부터 1,000,000 사이의 숫자만 입력 가능합니다.'
      };
    }
    return {
      rolls: [num],
      total: num,
      notation: diceStr,
      formula: diceStr
    };
  }

  // 주사위 표기법 (XdY+Z 또는 XdY-Z) 파싱
  const match = diceStr.match(DICE_REGEX);
  if (!match) {
    return {
      rolls: [],
      total: 0,
      notation: diceStr,
      formula: diceStr,
      error: '올바른 주사위 표기법이 아닙니다. 예: 1d6, 2d10+3'
    };
  }

  const numDice = parseInt(match[1]);
  const numFaces = parseInt(match[2]);
  const operator = match[3] || null;
  const modifier = match[4] ? parseInt(match[4]) : 0;

  // 유효성 검사
  if (numDice < 1 || numDice > 100) {
    return {
      rolls: [],
      total: 0,
      notation: diceStr,
      formula: diceStr,
      error: '주사위 개수는 1부터 100개까지 가능합니다.'
    };
  }
  if (numFaces < 2 || numFaces > 1000) {
    return {
      rolls: [],
      total: 0,
      notation: diceStr,
      formula: diceStr,
      error: '주사위 면 수는 2부터 1000까지 가능합니다.'
    };
  }

  // 주사위 굴리기
  const rolls: number[] = [];
  let rolledTotal = 0;
  
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * numFaces) + 1;
    rolls.push(roll);
    rolledTotal += roll;
  }

  // 수정자 적용
  let total = rolledTotal;
  if (operator === '+') {
    total += modifier;
  } else if (operator === '-') {
    total -= modifier;
  }

  // 주사위 굴리기 수식 생성
  let formula = `${rolls.join(' + ')}`;
  if (operator) {
    formula += ` ${operator} ${modifier}`;
  }
  formula += ` = ${total}`;

  return {
    rolls,
    total,
    notation: diceStr,
    formula
  };
}

// 명령어 모듈
module.exports = {
  data: new SlashCommandBuilder()
    .setName('주사위')
    .setDescription('주사위를 굴립니다')
    .addStringOption(option => 
      option.setName('표기법')
        .setDescription('주사위 표기법 (예: 1d20, 3d6+2). 숫자만 입력하면 그 숫자가 나옵니다.')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const notation = interaction.options.getString('표기법', true).toLowerCase().replace(/\s/g, '');
    
    // 주사위 굴리기
    const result = rollDice(notation);
    
    // 에러가 있는 경우
    if (result.error) {
      await interaction.reply({
        content: `⚠️ ${result.error}`,
        flags: 64
      });
      return;
    }
    
    // 결과 표시 색상 설정 (최대값이면 녹색, 최소값이면 빨간색, 그 외에는 파란색)
    let resultColor = 0x3498DB; // 파란색
    
    if (result.rolls.length === 1 && notation.includes('d')) {
      const numFaces = parseInt(notation.split('d')[1].split(/[\+\-]/)[0]);
      if (result.rolls[0] === numFaces) {
        resultColor = 0x2ECC71; // 녹색 (최대값)
      } else if (result.rolls[0] === 1) {
        resultColor = 0xE74C3C; // 빨간색 (최소값)
      }
    }
    
    // 결과 임베드 생성
    const diceEmbed = new EmbedBuilder()
      .setColor(resultColor)
      .setTitle(`🎲 주사위 결과: ${result.total}`)
      .setDescription(`**표기법**: ${result.notation}\n**계산식**: ${result.formula}`)
      .setFooter({ text: `${interaction.user.displayName}님이 굴린 주사위` })
      .setTimestamp();
    
    // 많은 주사위를 굴린 경우 필드로 분리
    if (result.rolls.length > 1) {
      // 주사위가 너무 많으면 요약해서 보여줌
      if (result.rolls.length > 20) {
        diceEmbed.addFields(
          { name: '주사위 개수', value: `${result.rolls.length}개`, inline: true },
          { name: '평균값', value: `${(result.rolls.reduce((a, b) => a + b, 0) / result.rolls.length).toFixed(2)}`, inline: true },
          { name: '합계', value: `${result.rolls.reduce((a, b) => a + b, 0)}`, inline: true }
        );
      } else {
        diceEmbed.addFields(
          { name: '각 주사위 결과', value: result.rolls.join(', ') }
        );
      }
    }
    
    await interaction.reply({ embeds: [diceEmbed] });
  },
}; 