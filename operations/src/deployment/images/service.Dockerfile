FROM node:18.16.0-alpine3.17

ENV NODE_ENV=production
RUN if [ "{{runtime.registry}}" != "" ]; then npm set registry {{runtime.registry}}; fi
RUN if [ "{{runtime.proxy}}" != "" ]; then npm set proxy {{runtime.proxy}}; fi
RUN npm i -g @toa.io/runtime@{{runtime.version}} --omit=dev

WORKDIR /service
COPY --chown=node:node . /service

RUN npm i --omit=dev

USER node
CMD toa serve .
