require("dotenv").config();
const BOT_ATIVO = process.env.BOT_ATIVO === "true";
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./session"
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  }
});
// deploy fix A
client.on("qr", qr => {
  console.log("📲 Escaneie o QR Code abaixo:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Bot conectado com sucesso!");
});

client.on("message", async msg => {
  if (!BOT_ATIVO) return; // DESLIGAR O BOT
  if (msg.from.includes("@g.us")) return; // ingnora grupos
  if (!msg.body) return;

  console.log("📩 Mensagem recebida:", msg.body);

  if (msg.body.toLowerCase() === "oi") {
    await msg.reply("Oi 👋 Estou online e funcionando!");
  }
});

client.initialize();
