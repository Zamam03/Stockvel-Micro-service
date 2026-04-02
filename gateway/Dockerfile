FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --prefer-offline || (sleep 10 && npm install --prefer-offline) || (sleep 20 && npm install)

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
