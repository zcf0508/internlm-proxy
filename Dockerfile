FROM node:20.14.0-slim

WORKDIR /app

COPY . .

RUN npm install

ENV INTERNAL_API_KEY=your_api_key_here
ENV PORT=8653

EXPOSE ${PORT}

CMD ["npm", "run", "dev"]
