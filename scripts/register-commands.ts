import 'dotenv/config';
import { commands } from '../src/commands';

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!APPLICATION_ID || !DISCORD_TOKEN) {
  console.error('Missing DISCORD_APPLICATION_ID or DISCORD_TOKEN');
  process.exit(1);
}

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${DISCORD_TOKEN}`
    },
    body: JSON.stringify(commands)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to register commands: ${response.status} ${text}`);
  }

  console.log('✅ Slash commands registered successfully');
}

registerCommands().catch((error) => {
  console.error(error);
  process.exit(1);
});
