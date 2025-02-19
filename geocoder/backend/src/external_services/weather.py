from aiohttp import ClientSession, ClientTimeout
from typing import Optional, Dict
import logging

from ..settings import (
    WEATHER_API_URL,
    REQUEST_TIMEOUT,
    DEFAULT_HEADERS
)

logger = logging.getLogger(__name__)

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

async def get_weather(lat: float, lon: float) -> Optional[Dict]:
    """Получает данные о погоде."""
    params = {
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,relative_humidity_2m,weather_code',
        'timezone': 'auto'
    }
    timeout = ClientTimeout(total=REQUEST_TIMEOUT)
    
    try:
        async with ClientSession(timeout=timeout, headers=DEFAULT_HEADERS) as session:
            async with session.get(WEATHER_API_URL, params=params) as response:
                if response.status != 200:
                    logger.error(f"Weather request failed: status {response.status}")
                    return None
                    
                data = await response.json()
                if not data or 'current' not in data:
                    return None

                current = data['current']
                weather_description = get_weather_description(current.get('weather_code'))
                
                return {
                    'temperature': current.get('temperature_2m'),
                    'humidity': current.get('relative_humidity_2m'),
                    'description': weather_description
                }
    except Exception as e:
        logger.error(f"Weather error: {str(e)}")
        return None 