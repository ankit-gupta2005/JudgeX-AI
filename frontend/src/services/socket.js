import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const createSocketConnection = () => {
  return io(socketUrl, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};