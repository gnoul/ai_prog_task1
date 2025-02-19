from aiohttp import ClientSession, ClientTimeout
from typing import Optional, Dict
import logging

from ..settings import (
    NOMINATIM_API_URL,
    REQUEST_TIMEOUT,
    NOMINATIM_PARAMS,
    DEFAULT_HEADERS
)

logger = logging.getLogger(__name__)

async def get_coordinates(city: str) -> Optional[Dict]:
    """Получает координаты города."""
    params = {**NOMINATIM_PARAMS, 'q': city}
    timeout = ClientTimeout(total=REQUEST_TIMEOUT)

    try:
        async with ClientSession(timeout=timeout, headers=DEFAULT_HEADERS) as session:
            async with session.get(NOMINATIM_API_URL, params=params) as response:
                if response.status != 200:
                    logger.error(f"Geocoding request failed: status {response.status}")
                    return None
                    
                data = await response.json()
                if not data or not isinstance(data, list) or not data:
                    return None

                return {
                    'lat': float(data[0]['lat']),
                    'lon': float(data[0]['lon'])
                }
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return None 