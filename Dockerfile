ARG DOCKER_REPO=docker.io/library

FROM ${DOCKER_REPO}/node:22-alpine AS builder
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm --registry $NPM_REGISTRY install npm -g

COPY package.json /package.json
COPY _common /_common
RUN npm --registry $NPM_REGISTRY install --omit=optional

COPY src /src
COPY tsconfig.json /tsconfig.json

RUN npm run build

COPY default_config.toml /dist/config.toml

RUN node /dist/app.js --version

FROM ${DOCKER_REPO}/node:22-alpine

USER root

ENV NODE_ENV=production
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /keep-assistant

ENTRYPOINT [ "node" ]
CMD [ "app.js", "--config", "config.toml" ]

COPY --from=builder /dist /keep-assistant

RUN chown -R node:node /keep-assistant
USER node

RUN node --version && \
    npm --version && \
    cd /keep-assistant && \
    npm ci && \
    node app.js -v