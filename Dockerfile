FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"

RUN npm run build

CMD ["npm", "start"]