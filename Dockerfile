FROM node:18.14-alpine
ENV PORT=8080
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
CMD [ "npm", "run", "docker" ]
