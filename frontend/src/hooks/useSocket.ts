import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket(onNotification: (notification: any) => void) {
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Reuse existing connection if already open
    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
    }

    const handler = (notification: any) => {
      onNotificationRef.current(notification);
    };

    socketInstance.on('notification', handler);

    return () => {
      socketInstance?.off('notification', handler);
    };
  }, []);
}
