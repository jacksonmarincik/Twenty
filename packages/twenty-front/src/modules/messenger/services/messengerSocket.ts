import { io, Socket } from 'socket.io-client';

import { getMessengerBaseUrl } from '@/messenger/config/messengerConfig';

let activeSocket: Socket | null = null;
let activeToken: string | null = null;

export const getMessengerSocket = (token: string | null): Socket | null => {
  if (token === null) {
    if (activeSocket !== null) {
      activeSocket.disconnect();
      activeSocket = null;
      activeToken = null;
    }
    return null;
  }

  if (activeSocket !== null && activeToken === token && activeSocket.connected) {
    return activeSocket;
  }

  if (activeSocket !== null) {
    activeSocket.disconnect();
    activeSocket = null;
  }

  activeToken = token;
  activeSocket = io(getMessengerBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  return activeSocket;
};

export const disconnectMessengerSocket = () => {
  if (activeSocket !== null) {
    activeSocket.disconnect();
    activeSocket = null;
    activeToken = null;
  }
};
