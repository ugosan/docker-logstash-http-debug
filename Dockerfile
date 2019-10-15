FROM node:alpine

COPY package*.json ./  
COPY console.sh console.sh

RUN npm install

ENV TERM xterm-256color
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8  
ENV NCURSES_NO_UTF8_ACS=1

COPY . .  
WORKDIR app/server
CMD node webserver.js
