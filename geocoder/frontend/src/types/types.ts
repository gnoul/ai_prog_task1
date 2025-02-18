export interface Coordinates {
    lat: number;
    lon: number;
}

export interface SearchResponse {
    coordinates: Coordinates;
    city: string;
}

export interface ElevationResponse {
    elevation: number;
}

export interface WeatherResponse {
    temperature: number;
    humidity: number;
    description: string | null;
}

export interface WebSocketMessage {
    type: 'coordinates' | 'elevation' | 'weather' | 'error';
    data?: SearchResponse | ElevationResponse | WeatherResponse;
    message?: string;
} 