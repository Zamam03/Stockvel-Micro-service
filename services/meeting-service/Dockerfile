FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
EXPOSE 4004
CMD ["node", "src/index.js"]
