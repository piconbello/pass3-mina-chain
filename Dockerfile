FROM node:18.9-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Path: Dockerfile

FROM node:18.9-alpine

WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock ./

# TODO :: remove me
COPY --from=build /app/.env ./

RUN yarn install --frozen-lockfile --production

COPY --from=build /app/dist ./dist

CMD ["yarn", "start"]
