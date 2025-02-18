import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Coordinates } from '../types/types';

interface MapComponentProps {
    coordinates: Coordinates | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ coordinates }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);

    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({
                        source: new OSM()
                    })
                ],
                view: new View({
                    center: fromLonLat([37.6156, 55.7522]), // Москва по умолчанию
                    zoom: 10
                })
            });
        }
    }, []);

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