FROM node:18-alpine

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./

# Создаем production build
RUN npm run build

# Устанавливаем легковесный веб-сервер
RUN npm install -g serve

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["serve", "-s", "build", "-l", "3000"] 