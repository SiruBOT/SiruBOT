# Set base image to node:lts-alpine
FROM node:lts-alpine

# Install node.js dependencies, yarn (libc6-compat  https://github.com/nodejs/docker-node#nodealpine)
RUN apk add --no-cache libc6-compat yarn git

# Set workdir to /app
WORKDIR /app

# Copy deps files to /app
COPY package.json yarn.lock /app/

# Install dependencies
RUN yarn install

# Copy source files to /app
COPY . .

# Build files
RUN yarn run tsc --project ./tsconfig.json

# Run nodejs application
CMD ["node", "/app/build/index.js"]