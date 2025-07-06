// src/utils/socket.js
import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket"], // Forzar WebSocket para evitar polling innecesario
    }); 
}
    return socket;
};
