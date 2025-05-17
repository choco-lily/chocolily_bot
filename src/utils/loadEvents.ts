import fs from "fs";
import path from "path";
import { Client } from "discord.js";

export async function loadEvents(client: Client) {
    const eventsPath = path.join(__dirname, "../events");
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".ts"));

    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);

            if (event.once) {
                client.once(event.name, (...args) => {
                    event.execute(...args);
                });
            } else {
                client.on(event.name, (...args) => {
                    event.execute(...args);
                });
            }
        } catch (error) {
            console.error(`❌ ${file} 이벤트 로드 중 오류 발생:`, error);
        }
    }
}
