FROM node:alpine

COPY package.json package.json  
COPY console.sh console.sh
RUN npm install

# Add your source files
COPY . .  
CMD ["node","webserver.js"]  
