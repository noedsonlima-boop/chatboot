FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
  chromium \
  libglib2.0-0 \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libxss1 \
  libasound2 \
  fonts-liberation \
  --no-install-recommends

WORKDIR /app

COPY package*.json ./
RUN npm install