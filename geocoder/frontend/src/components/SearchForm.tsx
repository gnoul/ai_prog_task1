import React, { useState } from 'react';
import { SearchResponse } from '../types/types';

interface SearchFormProps {
    onSearch: (coordinates: SearchResponse) => void;
    onError: (error: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, onError }) => {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city.trim()) {
            onError('Пожалуйста, введите название города');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/search?city=${encodeURIComponent(city)}`);
            if (!response.ok) {
                throw new Error('Город не найден');
            }
            const data = await response.json();
            onSearch(data);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="search-form">
            <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Введите название города"
                disabled={loading}
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Поиск...' : 'Найти'}
            </button>
        </form>
    );
};

export default SearchForm; 