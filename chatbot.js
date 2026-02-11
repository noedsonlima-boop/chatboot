require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Sessão específica pro BOT
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "BOT-AGENTE"  // nome único pra não misturar sessões
  }),
  puppeteer: {
    headless: false,  →  headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  }
});

client.on("qr", (qr) => {
  console.log("📱 NOVO QR pro BOT (escaneie com WhatsApp Business):");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ BOT conectado com NOVO número!");
  console.log("📱 Número do bot:", client.info.wid.user);
});

client.on("message", async (message) => {
  console.log("Mensagem recebida:", message.body);
  await message.reply("🤖 Agente IA ativo! Sua mensagem foi recebida.");
});

client.initialize();