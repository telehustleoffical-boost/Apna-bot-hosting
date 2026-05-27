import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SETTINGS_FILE = path.join(process.cwd(), 'bot-settings.json');

let apiKey = uuidv4().substring(0, 12);
let globalBotCode = `// Example Telegraf bot code
bot.start((ctx) => {
  ctx.reply('Hello! I am an active bot created via Apna Bot Maker!');
});

bot.on('text', (ctx) => {
  ctx.reply(\`Echo: \${ctx.message.text}\`);
});`;

export const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (data.apiKey) apiKey = data.apiKey;
      if (data.globalBotCode) globalBotCode = data.globalBotCode;
    } else {
      saveSettings();
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
};

const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ apiKey, globalBotCode }, null, 2));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

loadSettings();

export const getSettings = () => ({ apiKey, globalBotCode });

export const updateSettings = (newKey?: string, newCode?: string) => {
  if (newKey !== undefined && newKey.trim() !== '') apiKey = newKey.trim();
  if (newCode !== undefined) globalBotCode = newCode;
  saveSettings();
};
