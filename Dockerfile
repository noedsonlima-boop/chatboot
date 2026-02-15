FROM node:18-bullseye

# Instala dependências do Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  libglib2.0-0 \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libxss1 \
  libasound2 \
  fonts-liberation \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todos os arquivos do projeto
COPY . .

# Porta usada pelo Railway
EXPOSE 3000

# Inicia o bot
CMD ["npm", "start"]