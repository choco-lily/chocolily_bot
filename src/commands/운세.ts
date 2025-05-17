import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { saveUser, type User, usersDb } from '../utils/database';

// 운세 카테고리별 메시지
const fortuneCategories: Record<string, string[]> = {
  love: [
    '오늘은 로맨스가 가득한 날이 될 거예요! 💕',
    '소중한 인연이 다가오고 있어요. 눈을 크게 뜨고 주변을 살펴보세요! 👀',
    '지금은 혼자 있는 시간을 즐기는 게 좋아요. 나를 사랑하는 법을 배우세요! 🌟',
    '오래된 관계에 새로운 활력이 생길 거예요. 대화를 나눠보세요! 💬',
    '오늘은 마음을 열고 새로운 만남을 시도해보세요! 🎯'
  ],
  career: [
    '오늘은 새로운 기회가 찾아올 거예요. 준비된 자에게 기회는 온다! 🎯',
    '지금까지의 노력이 곧 결실을 맺을 거예요. 포기하지 마세요! 🌱',
    '동료들과의 협력이 중요한 날이에요. 함께하면 더 큰 성과를 낼 수 있어요! 👥',
    '새로운 도전을 시도하기 좋은 날이에요. 두려워하지 마세요! 🚀',
    '오늘은 창의적인 아이디어가 떠오를 거예요. 메모장을 준비하세요! 📝'
  ],
  health: [
    '오늘은 건강에 특별히 신경 써야 해요. 충분한 휴식이 필요해요! 😴',
    '활동적인 하루가 될 거예요. 운동을 시작하기 좋은 날이에요! 💪',
    '스트레스가 쌓일 수 있어요. 명상이나 산책을 해보세요! 🧘‍♀️',
    '건강한 식습관이 중요한 날이에요. 영양가 있는 음식을 챙겨먹으세요! 🥗',
    '오늘은 기분이 좋아질 거예요. 긍정적인 마인드가 건강의 비결! 😊'
  ],
  luck: [
    '오늘은 행운이 가득한 날이에요! 복권 한 장 사보는 건 어때요? 🍀',
    '예상치 못한 좋은 일이 생길 거예요. 기대해도 좋아요! 🎁',
    '오늘은 조심해야 해요. 실수하지 않도록 천천히 진행하세요! ⚠️',
    '새로운 시작을 하기 좋은 날이에요. 과감하게 도전해보세요! 🌅',
    '오늘은 평범한 하루가 될 거예요. 하지만 그 속에 작은 행복이 숨어있어요! 🌈'
  ],
  daily: [
    '오늘 하루는 평화로운 하루가 될 거예요. 마음의 여유를 가지세요! 🕊️',
    '새로운 취미를 시작하기 좋은 날이에요. 뭐든 시도해보세요! 🎨',
    '친구들과 만나기 좋은 날이에요. 즐거운 대화가 기다리고 있어요! 👥',
    '오늘은 집에서 휴식을 취하기 좋은 날이에요. 영화 한 편 어떠세요? 🎬',
    '창의적인 활동이 잘 풀릴 거예요. 아이디어를 실현해보세요! 💡'
  ]
};

// 행운의 색상
const luckyColors = [
  '빨간색 🔴', '주황색 🟠', '노란색 🟡', '초록색 🟢', 
  '파란색 🔵', '보라색 🟣', '분홍색 💗', '하얀색 ⚪',
  '검은색 ⚫', '금색 💛', '은색 🤍', '청록색 💠'
];

// 행운의 방향
const luckyDirections = [
  '동쪽 🌅', '서쪽 🌇', '남쪽 🧭', '북쪽 🧭',
  '동남쪽 🧭', '동북쪽 🧭', '서남쪽 🧭', '서북쪽 🧭'
];

// 행운의 시간대
const luckyTimeSlots = [
  '아침 (6시~9시) 🌅', '오전 (9시~12시) ☀️', 
  '오후 (12시~3시) 🌤️', '저녁 (3시~6시) 🌅',
  '밤 (6시~9시) 🌙', '심야 (9시~12시) 🌠'
];

// 행운의 숫자 생성
function generateLuckyNumbers() {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

// 랜덤 아이템 선택
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 오늘의 운세 생성
function generateFortune() {
  const category = Object.keys(fortuneCategories)[Math.floor(Math.random() * Object.keys(fortuneCategories).length)];
  const message = fortuneCategories[category][Math.floor(Math.random() * fortuneCategories[category].length)];
  const luckyNumbers = generateLuckyNumbers();
  const luckyColor = getRandomItem(luckyColors);
  const luckyDirection = getRandomItem(luckyDirections);
  const luckyTimeSlot = getRandomItem(luckyTimeSlots);

  return {
    category,
    message,
    luckyNumbers,
    luckyColor,
    luckyDirection,
    luckyTimeSlot
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('운세')
    .setDescription('오늘의 운세를 확인합니다 (하루에 한 번만 가능)'),

  async execute(interaction: CommandInteraction) {
    const userId = interaction.user.id;
    const now = Date.now();

    // 사용자 정보 불러오기
    await usersDb.read();
    let user = usersDb.data.data.find(u => u.id === userId);

    if (!user) {
      // 새 사용자 정보 생성
      user = {
        id: userId,
        username: interaction.user.username,
        discriminator: interaction.user.discriminator,
        avatarURL: interaction.user.displayAvatarURL(),
        joined: new Date(0) // 처음 사용하는 경우 과거 시간으로 설정
      };
    }

    // 마지막 확인 시간이 오늘인지 확인
    const lastCheckDate = new Date(user.joined);
    const today = new Date();
    const isSameDay = lastCheckDate.getDate() === today.getDate() &&
                     lastCheckDate.getMonth() === today.getMonth() &&
                     lastCheckDate.getFullYear() === today.getFullYear();

    if (isSameDay) {
      // 다음 운세 확인 가능 시간 계산
      const nextCheck = new Date(lastCheckDate);
      nextCheck.setDate(nextCheck.getDate() + 1);
      nextCheck.setHours(0, 0, 0, 0);

      const timeLeft = nextCheck.getTime() - now;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      await interaction.reply({
        content: `⚠️ 오늘은 이미 운세를 확인하셨습니다.\n다음 운세는 내일 00시부터 확인 가능합니다. (남은 시간: ${hoursLeft}시간 ${minutesLeft}분)`,
        flags: 64
      });
      return;
    }

    // 운세 생성 및 저장
    const fortune = generateFortune();
    
    // 사용자 정보 업데이트 (마지막 운세 확인 시간을 joined 필드에 저장)
    user.joined = new Date();
    await saveUser(user);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`✨ ${interaction.user.displayName}님의 오늘의 운세 ✨`)
      .setDescription(fortune.message)
      .addFields(
        { name: '행운의 숫자', value: fortune.luckyNumbers.join(', '), inline: true },
        { name: '행운의 색상', value: fortune.luckyColor, inline: true },
        { name: '행운의 방향', value: fortune.luckyDirection, inline: true },
        { name: '행운의 시간대', value: fortune.luckyTimeSlot, inline: true },
        { name: '운세 카테고리', value: fortune.category, inline: true }
      )
      .setFooter({ text: '오늘 하루도 행운이 함께하길!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
}; 