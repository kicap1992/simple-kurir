import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { io as socketClient, Socket as ClientSocket } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const clientSocket: ClientSocket = socketClient(`http://localhost:3011`);

let io: SocketIOServer | null = null;

function init(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
        cors: {
            origin: "*", // ← Make sure this is set
            methods: ["GET", "POST"]
        }
    });
  return io;
}

function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export {
  init,
  getIO,
  clientSocket
};
