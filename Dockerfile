# node.js image
FROM node:22-alpine AS base

# apk update
RUN apk update && apk upgrade && apk add --no-cache libc6-compat

# Install yarn
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

FROM base AS runner
WORKDIR /app

# Build arguments
ARG GIT_HASH
ARG GIT_BRANCH

# Set environment variable
ENV GIT_HASH=${GIT_HASH} YARN_VERSION=4.6.0 GIT_BRANCH=${GIT_BRANCH}

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn install --immutable

COPY . .

# Build the app (in standalone mode based on next.config.js)
RUN yarn build

CMD ["yarn", "start"]