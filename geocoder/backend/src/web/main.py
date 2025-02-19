from aiohttp import web, WSMsgType
import aioredis
import json
import logging
import asyncio
from typing import Dict

from ..settings import (
    SERVER_HOST, 
    WEB_PORT, 
    REDIS_HOST, 
    REDIS_PORT,
    REDIS_CHANNEL_REQUESTS,
    REDIS_CHANNEL_RESULTS
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, web.WebSocketResponse] = {}
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
        
        # Подписываемся на канал результатов
        channel = await self.redis_sub.subscribe(REDIS_CHANNEL_RESULTS)
        self.channel = channel[0]
        
        logger.info("Connected to Redis and subscribed to results channel")

    async def start_result_listener(self):
        try:
            while await self.channel.wait_message():
                msg = await self.channel.get(encoding='utf-8')
                logger.info(f"Received from Redis channel: {msg}")
                try:
                    result_data = json.loads(msg)
                    client_id = result_data.pop('client_id', None)
                    if client_id and client_id in self.connections:
                        await self.connections[client_id].send_json(result_data)
                except json.JSONDecodeError:
                    logger.error("Failed to parse message from Redis")
        except Exception as e:
            logger.error(f"Result listener error: {str(e)}")

    async def handle_websocket(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        client_id = str(id(ws))
        self.connections[client_id] = ws
        logger.info(f"New client connected: {client_id}")

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    logger.info(f"Received WebSocket message: {msg.data}")
                    try:
                        data = json.loads(msg.data)
                        data['client_id'] = client_id
                        # Публикуем сообщение в канал запросов
                        await self.redis_pub.publish(
                            REDIS_CHANNEL_REQUESTS, 
                            json.dumps(data)
                        )
                    except json.JSONDecodeError:
                        await ws.send_json({
                            'type': 'error',
                            'message': 'Invalid JSON'
                        })
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f'WebSocket connection closed with exception {ws.exception()}')
        finally:
            self.connections.pop(client_id, None)
            logger.info(f"Client disconnected: {client_id}")

        return ws

    async def cleanup(self):
        if self.redis_sub:
            self.redis_sub.close()
            await self.redis_sub.wait_closed()
        if self.redis_pub:
            self.redis_pub.close()
            await self.redis_pub.wait_closed()

async def init_app():
    app = web.Application()
    ws_manager = WebSocketManager()
    await ws_manager.connect_redis()
    
    app['ws_manager'] = ws_manager
    app.router.add_get('/ws', ws_manager.handle_websocket)
    
    asyncio.create_task(ws_manager.start_result_listener())
    
    return app

if __name__ == '__main__':
    web.run_app(init_app(), host=SERVER_HOST, port=WEB_PORT) 