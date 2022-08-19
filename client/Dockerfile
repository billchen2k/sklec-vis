FROM node:14 as build
WORKDIR /app
COPY . .
EXPOSE 8080
ENV NODE_OPTIONS=--max_old_space_size=2048
# RUN npm install
# RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /srv/client/dist
# COPY ./dist /srv/client/dist   # Prebuilt
COPY ./site-prod.conf /etc/nginx/conf.d/default.conf