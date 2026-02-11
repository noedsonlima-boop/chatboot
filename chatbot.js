require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "BOT-AGENTE"  // sessão única
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", 
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding"
    ]
  }
});

client.on("qr", (qr) => {
  console.log("📱 QR para escanear (WhatsApp Business):");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ AGENTE CONECTADO 24/7!");
  console.log("📱 Número:", client.info?.wid?.user || "conectado");
});

client.on("message", async (message) => {
  console.log("📨 Recebida:", message.body);
  await message.reply("🤖 Agente IA ativo! Mensagem recebida.");
});

client.on("disconnected", (reason) => {
  console.log("❌ Desconectado:", reason);
  client.initialize();  // reconecta auto
});

client.initialize();