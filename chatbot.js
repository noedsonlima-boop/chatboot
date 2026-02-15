require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require("openai");
const express = require("express");
const QRCode = require("qrcode");

// ================= CONFIG =================
const NUMERO_ASSISTENCIA = "5511971556192@c.us";
const NUMERO_IPTV = "5511941358474@c.us";
const MEU_NUMERO_TESTE = "5511957966910@c.us";

let MODO_TESTE = true;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const historico = {};

// ================= CLIENT WHATSAPP =================
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/data/session' // 🔥 sessão persistente real Railway
    }),
    puppeteer: {
        headless: true,
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
    console.log('🚀 ENI - NTEC MULTIAGENTE ONLINE 24H');
});

client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

client.on('auth_failure', (msg) => {
    console.log('❌ Falha na autenticação:', msg);
});

// ================= DETECTAR TIPO DE AGENTE =================
function detectarAgente(texto) {
    const t = texto.toLowerCase();

    if (t.includes("iptv") || t.includes("teste") || t.includes("plano") || t.includes("smart on")) {
        return "IPTV";
    }

    if (t.includes("financeiro") || t.includes("pagamento") || t.includes("pix")) {
        return "FINANCEIRO";
    }

    return "ASSISTENCIA";
}

// ================= PROMPTS POR AGENTE =================
function getPrompt(agente) {

    if (agente === "IPTV") {
        return `
Você é ENI IPTV da NTEC.

Fluxo:
1) Cumprimente
2) Peça primeiro nome
3) Pergunte modelo da TV
4) Oriente instalar Smart On
5) Explique teste de 4 horas
6) Valores: 35 mensal | 75 trimestral
7) Encaminhe para número 11 94135-8474
Nunca passe número pessoal.
`;
    }

    if (agente === "FINANCEIRO") {
        return `
Você é ENI Financeiro da NTEC.

Explique pagamentos, PIX, confirmação.
Nunca passe número pessoal.
Se for IPTV, encaminhe para 11 94135-8474.
`;
    }

    return `
Você é ENI Atendimento da NTEC Pluservices.

Fluxo obrigatório:
1) Cumprimente
2) Pergunte nome
3) Pergunte aparelho
4) Marca e modelo
5) Descrição defeito
6) Peça foto
7) Sugira testes simples
8) Se não resolver, orientar trazer para orçamento
Número oficial assistência: 11 97155-6192
Nunca passe número pessoal.
`;
}

// ================= IA =================
async function responderComIA(numero, texto) {

    const agente = detectarAgente(texto);

    if (!historico[numero]) {
        historico[numero] = [
            {
                role: "system",
                content: getPrompt(agente)
            }
        ];
    }

    historico[numero].push({
        role: "user",
        content: texto
    });

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

    if (MODO_TESTE && numero !== MEU_NUMERO_TESTE) return;

    if (numero === MEU_NUMERO_TESTE) {
        if (texto.toLowerCase() === "liberar") {
            MODO_TESTE = false;
            await msg.reply("🚀 MODO PRODUÇÃO LIBERADO");
            return;
        }
    }

    try {
        const resposta = await responderComIA(numero, texto);
        await msg.reply(resposta);
    } catch (erro) {
        console.log("ERRO IA:", erro);
        await msg.reply("⚠️ Sistema temporariamente instável.");
    }
});

// ================= INICIALIZA =================
client.initialize();

// ================= SERVIDOR =================
const app = express();

app.get("/", (req, res) => {
    res.send("ENI - NTEC MULTIAGENTE ONLINE 24H 🚀");
});

app.get('/qr', async (req, res) => {
    if (!qrCodeAtual) {
        return res.send("QR ainda não gerado.");
    }

    const qrImage = await QRCode.toDataURL(qrCodeAtual);
    res.send(`<img src="${qrImage}" />`);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Servidor web ativo na porta ${PORT}`);
});
