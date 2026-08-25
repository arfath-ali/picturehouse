FROM node:20-alpine as builder
WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install

COPY . .

RUN npm run build:client
RUN npm run build:server


FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install --omit=dev

COPY --from=builder /app/client/index.html /app/client/
COPY --from=builder /app/client/dist /app/client/dist
COPY --from=builder /app/server/dist /app/server/dist

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
