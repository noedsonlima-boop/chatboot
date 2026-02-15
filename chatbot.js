require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require("openai");
const express = require("express");
const QRCode = require("qrcode");

// ================= CONFIG =================
const MEU_NUMERO = "5511957966910@c.us";
let MODO_PRODUCAO = true;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historico = {};

// ================= CLIENT WHATSAPP =================
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ================= EVENTOS =================
let qrCodeAtual = null;

client.on('qr', (qr) => {
    qrCodeAtual = qr;
    console.log("📱 QR gerado. Acesse /qr para escanear.");
});

client.on('ready', () => {
    console.log('🚀 ENI - NTEC Pluservices ONLINE 24H');
});

client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Falha na autenticação:', msg);
});

// ================= FUNÇÃO IA =================
async function responderComIA(numero, texto) {

    if (!historico[numero]) {
        historico[numero] = [
            {
                role: "system",
                content: `
Você é ENI, atendente profissional da NTEC Pluservices.

Fluxo obrigatório:
1) Cumprimente: "Olá, eu sou a ENI da NTEC Pluservices 😊"
2) Pergunte o nome
3) Pergunte qual aparelho
4) Peça marca e modelo
5) Peça descrição detalhada do defeito
6) Incentive envio de foto
7) Se possível, sugira testes simples
8) Se não resolver, encaminhe para orçamento ou visita técnica
9) Sempre finalize direcionando para o próximo passo

Seja:
- Profissional
- Clara
- Organizada
- Estratégica
- Comercial de forma natural
`
            }
        ];
    }

    historico[numero].push({
        role: "user",
        content: texto
    });

    // Limite de histórico para não travar memória
    if (historico[numero].length > 15) {
        historico[numero].splice(1, 5);
    }

    const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: historico[numero],
        temperature: 0.6
    });

    const mensagem = resposta.choices[0].message.content;

    historico[numero].push({
        role: "assistant",
        content: mensagem
    });

    return mensagem;
}

// ================= RECEBIMENTO =================
client.on('message', async (msg) => {

    if (!msg.body) return;

    const texto = msg.body.trim();
    const numero = msg.from;

    if (!MODO_PRODUCAO && numero !== MEU_NUMERO) return;

    if (numero === MEU_NUMERO) {

        if (texto.toLowerCase() === 'teste') {
            MODO_PRODUCAO = false;
            await msg.reply('🧠 MODO TESTE ATIVADO');
            return;
        }

        if (texto.toLowerCase() === 'producao') {
            MODO_PRODUCAO = true;
            await msg.reply('🚀 MODO PRODUÇÃO ATIVADO');
            return;
        }
    }

    try {
        const resposta = await responderComIA(numero, texto);
        await msg.reply(resposta);
    } catch (erro) {
        console.log("ERRO IA:", erro);
        await msg.reply("⚠️ Sistema temporariamente instável. Tente novamente.");
    }
});

// ================= INICIALIZA =================
client.initialize();

// ================= PROTEÇÃO GLOBAL =================
process.on('unhandledRejection', (reason) => {
    console.log('⚠️ Erro não tratado:', reason);
});

process.on('uncaughtException', (error) => {
    console.log('⚠️ Exceção não capturada:', error);
});

// ================= SERVIDOR RAILWAY =================
const app = express();

app.get("/", (req, res) => {
    res.send("ENI - NTEC ONLINE 🚀");
});

app.get('/qr', async (req, res) => {
    if (!qrCodeAtual) {
        return res.send("QR ainda não gerado. Aguarde...");
    }

    const qrImage = await QRCode.toDataURL(qrCodeAtual);
    res.send(`
        <h2>Escaneie o QR abaixo:</h2>
        <img src="${qrImage}" />
    `);
});

// 🚀 PORTA OBRIGATÓRIA DO RAILWAY
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
    console.log("🌍 Servidor web ativo na porta " + PORT);
});
