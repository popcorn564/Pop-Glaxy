import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Web page route for Telegram Mini App
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>POP Galaxy</title>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: #0b0e14;
          color: #ffffff;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        .container {
          margin-top: 50px;
        }
        h1 {
          color: #a855f7;
        }
        p {
          color: #94a3b8;
          font-size: 16px;
        }
        .card {
          background: #1e293b;
          padding: 20px;
          border-radius: 12px;
          margin: 20px auto;
          max-width: 320px;
          border: 1px solid #334155;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌌 POP Galaxy 🌌</h1>
        <div class="card">
          <h3>Station Connected!</h3>
          <p>Matrix Hub & Rewards System Ready.</p>
        </div>
      </div>
      <script>
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      </script>
    </body>
    </html>
  `);
});

// Express server start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// Telegram Bot Engine
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const MINI_APP_URL = process.env.TELEGRAM_WEBAPP_URL;

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1] || "";

  const webAppLaunchUrl = startParam 
    ? `${MINI_APP_URL}?tgWebAppStartParam=${startParam}` 
    : MINI_APP_URL;

  const welcomeMessage = `
🌌 *WELCOME TO POP GALAXY* 🌌
The premier decentralized matrix ecosystem on TON.

🚀 *Key Mechanics:*
• 10 Upgradeable Matrix Tiers
• 20% Direct Treasury Split
• 4-Tier Referral Spillover (40% / 20% / 10% / 10%)
• Automated Weekly USDT Reward Conversion via STON.fi DEX

${startParam ? `🔗 *Referrer Verified:* \`${startParam}\`` : "⚠️️ *Note:* A referrer is required to activate slots."}

Click the button below to launch the station:
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Launch POP Galaxy",
            web_app: { url: webAppLaunchUrl }
          }
        ],
        [
          {
            text: "💬 Official Community",
            url: "https://t.me/PopGalaxyTON"
          }
        ]
      ]
    }
  });
});

console.log("POP Galaxy Telegram Bot engine active.");
