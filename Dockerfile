FROM node:boron

MAINTAINER Reekoh

RUN apt-get update && apt-get install -y build-essential

RUN mkdir -p /home/node/mapquest-geocoding-service
COPY . /home/node/mapquest-geocoding-service

WORKDIR /home/node/mapquest-geocoding-service

# Install dependencies
RUN npm install pm2 yarn -g
RUN yarn install

CMD ["pm2-docker", "--json", "app.yml"]