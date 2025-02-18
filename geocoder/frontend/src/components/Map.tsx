import React, { useEffect, useRef, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Coordinates } from '../types/types';

interface MapComponentProps {
    coordinates: Coordinates | null;
    onCenterChange: (coordinates: Coordinates) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ coordinates, onCenterChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);

    const handleMoveEnd = useCallback(() => {
        console.log('handleMoveEnd called');
        if (mapInstanceRef.current) {
            const view = mapInstanceRef.current.getView();
            const center = view.getCenter();
            console.log('Map center:', center);
            if (center) {
                const [lon, lat] = toLonLat(center);
                console.log('Converted coordinates:', { lat, lon });
                onCenterChange({ lat, lon });
            }
        }
    }, [onCenterChange]);

    // Инициализация карты
    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            console.log('Initializing map');
            const map = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({
                        source: new OSM()
                    })
                ],
                view: new View({
                    center: fromLonLat([37.6156, 55.7522]),
                    zoom: 10
                })
            });
            // Подписываемся на события завершение перемещения карты
            // const view = map.getView();
            // view.on('moveend', handleMoveEnd);
            map.on('moveend', handleMoveEnd);
            mapInstanceRef.current = map;

            // Вызываем handleMoveEnd для получения начальных данных
            handleMoveEnd();
        }

        return () => {
            // if (mapInstanceRef.current) {
            //     // Отписываемся от события moveend
            //     // mapInstanceRef.current.un('moveend', handleMoveEnd);
            // }
        };
    }, [handleMoveEnd]);

    useEffect(() => {
        if (coordinates && mapInstanceRef.current) {
            const view = mapInstanceRef.current.getView();
            view.animate({
                center: fromLonLat([coordinates.lon, coordinates.lat]),
                zoom: 12,
                duration: 1000
            });
        }
    }, [coordinates]);

    return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

export default MapComponent; 