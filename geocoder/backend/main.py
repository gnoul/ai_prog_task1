from aiohttp import web
import aiohttp
from aiohttp import ClientTimeout
from aiohttp.web import middleware
import json

routes = web.RouteTableDef()

@middleware
async def cors_middleware(request, handler):
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@routes.get('/api/search')
async def search_city(request):
    city = request.query.get('city')
    if not city:
        return web.Response(
            text=json.dumps({'error': 'City parameter is required'}),
            status=400,
            content_type='application/json'
        )

    timeout = ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        try:
            url = f'https://nominatim.openstreetmap.org/search'
            params = {
                'q': city,
                'format': 'json',
                'limit': 1
            }
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    return web.Response(
                        text=json.dumps({'error': 'Failed to fetch coordinates'}),
                        status=500,
                        content_type='application/json'
                    )
                
                data = await response.json()
                if not data:
                    return web.Response(
                        text=json.dumps({'error': 'City not found'}),
                        status=404,
                        content_type='application/json'
                    )

                result = {
                    'coordinates': {
                        'lat': float(data[0]['lat']),
                        'lon': float(data[0]['lon'])
                    },
                    'city': city
                }
                return web.Response(
                    text=json.dumps(result),
                    content_type='application/json'
                )
        except Exception as e:
            return web.Response(
                text=json.dumps({'error': str(e)}),
                status=500,
                content_type='application/json'
            )

app = web.Application(middlewares=[cors_middleware])
app.add_routes(routes)

if __name__ == '__main__':
    web.run_app(app, port=8080) 