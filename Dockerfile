# Set base image to node:lts-alpine
FROM node:lts-alpine
# Install node.js dependencies, yarn (libc6-compat  https://github.com/nodejs/docker-node#nodealpine)
RUN apk add --no-cache libc6-compat  yarn 
# Set workdir to /app
WORKDIR /opt/sirubot
# Copy files to /app
COPY . .
# Install dependencies
RUN  yarn --frozen-lockfile
# Build files
RUN yarn run build:ts
# Set NODE_ENV to production
ENV PORT 3000 NODE_ENV production
# Run next.js application
CMD ["node", "./build"]