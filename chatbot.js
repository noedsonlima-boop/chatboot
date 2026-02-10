require("dotenv").config();

const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on("qr", qr => {
  console.log("📲 Escaneie o QR Code:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado!");
});

client.on("message", async msg => {
  try {

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const pergunta = msg.body;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é atendente da NTEC Pluservices.
Seja profissional, educado e vendedor.

Serviços:
• Conserto celular
• TV
• Computadores
• Câmeras
• IPTV NPLAY

Preço IPTV:
35/mês ou 75/3 meses

Sempre tente fechar venda.
`
        },
        {
          role: "user",
          content: pergunta
        }
      ]
    });

    await client.sendMessage(msg.from, resposta.choices[0].message.content);

  } catch (e) {
    console.log(e);
  }
});

client.initialize();
