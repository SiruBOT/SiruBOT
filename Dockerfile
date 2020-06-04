FROM node:12
WORKDIR /usr/src/sirubot
COPY package*.json ./
COPY ./settings.js ./settings.js
COPY . .
RUN npm install
CMD [ "node", "sharder.js" ]