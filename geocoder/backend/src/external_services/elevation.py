from aiohttp import ClientSession, ClientTimeout
from typing import Optional
import logging

from ..settings import (
    ELEVATION_API_URL,
    REQUEST_TIMEOUT,
    DEFAULT_HEADERS
)

logger = logging.getLogger(__name__)

async def get_elevation(lat: float, lon: float) -> Optional[float]:
    """Получает высоту над уровнем моря."""
    params = {'locations': f'{lat},{lon}'}
    timeout = ClientTimeout(total=REQUEST_TIMEOUT)

    try:
        async with ClientSession(timeout=timeout, headers=DEFAULT_HEADERS) as session:
            async with session.get(ELEVATION_API_URL, params=params) as response:
                if response.status != 200:
                    logger.error(f"Elevation request failed: status {response.status}")
                    return None
                    
                data = await response.json()
                if not data or 'results' not in data or not data['results']:
                    return None

                return data['results'][0]['elevation']
    except Exception as e:
        logger.error(f"Elevation error: {str(e)}")
        return None 