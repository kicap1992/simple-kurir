
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST"]
  }
});

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  socket.on('scan_dia', (data: any) => {
    console.log('📩 Received scan_dia:', data);
    
  });

  socket.on('scan_dia_lagi', (data: any) => {
    console.log('📩 Received scan_dia_lagi:', data);
    // io.emit('scan_dia_lagi', "coba");
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = 3011;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
