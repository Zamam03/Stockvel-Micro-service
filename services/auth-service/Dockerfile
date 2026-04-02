FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --prefer-offline || (sleep 10 && npm install --prefer-offline) || (sleep 20 && npm install)

# We will mount the shared folder via docker-compose instead of copying to ensure live updates
COPY . .

EXPOSE 4001

CMD ["node", "src/index.js"]
