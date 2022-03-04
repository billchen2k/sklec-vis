FROM node:14 as build
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn
COPY . .
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN yarn build

FROM nginx:stable-alpine
COPY --from=build /app/dist /srv/client/dist
COPY ./site-prod.conf /etc/nginx/conf.d/default.conf