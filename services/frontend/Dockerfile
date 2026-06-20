FROM node:22-alpine

WORKDIR /app

COPY app/package*.json ./

RUN npm install

EXPOSE ${FE_PORT}

CMD [ "npm", "run", "dev" ]

