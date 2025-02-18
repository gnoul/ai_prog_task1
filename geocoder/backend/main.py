from aiohttp import web, WSMsgType
import json
import logging
from typing import Optional

from external_services import get_coordinates, get_elevation, get_weather
from settings import SERVER_HOST, SERVER_PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            logger.info(f'Received message: {msg.data}')
            try:
                data = json.loads(msg.data)
                
                if data.get('type') == 'search':
                    # Поиск города
                    city = data.get('city')
                    if not city:
                        await ws.send_json({
                            'type': 'error',
                            'message': 'City parameter is required'
                        })
                        continue

                    coordinates = await get_coordinates(city)
                    if not coordinates:
                        await ws.send_json({
                            'type': 'error',
                            'message': 'City not found'
                        })
                        continue

                    await ws.send_json({
                        'type': 'coordinates',
                        'data': {
                            'coordinates': coordinates,
                            'city': city
                        }
                    })

                elif data.get('type') == 'map_center':
                    # Получение данных для центра карты
                    lat = data.get('lat')
                    lon = data.get('lon')
                    if lat is None or lon is None:
                        continue

                    # Получаем высоту и погоду параллельно
                    elevation = await get_elevation(lat, lon)
                    weather = await get_weather(lat, lon)

                    if elevation is not None:
                        await ws.send_json({
                            'type': 'elevation',
                            'data': {'elevation': elevation}
                        })

                    if weather is not None:
                        await ws.send_json({
                            'type': 'weather',
                            'data': weather
                        })

            except json.JSONDecodeError:
                await ws.send_json({
                    'type': 'error',
                    'message': 'Invalid JSON'
                })
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                await ws.send_json({
                    'type': 'error',
                    'message': 'Internal server error'
                })

        elif msg.type == WSMsgType.ERROR:
            logger.error(f'WebSocket connection closed with exception {ws.exception()}')

    return ws

app = web.Application(debug=True)
app.router.add_get('/ws', websocket_handler)

if __name__ == '__main__':
    web.run_app(app, host=SERVER_HOST, port=SERVER_PORT) 