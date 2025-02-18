import React, { useState, FormEvent } from 'react';

interface SearchFormProps {
    onSearch: (city: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!city.trim()) {
            return;
        }

        setLoading(true);
        try {
            onSearch(city);
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