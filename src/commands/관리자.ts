import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, AutocompleteInteraction } from 'discord.js';
import { setCommandEnabledStatus, getEnabledCommands } from '../utils/database';
import * as path from 'path';
import * as fs from 'fs';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('관리자')
    .setDescription('봇 관리자 명령어')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('명령어활성화')
        .setDescription('특정 명령어를 서버에서 활성화합니다')
        .addStringOption(option =>
          option.setName('명령어')
            .setDescription('활성화할 명령어')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('명령어비활성화')
        .setDescription('특정 명령어를 서버에서 비활성화합니다')
        .addStringOption(option =>
          option.setName('명령어')
            .setDescription('비활성화할 명령어')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('명령어목록')
        .setDescription('서버에서 활성화된 명령어 목록을 표시합니다')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: '⚠️ 이 명령어는 서버 내에서만 사용할 수 있습니다.',
        flags: 64
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '명령어활성화') {
      const commandName = interaction.options.getString('명령어', true);
      
      // 유효한 명령어인지 확인
      if (!isValidCommand(commandName)) {
        await interaction.reply({
          content: `⚠️ \`${commandName}\` 명령어를 찾을 수 없습니다.`,
          flags: 64
        });
        return;
      }

      await setCommandEnabledStatus(
        interaction.guild.id,
        commandName,
        true,
        interaction.guild.name,
        interaction.guild.iconURL() ?? undefined,
        interaction.guild.joinedAt
      );
      await interaction.reply({
        content: `✅ \`/${commandName}\` 명령어가 이 서버에서 활성화되었습니다.`,
        flags: 64
      });
    } 
    else if (subcommand === '명령어비활성화') {
      const commandName = interaction.options.getString('명령어', true);
      
      // 유효한 명령어인지 확인
      if (!isValidCommand(commandName)) {
        await interaction.reply({
          content: `⚠️ \`${commandName}\` 명령어를 찾을 수 없습니다.`,
          flags: 64
        });
        return;
      }

      // 관리자 명령어는 비활성화할 수 없음
      if (commandName === '관리자') {
        await interaction.reply({
          content: `⚠️ \`관리자\` 명령어는 비활성화할 수 없습니다.`,
          flags: 64
        });
        return;
      }

      await setCommandEnabledStatus(
        interaction.guild.id,
        commandName,
        false,
        interaction.guild.name,
        interaction.guild.iconURL() ?? undefined,
        interaction.guild.joinedAt
      );
      await interaction.reply({
        content: `✅ \`/${commandName}\` 명령어가 이 서버에서 비활성화되었습니다.`,
        flags: 64
      });
    }
    else if (subcommand === '명령어목록') {
      const enabledCommands = await getEnabledCommands(interaction.guild.id);
      const allCommands = getAllCommands();
      
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('명령어 상태')
        .setDescription('이 서버에서의 명령어 활성화 상태입니다.')
        .addFields(
          allCommands.map(cmd => {
            const enabled = enabledCommands.includes(cmd);
            return {
              name: `/${cmd}`,
              value: enabled ? '✅ 활성화' : '❌ 비활성화',
              inline: true
            };
          })
        )
        .setFooter({ text: '관리자 권한이 있는 멤버만 명령어 상태를 변경할 수 있습니다.' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: 64
      });
    }
  },

  // 자동 완성 처리
  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === '명령어') {
      const allCommands = getAllCommands();
      const filtered = allCommands.filter(cmd => 
        cmd.startsWith(focusedOption.value.toLowerCase())
      );
      
      await interaction.respond(
        filtered.map(cmd => ({ name: cmd, value: cmd }))
      );
    }
  }
};

// 유효한 명령어인지 확인하는 함수
function isValidCommand(commandName: string): boolean {
  const allCommands = getAllCommands();
  return allCommands.includes(commandName);
}

// 모든 명령어 목록을 가져오는 함수
function getAllCommands(): string[] {
  const commandsPath = path.join(__dirname);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') || file.endsWith('.ts')
  );
  
  return commandFiles.map(file => {
    // 파일 확장자 제거 (.js 또는 .ts)
    return path.basename(file, path.extname(file));
  });
} 