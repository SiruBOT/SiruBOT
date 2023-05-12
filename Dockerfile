FROM node:lts-alpine

WORKDIR /opt/sirubot

COPY . .

RUN apt-get update -y && \
    apt-get install --no-install-recommends -y

RUN yarn install && yarn run build:ts

CMD [ "node", "./build" ]
