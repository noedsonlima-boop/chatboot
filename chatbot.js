const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const OpenAI = require("openai");

// ================= CONFIG =================
const MEU_NUMERO = "5511957966910@c.us";
let MODO_PRODUCAO = false;

const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const historico = {};
// ==========================================

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('📱 ESCANEIE O QR CODE:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🚀 IA VENDEDORA ONLINE');
});

async function responderComIA(numero, texto) {

    if (!historico[numero]) {
        historico[numero] = [
            {
                role: "system",
                content: `
Você é atendente profissional da NTEC Pluservices.

Objetivo:
- Atender clientes
- Entender o problema
- Pedir modelo do aparelho
- Pedir descrição do defeito
- Incentivar envio de foto
- Conduzir para orçamento
- Agir como vendedor estratégico

Seja:
- Educado
- Direto
- Profissional
- Natural
- Comercial (leve persuasão)

Sempre conduza para próximo passo.
`
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
        temperature: 0.7
    });

    const mensagem = resposta.choices[0].message.content;

    historico[numero].push({
        role: "assistant",
        content: mensagem
    });

    return mensagem;
}

client.on('message', async (msg) => {

    const texto = msg.body;
    const numero = msg.from;

    if (numero === MEU_NUMERO) {

        if (texto.toLowerCase() === 'producao') {
            MODO_PRODUCAO = true;
            msg.reply('🚀 MODO PRODUÇÃO ATIVADO');
            return;
        }

        if (texto.toLowerCase() === 'teste') {
            MODO_PRODUCAO = false;
            msg.reply('🧠 MODO TESTE ATIVADO');
            return;
        }
    }

    if (MODO_PRODUCAO || numero === MEU_NUMERO) {

        try {
            const resposta = await responderComIA(numero, texto);
            msg.reply(resposta);
        } catch (erro) {
            console.log(erro);
            msg.reply("Erro na IA. Verifique API Key ou crédito.");
        }

    }

});

client.initialize();

// Mantém servidor vivo no Railway
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot NTEC rodando 🚀");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor web ativo");
});

