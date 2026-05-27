import { Router } from 'express';
import { addBot, removeBot, getActiveBots } from './botManager.js';
import { getSettings, updateSettings } from './globalSettings.js';

export const botRouter = Router();

// Get list of active bots
botRouter.get('/', (req, res) => {
  const bots = getActiveBots();
  res.json({ success: true, bots });
});

// Settings Endpoints
botRouter.get('/settings', (req, res) => {
  res.json({ success: true, settings: getSettings() });
});

botRouter.post('/settings', (req, res) => {
  const { apiKey, globalBotCode } = req.body;
  updateSettings(apiKey, globalBotCode);
  res.json({ success: true, settings: getSettings() });
});

// Auto-Deploy endpoint (GET / POST)
const handleAutoDeploy = async (req: any, res: any) => {
  const { token, key } = req.method === 'GET' ? req.query : req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'Telegram bot token is required' });
  }
  
  if (key !== getSettings().apiKey) {
    return res.status(403).json({ success: false, error: 'Invalid API key' });
  }

  try {
    const { globalBotCode } = getSettings();
    removeBot(token as string); // Try to stop it if it's already there before creating a new one
    const botInfo = await addBot(token as string, undefined, globalBotCode);
    res.json({ success: true, message: 'Bot started successfully via Auto-Deploy API', bot: botInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

botRouter.get('/auto-deploy', handleAutoDeploy);
botRouter.post('/auto-deploy', handleAutoDeploy);

// Start a new bot (Manual from UI)
botRouter.post('/start', async (req, res) => {
  const { token, name, code } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Telegram bot token is required' });
  }

  try {
    const botInfo = await addBot(token, name, code);
    res.json({ success: true, message: 'Bot started successfully', bot: botInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop a running bot
botRouter.post('/stop', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }

  const success = removeBot(token);
  if (success) {
    res.json({ success: true, message: 'Bot stopped successfully' });
  } else {
    res.status(404).json({ success: false, error: 'Bot not found or not running' });
  }
});
