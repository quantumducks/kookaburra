FROM node:18.16.0-alpine3.17

ENV NODE_ENV=production
RUN if [ {{registry}} != undefined ]; then npm set registry {{registry}}; fi
RUN if [ {{proxy}} != undefined ]; then npm set proxy {{proxy}}; fi
RUN npm i -g @toa.io/runtime@{{version}}

WORKDIR /service
ADD . .
RUN npm i

CMD toa serve .
