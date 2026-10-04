import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const token = process.env.TELEGRAM_BOT_TOKEN;

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/tonconnect-manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(__dirname, 'tonconnect-manifest.json'));
});
// Start Server
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// Start Telegram Bot
if (token) {
  const bot = new TelegramBot(token, { polling: true });
  console.log('POP Galaxy Telegram Bot engine active.');

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      '🌌 *Welcome to POP Galaxy Decentralized Ecosystem!*\n\nTap the launch button below to enter the station matrix.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Launch POP Galaxy',
                web_app: { url: 'https://pop-glaxy-production.up.railway.app' }
              }
            ]
          ]
        }
      }
    );
  });
}
 
