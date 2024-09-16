FROM node:20

COPY . /app

RUN npm -g insall pnpm

RUN pnpm ci

RUN pnpm build

CMD [ "pnpm start" ]