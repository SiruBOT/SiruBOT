# sudo docker run your/nice:tag npm run "bot:noshard, bot:shard, slash-commands:run, all:shard, all:noshard, ci, test"
FROM node:lts-stretch-slim
WORKDIR /sirubot
COPY . .
RUN yarn install