FROM node:20

COPY . /app

RUN npm ci

RUN npm run build

CMD [ "npm start" ]