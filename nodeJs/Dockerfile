FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV API_HOST=localhost

EXPOSE 8000

CMD ["npm", "start"]
