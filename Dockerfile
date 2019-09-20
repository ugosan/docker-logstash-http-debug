FROM node:alpine

COPY package.json package.json  
COPY console.sh console.sh
RUN npm install
ENV TERM xterm-256color

COPY . .  
CMD ["node","webserver.js"]  
