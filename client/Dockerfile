FROM node:14 as build
WORKDIR /app
ADD ./package.json /app/package.json
RUN npm install -g pnpm
RUN pnpm install
COPY . .
# ENV NODE_OPTIONS=--max_old_space_size=2048
RUN pnpm build

FROM nginx:stable-alpine
COPY --from=build /app/dist /srv/client/dist
# COPY ./dist /srv/client/dist   # Prebuilt
COPY ./site-prod.conf /etc/nginx/conf.d/default.conf