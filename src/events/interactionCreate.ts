import { Events, Interaction } from "discord.js";
import { isCommandEnabled } from "../utils/database";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        // 봇이 보낸 메시지는 무시
        if (interaction.user.bot) return;
        
        // 명령어가 아닌 경우 무시
        if (!interaction.isChatInputCommand()) return;

        const client = interaction.client;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(
                `❌ ${interaction.commandName} 명령어를 찾을 수 없습니다.`
            );
            return;
        }

        try {
            // 서버(길드)에서 실행된 명령어인 경우 활성화 여부 확인
            if (interaction.guildId) {
                const enabled = await isCommandEnabled(
                    interaction.guildId,
                    interaction.commandName
                );
                if (!enabled) {
                    await interaction.reply({
                        content: `⚠️ 이 서버에서는 \`/${interaction.commandName}\` 명령어가 비활성화되어 있습니다. 서버 관리자에게 활성화를 요청하세요.`,
                        flags: 64,
                    });
                    return;
                }
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ 명령어 실행 중 오류 발생:`, error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: "⚠️ 명령어 실행 중 오류가 발생했습니다!",
                        flags: 64,
                    });
                }
                // replied나 deferred가 아니면 followUp 시도하지 않음
            } catch (e: any) {
                if (e.code === 10062 || e.rawError?.code === 10062) {
                    // Unknown interaction: 이미 만료된 경우 무시
                } else {
                    console.error("❌ followUp 중 추가 오류:", e);
                }
            }
        }
    },
};
