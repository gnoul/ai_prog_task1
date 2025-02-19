FROM python:3.13-slim

WORKDIR /app

# Копируем requirements.txt
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY src/ ./src/

ARG SERVICE_TYPE
ENV SERVICE_TYPE=${SERVICE_TYPE}

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD python -m src.${SERVICE_TYPE}.main 