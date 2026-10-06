FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

ENV NODE_PATH=/app/node_modules

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
