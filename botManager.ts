import { Telegraf } from 'telegraf';
import vm from 'vm';

interface BotInstance {
  token: string;
  name: string;
  bot: Telegraf;
  info: any;
  startedAt: Date;
  code?: string;
}

const activeBots = new Map<string, BotInstance>();

export async function addBot(token: string, name?: string, code?: string) {
  if (activeBots.has(token)) {
    throw new Error('A bot with this token is already running.');
  }

  const bot = new Telegraf(token);

  if (code && code.trim() !== '') {
    // Run custom provided code safely
    const sandbox = {
      bot,
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Buffer,
      Math,
      Date,
      JSON
    };
    
    vm.createContext(sandbox);
    
    try {
      vm.runInContext(code, sandbox, { timeout: 1000 });
    } catch (err: any) {
      throw new Error(`Failed to compile custom code: ${err.message}`);
    }
  } else {
    // Default fallback behavior
    bot.start((ctx) => {
      ctx.reply('Hello! I am online and powered by Apna Bot Maker! 🚀');
    });

    bot.on('text', (ctx) => {
      ctx.reply(`You just said: ${ctx.message.text}\n\n(This code can be freely customized in \`/src/server/botManager.ts\`)`);
    });
  }

  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
  });

  try {
    // Attempt to connect and fetch bot identity
    const me = await bot.telegram.getMe();
    
    // Launch polling in the background
    bot.launch();

    const instance: BotInstance = {
      token,
      name: name || me.first_name,
      bot,
      info: me,
      startedAt: new Date(),
      code,
    };

    activeBots.set(token, instance);
    
    return {
      username: me.username,
      name: instance.name,
      startedAt: instance.startedAt
    };
  } catch (error: any) {
    throw new Error(`Failed to initialize bot: ${error.message}. Please check if the token is valid.`);
  }
}


export function removeBot(token: string): boolean {
  const instance = activeBots.get(token);
  if (instance) {
    instance.bot.stop('Server stop requested');
    activeBots.delete(token);
    return true;
  }
  return false;
}

export function getActiveBots() {
  return Array.from(activeBots.values()).map(instance => ({
    token: instance.token, // Providing the full token to manage from UI
    maskedToken: instance.token.substring(0, 8) + '...',
    username: instance.info.username,
    name: instance.name,
    startedAt: instance.startedAt
  }));
}

// Ensure bots are stopped gracefully when process exits
process.once('SIGINT', () => {
  activeBots.forEach((instance) => instance.bot.stop('SIGINT'));
});
process.once('SIGTERM', () => {
  activeBots.forEach((instance) => instance.bot.stop('SIGTERM'));
});
