import React, { useState } from 'react';
import MapComponent from './Map';
import SearchForm from './SearchForm';
import { Coordinates, SearchResponse } from '../types/types';

const App: React.FC = () => {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = (data: SearchResponse) => {
        setCoordinates(data.coordinates);
        setError(null);
    };

    const handleError = (error: string) => {
        setError(error);
        setCoordinates(null);
    };

    return (
        <div className="app">
            <h1>Поиск городов на карте</h1>
            <SearchForm onSearch={handleSearch} onError={handleError} />
            {error && <div className="error">{error}</div>}
            <MapComponent coordinates={coordinates} />
        </div>
    );
};

export default App; 