import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const MINI_APP_URL = process.env.TELEGRAM_WEBAPP_URL; // e.g. https://pop-galaxy.up.railway.app

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match[1] || ""; // Referrer wallet or code

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

${startParam ? `🔗 *Referrer Verified:* \`${startParam}\`` : "⚠️ *Note:* A referrer is required to activate slots."}

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
