// src/config/socket.config.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;

const socketConfig = {
    transports: ['websocket', 'polling'],
    upgrade: true,
    timeout: 20000,
    forceNew: true,
    extraHeaders: {
    'ngrok-skip-browser-warning': 'true'
    }
};

// Si necesitas autenticación básica para websockets
if (import.meta.env.VITE_NGROK_AUTH_USER) {
    const auth = btoa(`${import.meta.env.VITE_NGROK_AUTH_USER}:${import.meta.env.VITE_NGROK_AUTH_PASS}`);
    socketConfig.extraHeaders['Authorization'] = `Basic ${auth}`;
}

export const socket = io(SOCKET_URL, socketConfig);