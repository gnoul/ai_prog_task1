export interface Coordinates {
    lat: number;
    lon: number;
}

export interface SearchResponse {
    coordinates: Coordinates;
    city: string;
} 