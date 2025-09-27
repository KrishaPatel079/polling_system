// frontend/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

class SocketService {
  socket = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinPoll(pollId) {
    if (this.socket) {
      this.socket.emit('joinPoll', pollId);
    }
  }

  leavePoll(pollId) {
    if (this.socket) {
      this.socket.emit('leavePoll', pollId);
    }
  }

  onVoteCast(callback) {
    if (this.socket) {
      this.socket.on('voteCast', callback);
    }
  }

  offVoteCast(callback) {
    if (this.socket) {
      this.socket.off('voteCast', callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();