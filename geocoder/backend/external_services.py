from aiohttp import ClientSession, ClientTimeout
import logging
from typing import Optional, Dict, Any

from settings import (
    NOMINATIM_API_URL, 
    ELEVATION_API_URL, 
    WEATHER_API_URL,
    REQUEST_TIMEOUT,
    NOMINATIM_PARAMS,
    DEFAULT_HEADERS
)

logger = logging.getLogger(__name__)

async def make_request(url: str, params: Dict[str, Any]) -> Optional[Dict]:
    """Выполняет HTTP запрос к внешнему сервису."""
    timeout = ClientTimeout(total=REQUEST_TIMEOUT)
    try:
        logger.info(f"Making request to {url} with params: {params}")
        async with ClientSession(timeout=timeout, headers=DEFAULT_HEADERS) as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Request failed: {url}, status: {response.status}")
                    response_text = await response.text()
                    logger.error(f"Response body: {response_text}")
                    return None
                    
                data = await response.json()
                logger.info(f"Received response from {url}")
                return data
    except Exception as e:
        logger.error(f"Request error: {url}, error: {str(e)}")
        return None

async def get_coordinates(city: str) -> Optional[Dict]:
    """Получает координаты города."""
    params = {**NOMINATIM_PARAMS, 'q': city}
    data = await make_request(NOMINATIM_API_URL, params)
    
    if not data or not isinstance(data, list) or not data:
        return None

    return {
        'lat': float(data[0]['lat']),
        'lon': float(data[0]['lon'])
    }

async def get_elevation(lat: float, lon: float) -> Optional[float]:
    """Получает высоту над уровнем моря."""
    params = {'locations': f'{lat},{lon}'}
    data = await make_request(ELEVATION_API_URL, params)
    
    if not data or 'results' not in data or not data['results']:
        return None

    return data['results'][0]['elevation']

async def get_weather(lat: float, lon: float) -> Optional[Dict]:
    """Получает данные о погоде."""
    params = {
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,relative_humidity_2m,weather_code',
        'timezone': 'auto'
    }
    
    logger.info(f"Requesting weather data for coordinates: lat={lat}, lon={lon}")
    data = await make_request(WEATHER_API_URL, params)
    
    if not data:
        logger.error("No data received from weather API")
        return None
        
    if 'current' not in data:
        logger.error(f"Unexpected weather API response format: {data}")
        return None

    try:
        current = data['current']
        # Конвертируем код погоды в описание
        weather_description = get_weather_description(current.get('weather_code'))
        
        return {
            'temperature': current.get('temperature_2m'),
            'humidity': current.get('relative_humidity_2m'),
            'description': weather_description
        }
    except Exception as e:
        logger.error(f"Error parsing weather data: {str(e)}")
        return None

def get_weather_description(code: Optional[int]) -> Optional[str]:
    """Преобразует код погоды в текстовое описание."""
    if code is None:
        return None
        
    weather_codes = {
        0: "Ясно",
        1: "Преимущественно ясно",
        2: "Переменная облачность",
        3: "Пасмурно",
        45: "Туман",
        48: "Изморозь",
        51: "Легкая морось",
        53: "Умеренная морось",
        55: "Сильная морось",
        61: "Небольшой дождь",
        63: "Умеренный дождь",
        65: "Сильный дождь",
        71: "Небольшой снег",
        73: "Умеренный снег",
        75: "Сильный снег",
        77: "Снежные зерна",
        80: "Небольшой ливень",
        81: "Умеренный ливень",
        82: "Сильный ливень",
        85: "Небольшой снегопад",
        86: "Сильный снегопад",
        95: "Гроза",
        96: "Гроза с небольшим градом",
        99: "Гроза с сильным градом"
    }
    
    return weather_codes.get(code, "Неизвестные погодные условия") 