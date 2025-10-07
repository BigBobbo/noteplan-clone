import { io, Socket } from 'socket.io-client';
import type { FileChangedEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, EventCallback[]> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.emit('connected', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', { error: error.message });
    });

    // File change events
    this.socket.on('file:changed', (data: FileChangedEvent) => {
      console.log('📁 File changed:', data);
      this.emit('file:changed', data);
    });

    this.socket.on('directory:changed', (data: FileChangedEvent) => {
      console.log('📂 Directory changed:', data);
      this.emit('directory:changed', data);
    });

    // Server messages
    this.socket.on('connected', (data) => {
      console.log('Server message:', data.message);
    });

    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Subscribe to specific file paths
  subscribe(paths: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { paths });
    }
  }

  unsubscribe(paths: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { paths });
    }
  }

  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const websocket = new WebSocketService();
export default websocket;
