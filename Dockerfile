# sudo docker run your/nice:tag npm run "bot:noshard, bot:shard, slash-commands:run, all:shard, all:noshard, ci, test"
FROM node:12.18.2-stretch-slim
RUN apt update -y && apt upgrade -y && apt install git -y
WORKDIR /sirubot
COPY . .
RUN npm install --save