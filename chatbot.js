require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require("openai");
const express = require("express");

// ================= CONFIG =================
const MEU_NUMERO = "5511957966910@c.us";
let MODO_PRODUCAO = true; // já inicia em produção

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historico = {};
// ==========================================

// 🔥 CLIENT CONFIG PROFISSIONAL (RAILWAY SAFE)
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ================= EVENTOS WHATSAPP =================

client.on('qr', (qr) => {
    console.log('📱 ESCANEIE O QR CODE:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🚀 IA NTEC ONLINE 24H');
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

Fluxo obrigatório de atendimento:

1) Cumprimente e diga: "Olá, eu sou a ENI da NTEC Pluservices 😊"
2) Pergunte o nome da pessoa
3) Pergunte qual aparelho precisa de assistência
4) Peça marca e modelo
5) Peça descrição detalhada do problema
6) Sugira testes simples se possível
7) Se necessário, encaminhe para orçamento ou visita técnica
8) Sempre conduza para o próximo passo

Seja:
- Educada
- Profissional
- Clara
- Estratégica
- Comercial de forma natural

Sempre finalize direcionando para ação.
`
            }
        ];
    }

    historico[numero].push({
        role: "user",
        content: texto
    });

    // Limite inteligente de histórico (evita travar Railway)
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

// ================= RECEBIMENTO MENSAGENS =================

client.on('message', async (msg) => {

    if (!msg.body) return;

    const texto = msg.body.trim();
    const numero = msg.from;

    if (!MODO_PRODUCAO && numero !== MEU_NUMERO) return;

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
    res.send("Bot NTEC rodando 🚀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor web ativo");
});
