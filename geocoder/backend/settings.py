# Настройки сервера
SERVER_HOST = '0.0.0.0'
SERVER_PORT = 8080

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