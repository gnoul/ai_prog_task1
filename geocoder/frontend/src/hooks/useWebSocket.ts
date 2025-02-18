import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketMessage } from '../types/types';

interface UseWebSocketProps {
    onMessage: (message: WebSocketMessage) => void;
    onError: (error: string) => void;
}

const useWebSocket = ({ onMessage, onError }: UseWebSocketProps) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<number>();
    const messageQueueRef = useRef<string[]>([]);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        console.log('Connecting to WebSocket...');
        ws.current = new WebSocket('ws://localhost:8080/ws');

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            
            // Отправляем накопленные сообщения
            while (messageQueueRef.current.length > 0) {
                const message = messageQueueRef.current.shift();
                if (message && ws.current?.readyState === WebSocket.OPEN) {
                    console.log('Sending queued message:', message);
                    ws.current.send(message);
                }
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
            setIsConnected(false);
            
            // Пытаемся переподключиться через секунду
            reconnectTimeoutRef.current = window.setTimeout(() => {
                console.log('Attempting to reconnect...');
                connect();
            }, 1000);
        };

        ws.current.onmessage = (event: MessageEvent) => {
            console.log('WebSocket received message:', event.data);
            try {
                const message = JSON.parse(event.data);
                onMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
                onError('Ошибка при обработке сообщения');
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };
    }, [onMessage, onError]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message: string) => {
        console.log('Attempting to send message:', message);
        
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not ready, queueing message');
            messageQueueRef.current.push(message);
            
            if (!isConnected) {
                console.log('Attempting to reconnect...');
                connect();
            }
            return;
        }

        try {
            ws.current.send(message);
            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            messageQueueRef.current.push(message);
            onError('Ошибка отправки сообщения');
        }
    }, [isConnected, connect, onError]);

    return { sendMessage, isConnected };
};

export default useWebSocket; 