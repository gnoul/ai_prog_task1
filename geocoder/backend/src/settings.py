import os

# Настройки сервера
SERVER_HOST = '0.0.0.0'
WEB_PORT = 8080
QUEUE_PORT = 8081

# Redis настройки
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_CHANNEL_REQUESTS = 'geo_requests'
REDIS_CHANNEL_RESULTS = 'geo_results'

# Внешние API
NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search'
ELEVATION_API_URL = 'https://api.opentopodata.org/v1/aster30m'
WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'

# Таймауты запросов
REQUEST_TIMEOUT = 10

# Параметры запросов
NOMINATIM_PARAMS = {
    'format': 'json',
    'limit': 1
}

# Заголовки запросов
DEFAULT_HEADERS = {
    'User-Agent': 'CityMapService/1.0'
} 