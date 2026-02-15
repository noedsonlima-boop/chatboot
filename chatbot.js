require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require("openai");
const express = require("express");

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
client.on('qr', (qr) => {
    console.log('📱 ESCANEIE O QR CODE:');
    qrcode.generate(qr, { small: true });
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
1) Cumprimente e diga: "Olá, eu sou a ENI da NTEC Pluservices 😊"
2) Pergunte o nome
3) Pergunte qual aparelho
4) Peça marca e modelo
5) Peça descrição do defeito
6) Incentive envio de foto
7) Conduza para orçamento
8) Sempre finalize direcionando para o próximo passo

Seja:
- Profissional
- Clara
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
            msg.reply('🧠 MODO TESTE ATIVADO');
            return;
        }

        if (texto.toLowerCase() === 'producao') {
            MODO_PRODUCAO = true;
            msg.reply('🚀 MODO PRODUÇÃO ATIVADO');
            return;
        }
    }

    try {
        const resposta = await responderComIA(numero, texto);
        await msg.reply(resposta);
    } catch (erro) {
        console.log("ERRO IA:", erro);
        await msg.reply("⚠️ Sistema temporariamente instável. Tente novamente em instantes.");
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
    res.send("ENI - NTEC ONLINE");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor web ativo");
});