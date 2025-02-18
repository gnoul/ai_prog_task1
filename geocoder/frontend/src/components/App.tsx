import React, { useState, useCallback } from 'react';
import MapComponent from './Map';
import SearchForm from './SearchForm';
import { Coordinates, WebSocketMessage, WeatherResponse } from '../types/types';
import useWebSocket from '../hooks/useWebSocket';

const App: React.FC = () => {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [elevation, setElevation] = useState<number | null>(null);
    const [weather, setWeather] = useState<WeatherResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMessage = useCallback((message: WebSocketMessage) => {
        if (message.type === 'error') {
            setError(message.message || 'Произошла ошибка');
            setCoordinates(null);
            setElevation(null);
        } else if (message.type === 'coordinates' && message.data) {
            setCoordinates((message.data as any).coordinates);
            setError(null);
        } else if (message.type === 'elevation' && message.data) {
            setElevation((message.data as any).elevation);
        } else if (message.type === 'weather' && message.data) {
            setWeather(message.data as WeatherResponse);
        }
    }, []);

    const { sendMessage, isConnected } = useWebSocket({
        onMessage: handleMessage,
        onError: setError
    });

    const handleSearch = useCallback((city: string) => {
        sendMessage(JSON.stringify({
            type: 'search',
            city
        }));
    }, [sendMessage]);

    const handleCenterChange = useCallback((coords: Coordinates) => {
        console.log('Sending map center coordinates:', coords);
        sendMessage(JSON.stringify({
            type: 'map_center',
            lat: coords.lat,
            lon: coords.lon
        }));
    }, [sendMessage]);

    return (
        <div className="app">
            <h1>Поиск городов на карте</h1>
            {!isConnected && (
                <div className="connection-status error">
                    Нет подключения к серверу...
                </div>
            )}
            <div className="top-panel">
                <div className="search-section">
                    <SearchForm onSearch={handleSearch} />
                    {error && <div className="error">{error}</div>}
                </div>
                <div className="info-section">
                    {elevation !== null && (
                        <div className="info-box elevation">
                            Высота над уровнем моря: {elevation} метров
                        </div>
                    )}
                    {weather && (
                        <div className="info-box weather">
                            <div>Температура: {weather.temperature}°C</div>
                            <div>Влажность: {weather.humidity}%</div>
                            {weather.description && <div>Погода: {weather.description}</div>}
                        </div>
                    )}
                </div>
            </div>
            <MapComponent 
                coordinates={coordinates} 
                onCenterChange={handleCenterChange}
            />
        </div>
    );
};

export default App; 