FROM node:12.18.2-stretch-slim
RUN apt update -y && apt upgrade -y && apt install git -y
WORKDIR /usr/src/sirubot
COPY package*.json ./
COPY ./settings.js ./settings.js
COPY . .
RUN npm install
CMD [ "node", "sharder.js" ]
