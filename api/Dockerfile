FROM node:22.2.0-alpine3.19

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 3000
