import asyncio
import aioredis
import json
import logging
from typing import Dict, Any

from ..settings import (
    REDIS_HOST,
    REDIS_PORT,
    REDIS_CHANNEL_REQUESTS,
    REDIS_CHANNEL_RESULTS
)
from ..external_services import get_coordinates, get_elevation, get_weather

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QueueWorker:
    def __init__(self):
        self.redis_pub = None
        self.redis_sub = None

    async def connect_redis(self):
        # Создаем отдельные подключения для публикации и подписки
        self.redis_pub = await aioredis.create_redis_pool(
            f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
        )
        self.redis_sub = await aioredis.create_redis_pool(
            f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
        )
        
        # Подписываемся на канал запросов
        channel = await self.redis_sub.subscribe(REDIS_CHANNEL_REQUESTS)
        self.channel = channel[0]
        
        logger.info("Connected to Redis and subscribed to requests channel")

    async def process_search(self, data: Dict[str, Any]) -> None:
        city = data.get('city')
        client_id = data.get('client_id')

        if not city or not client_id:
            return

        coordinates = await get_coordinates(city)
        if not coordinates:
            await self.send_result({
                'type': 'error',
                'message': 'City not found',
                'client_id': client_id
            })
            return

        await self.send_result({
            'type': 'coordinates',
            'data': {
                'coordinates': coordinates,
                'city': city
            },
            'client_id': client_id
        })

    async def process_map_center(self, data: Dict[str, Any]) -> None:
        lat = data.get('lat')
        lon = data.get('lon')
        client_id = data.get('client_id')

        if lat is None or lon is None or not client_id:
            return

        elevation = await get_elevation(lat, lon)
        if elevation is not None:
            await self.send_result({
                'type': 'elevation',
                'data': {'elevation': elevation},
                'client_id': client_id
            })

        weather = await get_weather(lat, lon)
        if weather is not None:
            await self.send_result({
                'type': 'weather',
                'data': weather,
                'client_id': client_id
            })

    async def send_result(self, result: Dict[str, Any]) -> None:
        logger.info(f"Publishing result: {result}")
        await self.redis_pub.publish(
            REDIS_CHANNEL_RESULTS,
            json.dumps(result)
        )

    async def start(self):
        await self.connect_redis()
        
        try:
            while await self.channel.wait_message():
                msg = await self.channel.get(encoding='utf-8')
                logger.info(f"Received message from channel: {msg}")
                try:
                    message = json.loads(msg)
                    if message.get('type') == 'search':
                        await self.process_search(message)
                    elif message.get('type') == 'map_center':
                        await self.process_map_center(message)
                except json.JSONDecodeError:
                    logger.error("Failed to parse message from Redis")
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
        except Exception as e:
            logger.error(f"Channel listener error: {str(e)}")

    async def cleanup(self):
        if self.redis_sub:
            self.redis_sub.close()
            await self.redis_sub.wait_closed()
        if self.redis_pub:
            self.redis_pub.close()
            await self.redis_pub.wait_closed()

async def main():
    worker = QueueWorker()
    try:
        await worker.start()
    finally:
        await worker.cleanup()

if __name__ == '__main__':
    asyncio.run(main()) 