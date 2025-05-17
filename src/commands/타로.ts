import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

// 타로 카드 데이터
const tarotCards = [
  {
    name: '😮 바보',
    description: '새로운 여정의 시작을 의미합니다. 두려움 없이 새로운 도전을 시작해보세요.',
    keywords: ['새로운 시작', '모험', '순수함', '자유로움'],
    details: {
      정방향: '새로운 시작, 무한한 가능성, 순수함',
      역방향: '경솔함, 무모함, 위험 감수',
      사랑: '새로운 만남이나 관계의 가능성이 있습니다.',
      직업: '새로운 기회나 도전을 수용하세요.',
      재정: '재정적인 모험을 시작할 좋은 시기입니다.'
    }
  },
  {
    name: '✨ 마법사',
    description: '당신의 의지와 능력으로 원하는 것을 이룰 수 있습니다. 자신의 재능을 믿으세요.',
    keywords: ['창의성', '의지력', '재능', '자신감'],
    details: {
      정방향: '창의적 능력, 기술, 자원의 활용',
      역방향: '미숙함, 재능 낭비, 기회 상실',
      사랑: '매력과 카리스마로 상대방을 사로잡을 것입니다.',
      직업: '당신의 특별한 기술을 발휘할 좋은 시기입니다.',
      재정: '재정적 전략을 세우고 실행할 때입니다.'
    }
  },
  {
    name: '🔮 여사제',
    description: '직감과 내면의 지혜를 따르세요. 명상과 자기성찰의 시간을 가지는 것이 좋겠습니다.',
    keywords: ['직감', '지혜', '비밀', '내면의 목소리'],
    details: {
      정방향: '직관, 무의식, 내면의 지혜',
      역방향: '억압된 감정, 비밀, 혼란',
      사랑: '내면의 목소리를 듣고 진정한 감정을 따르세요.',
      직업: '창의적 영감을 받을 시기입니다.',
      재정: '충동적인 지출을 자제하고 내면의 지혜를 따르세요.'
    }
  },
  {
    name: '👑 여황제',
    description: '풍요와 성취의 시간입니다. 자신을 잘 돌보고 주변 사람들에게도 따뜻함을 베푸세요.',
    keywords: ['풍요', '안정', '모성', '창조'],
    details: {
      정방향: '풍요, 양육, 안정, 어머니의 에너지',
      역방향: '의존성, 과보호, 불안정',
      사랑: '안정적이고 따뜻한 관계를 형성할 것입니다.',
      직업: '풍요로운 결실을 맺을 시기입니다.',
      재정: '안정적인 재정 상태를 유지할 것입니다.'
    }
  },
  {
    name: '👨‍⚖️ 황제',
    description: '리더십과 권위를 발휘할 때입니다. 규칙과 질서를 통해 안정을 찾으세요.',
    keywords: ['권위', '리더십', '구조', '통제'],
    details: {
      정방향: '권위, 구조, 규율, 아버지의 에너지',
      역방향: '지나친 통제, 경직성, 독단',
      사랑: '책임감 있고 안정적인 관계를 추구하세요.',
      직업: '리더십을 발휘할 좋은 시기입니다.',
      재정: '체계적인 재정 관리가 필요합니다.'
    }
  },
  {
    name: '🙏 사제',
    description: '전통적인 가치와 신념을 따르세요. 정신적인 성장을 위한 시간을 가지는 것이 좋습니다.',
    keywords: ['신념', '전통', '정신적 성장', '가르침'],
    details: {
      정방향: '영적 지혜, 전통, 종교적 신념',
      역방향: '독단, 지나친 관습, 제한된 사고',
      사랑: '전통적인 가치를 중요시하는 관계를 맺을 것입니다.',
      직업: '전문적인 조언이나 멘토링이 도움이 될 것입니다.',
      재정: '보수적인 재정 관리가 유리합니다.'
    }
  },
  {
    name: '💑 연인',
    description: '사랑과 화합의 시기입니다. 중요한 관계나 선택에 집중하세요.',
    keywords: ['사랑', '조화', '관계', '선택'],
    details: {
      정방향: '사랑, 조화, 관계, 중요한 선택',
      역방향: '불화, 부조화, 잘못된 선택',
      사랑: '깊은 연결과 진정한 사랑을 경험할 것입니다.',
      직업: '좋은 파트너십을 형성할 시기입니다.',
      재정: '균형 있는 재정 결정이 필요합니다.'
    }
  },
  {
    name: '🏎️ 전차',
    description: '결단력과 용기로 앞으로 나아가세요. 승리와 성취가 기다리고 있습니다.',
    keywords: ['의지', '결단력', '승리', '진보'],
    details: {
      정방향: '의지력, 결정, 승리, 진전',
      역방향: '공격성, 지나친 자신감, 통제 상실',
      사랑: '관계에서 주도권을 가질 것입니다.',
      직업: '목표를 향해 과감히 나아갈 시기입니다.',
      재정: '적극적인 재정 계획이 성공을 가져올 것입니다.'
    }
  },
  {
    name: '💪 힘',
    description: '내면의 힘과 용기를 발휘하세요. 어려움을 인내로 극복할 수 있습니다.',
    keywords: ['용기', '인내', '자제력', '열정'],
    details: {
      정방향: '내면의 힘, 용기, 인내, 자기 통제',
      역방향: '약함, 자신감 부족, 의심',
      사랑: '내면의 강함이 건강한 관계로 이어질 것입니다.',
      직업: '어려움을 극복할 내면의 힘을 발휘하세요.',
      재정: '장기적 관점에서 인내심을 갖고 투자하세요.'
    }
  },
  {
    name: '🔦 은둔자',
    description: '고독과 성찰의 시간을 가지세요. 자신의 내면을 탐구하고 해답을 찾을 때입니다.',
    keywords: ['고독', '성찰', '탐색', '지혜'],
    details: {
      정방향: '독립, 명상, 자기 성찰',
      역방향: '고립, 외로움, 현실 도피',
      사랑: '자기 자신을 먼저 이해하는 것이 중요합니다.',
      직업: '독립적인 작업이나 연구가 유리합니다.',
      재정: '재정 상황을 깊이 분석하고 계획하세요.'
    }
  },
  {
    name: '🎡 운명의 수레바퀴',
    description: '변화와 흐름을 받아들이세요. 운명의 순환 속에서 기회를 찾을 수 있습니다.',
    keywords: ['운명', '변화', '순환', '전환점'],
    details: {
      정방향: '운명, 행운, 순환, 새로운 방향',
      역방향: '불운, 저항, 변화에 대한 두려움',
      사랑: '관계에 새로운 국면이 다가오고 있습니다.',
      직업: '경력에 중요한 전환점이 될 것입니다.',
      재정: '재정적 변화에 유연하게 대처하세요.'
    }
  },
  {
    name: '⚖️ 정의',
    description: '공정함과 균형을 추구하세요. 진실과 정의가 승리할 것입니다.',
    keywords: ['정의', '진실', '균형', '법'],
    details: {
      정방향: '정의, 진실, 공정, 균형',
      역방향: '불공정, 부정, 불균형',
      사랑: '솔직하고 공정한 관계가 중요합니다.',
      직업: '윤리적인 결정이 성공을 가져올 것입니다.',
      재정: '공정한 거래와 정직한 재정 관리가 필요합니다.'
    }
  },
  {
    name: '🙃 매달린 사람',
    description: '새로운 관점으로 상황을 바라보세요. 희생과 기다림이 필요한 시기입니다.',
    keywords: ['희생', '기다림', '새로운 관점', '포기'],
    details: {
      정방향: '희생, 새로운 시각, 중단, 포기',
      역방향: '저항, 무의미한 희생, 지체',
      사랑: '기다림과 인내가 필요한 시기입니다.',
      직업: '새로운 관점으로 문제를 바라보세요.',
      재정: '지금은 큰 지출을 자제하고 상황을 관찰하세요.'
    }
  },
  {
    name: '💀 죽음',
    description: '변화와 변형의 시기입니다. 과거를 놓고 새로운 시작을 받아들이세요.',
    keywords: ['변화', '종료', '변형', '새로운 시작'],
    details: {
      정방향: '변화, 종결, 전환, 새로운 시작',
      역방향: '저항, 정체, 변화에 대한 두려움',
      사랑: '관계에 중요한 변화가 필요합니다.',
      직업: '경력에 새로운 방향이 필요할 수 있습니다.',
      재정: '재정적 변화나 재구성이 필요한 시기입니다.'
    }
  },
  {
    name: '🧘 절제',
    description: '균형과 조화를 찾으세요. 극단을 피하고 중용의 길을 걷는 것이 좋습니다.',
    keywords: ['균형', '조화', '절제', '치유'],
    details: {
      정방향: '균형, 조화, 절제, 치유',
      역방향: '불균형, 과도함, 조화의 부재',
      사랑: '균형 잡힌 관계가 행복을 가져올 것입니다.',
      직업: '일과 삶의 균형을 찾는 것이 중요합니다.',
      재정: '저축과 지출 사이의 균형을 유지하세요.'
    }
  },
  {
    name: '👿 악마',
    description: '욕망과 유혹에 주의하세요. 자신의 어두운 면을 인식하고 다스리는 것이 중요합니다.',
    keywords: ['유혹', '속박', '집착', '물질주의'],
    details: {
      정방향: '유혹, 중독, 물질주의, 속박',
      역방향: '해방, 두려움 극복, 제한에서 벗어남',
      사랑: '건전하지 않은 관계 패턴을 경계하세요.',
      직업: '직장에서의 권력 남용이나 갈등에 주의하세요.',
      재정: '충동적인 지출이나 재정적 속박에 주의하세요.'
    }
  },
  {
    name: '🗼 탑',
    description: '갑작스러운 변화와 혼란이 있을 수 있습니다. 오래된 구조가 무너지고 새로운 통찰을 얻게 될 것입니다.',
    keywords: ['혼란', '파괴', '계시', '각성'],
    details: {
      정방향: '갑작스러운 변화, 혼란, 계시, 각성',
      역방향: '변화에 대한 두려움, 필요한 파괴 회피',
      사랑: '관계에 급격한 변화가 있을 수 있습니다.',
      직업: '직업적 혼란이나 변화에 준비하세요.',
      재정: '예상치 못한 재정적 위기가 올 수 있습니다.'
    }
  },
  {
    name: '⭐ 별',
    description: '희망과 영감의 시간입니다. 당신의 꿈을 믿고 밝은 미래를 향해 나아가세요.',
    keywords: ['희망', '영감', '평화', '낙관'],
    details: {
      정방향: '희망, 영감, 새로운 가능성, 평화',
      역방향: '절망, 낙담, 희망 상실',
      사랑: '밝고 희망찬 관계가 형성될 것입니다.',
      직업: '창의적인 영감과 새로운 아이디어가 넘칠 것입니다.',
      재정: '경제적 상황이 개선될 징조가 보입니다.'
    }
  },
  {
    name: '🌙 달',
    description: '불확실성과 환상에 주의하세요. 직감을 믿되, 현실과 환상을 구분하는 것이 중요합니다.',
    keywords: ['환상', '불확실성', '직감', '무의식'],
    details: {
      정방향: '환상, 두려움, 불확실성, 직감',
      역방향: '혼란 극복, 명확성, 미스터리 해결',
      사랑: '관계에서의 오해나 착각에 주의하세요.',
      직업: '상황을 정확히 파악하기 위해 더 많은 정보를 모으세요.',
      재정: '투자나 재정 결정에 대한 착각에 주의하세요.'
    }
  },
  {
    name: '☀️ 태양',
    description: '성공과 기쁨의 시간입니다. 긍정적인 에너지가 당신의 삶을 비추고 있습니다.',
    keywords: ['기쁨', '성공', '활력', '긍정'],
    details: {
      정방향: '성공, 기쁨, 풍요, 긍정',
      역방향: '어려움, 자만심, 과신',
      사랑: '밝고 행복한 관계를 누릴 것입니다.',
      직업: '성공과 인정을 받을 좋은 시기입니다.',
      재정: '재정적 풍요와 안정을 경험할 것입니다.'
    }
  },
  {
    name: '📢 심판',
    description: '자기 성찰과 재평가의 시간입니다. 중요한 깨달음과 변화의 기회가 찾아올 것입니다.',
    keywords: ['각성', '갱생', '판단', '부활'],
    details: {
      정방향: '재탄생, 각성, 갱생, 부활',
      역방향: '후회, 의심, 판단 유보',
      사랑: '관계에 새로운 관점과 심층적 이해가 필요합니다.',
      직업: '경력에 대한 깊은 성찰과 방향 전환을 고려하세요.',
      재정: '재정적 결정을 재평가하고 새로운 계획을 세우세요.'
    }
  },
  {
    name: '🌎 세계',
    description: '완성과 성취의 시간입니다. 한 사이클이 완성되고 새로운 여정이 시작됩니다.',
    keywords: ['완성', '성취', '통합', '여행'],
    details: {
      정방향: '완성, 성취, 여행, 사이클의 종료',
      역방향: '미완성, 지연, 목표 달성 실패',
      사랑: '관계가 새로운 수준으로 발전할 것입니다.',
      직업: '중요한 목표를 달성하고 새로운 도전을 시작할 시기입니다.',
      재정: '장기적인 재정 계획이 결실을 맺을 것입니다.'
    }
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('타로')
    .setDescription('타로 카드를 뽑아 운세를 알려드립니다')
    .addStringOption(option => 
      option.setName('질문')
        .setDescription('타로에게 물어볼 질문을 입력하세요 (선택사항)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('카테고리')
        .setDescription('특정 카테고리의 타로 해석을 받습니다')
        .setRequired(false)
        .addChoices(
          { name: '일반', value: 'general' },
          { name: '사랑', value: 'love' },
          { name: '직업', value: 'career' },
          { name: '재정', value: 'finance' }
        )),

  async execute(interaction: CommandInteraction) {
    // 사용자의 질문과 카테고리 가져오기
    const question = interaction.options.get('질문')?.value as string | undefined;
    const category = interaction.options.get('카테고리')?.value as string || 'general';

    // 랜덤으로 타로 카드 3장 선택
    const selectedCards = [];
    const usedIndices = new Set();
    
    while (selectedCards.length < 3) {
      const randomIndex = Math.floor(Math.random() * tarotCards.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedCards.push(tarotCards[randomIndex]);
      }
    }

    // 카드 해석 텍스트
    const [past, present, future] = selectedCards;
    
    // 카테고리별 해석 생성
    let pastInterpretation, presentInterpretation, futureInterpretation;
    
    if (category === 'love') {
      pastInterpretation = past.details.사랑;
      presentInterpretation = present.details.사랑;
      futureInterpretation = future.details.사랑;
    } else if (category === 'career') {
      pastInterpretation = past.details.직업;
      presentInterpretation = present.details.직업;
      futureInterpretation = future.details.직업;
    } else if (category === 'finance') {
      pastInterpretation = past.details.재정;
      presentInterpretation = present.details.재정;
      futureInterpretation = future.details.재정;
    } else {
      // 일반 해석
      pastInterpretation = past.description;
      presentInterpretation = present.description;
      futureInterpretation = future.description;
    }
    
    const readingText = `
**과거 - ${past.name}**: ${pastInterpretation}
**현재 - ${present.name}**: ${presentInterpretation}
**미래 - ${future.name}**: ${futureInterpretation}

**종합 해석**: 
${past.name}, ${present.name}, ${future.name} 카드의 조합은 
과거에 ${past.keywords[Math.floor(Math.random() * past.keywords.length)]}의 경험을 하셨고, 
현재는 ${present.keywords[Math.floor(Math.random() * present.keywords.length)]} 상태에 있으며, 
미래에는 ${future.keywords[Math.floor(Math.random() * future.keywords.length)]}을(를) 경험하게 될 것임을 시사합니다.
`;

    // 카테고리에 따른 색상 설정
    let embedColor: number;
    switch (category) {
      case 'love': embedColor = 0xFF69B4; break; // 분홍색
      case 'career': embedColor = 0x4682B4; break; // 파란색
      case 'finance': embedColor = 0x32CD32; break; // 녹색
      default: embedColor = 0x9900FF; // 보라색
    }

    // 임베드 생성
    const tarotEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`🔮 ${interaction.user.displayName}님의 타로 운세 (${getCategoryName(category)})`)
      .setDescription(question ? `**질문**: ${question}\n\n${readingText}` : readingText)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '🔄 추가 정보', value: '타로 카드는 절대적인 운명을 보여주는 것이 아니라, 가능성과 경향을 보여줍니다. 모든 미래는 당신의 선택에 따라 변할 수 있습니다.' }
      )
      .setFooter({ text: '※ 재미로만 봐주세요! 진지한 해석은 전문가를 찾아주세요.' })
      .setTimestamp();

    await interaction.reply({ embeds: [tarotEmbed] });
  },
};

// 카테고리 이름 변환 함수
function getCategoryName(category: string): string {
  switch (category) {
    case 'love': return '사랑';
    case 'career': return '직업';
    case 'finance': return '재정';
    default: return '일반';
  }
} 