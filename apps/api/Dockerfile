FROM node:22-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/

RUN npm install

EXPOSE 3001

ENV NODE_ENV=production
ENV HOST=0.0.0.0

CMD ["npx", "tsx", "apps/api/src/index.ts"]
