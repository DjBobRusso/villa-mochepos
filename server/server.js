const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'db.json');

// Estado del servidor
let devices = {};       // { socketId: { userId, userName, role, deviceType, joinedAt } }
let rooms = {};         // { userId: socketId }
let centralDB = {};     // Copia centralizada de DB para nuevos clientes

// Persistencia simple en archivo
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      centralDB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.error('Error loading data:', e.message); }
}
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(centralDB, null, 2));
  } catch (e) { console.error('Error saving data:', e.message); }
}
loadData();

// Servir archivos estaticos (para que el HTML pueda cargarse desde el mismo server si se desea)
app.use(express.static(path.join(__dirname, '..')));

io.on('connection', (socket) => {
  console.log(`[+] Cliente conectado: ${socket.id}`);

  // Login del dispositivo: se registra con datos de usuario
  socket.on('auth:login', (data) => {
    const { userId, userName, role, deviceType } = data;
    // Si ya habia una sesion de este usuario, desconectar la anterior
    if (rooms[userId]) {
      const oldSocketId = rooms[userId];
      if (devices[oldSocketId]) {
        io.to(oldSocketId).emit('auth:duplicate');
        io.sockets.sockets.get(oldSocketId)?.disconnect();
      }
    }
    devices[socket.id] = {
      userId, userName, role, deviceType,
      joinedAt: Date.now()
    };
    rooms[userId] = socket.id;
    socket.join('all');
    // Enviar DB actual al nuevo cliente
    socket.emit('sync:full', centralDB);
    // Notificar a todos
    io.to('all').emit('devices:update', Object.values(devices));
    console.log(`  -> ${userName} (${role}) conectado`);
  });

  // Sincronizacion completa de DB
  socket.on('sync:full', (data) => {
    centralDB = JSON.parse(JSON.stringify(data));
    saveData();
    socket.broadcast.emit('sync:full', centralDB);
  });

  // Eventos especificos - se reenvian a los demas dispositivos
  socket.on('order:new', (data) => {
    const dev = devices[socket.id];
    socket.broadcast.emit('order:new', {
      ...data,
      _source: dev ? { id: socket.id, ...dev } : null
    });
  });

  socket.on('order:status', (data) => {
    const dev = devices[socket.id];
    socket.broadcast.emit('order:status', {
      ...data,
      _source: dev ? { id: socket.id, ...dev } : null
    });
  });

  socket.on('order:dish-status', (data) => {
    socket.broadcast.emit('order:dish-status', data);
  });

  socket.on('table:update', (data) => {
    socket.broadcast.emit('table:update', data);
  });

  socket.on('inventory:update', (data) => {
    socket.broadcast.emit('inventory:update', data);
  });

  socket.on('reservation:update', (data) => {
    socket.broadcast.emit('reservation:update', data);
  });

  socket.on('db:patch', (data) => {
    // Aplicar parche a la DB central
    if (data.key && data.value !== undefined) {
      centralDB[data.key] = JSON.parse(JSON.stringify(data.value));
      saveData();
    }
    socket.broadcast.emit('db:patch', data);
  });

  // Ping/Pong para latencia
  socket.on('ping:measure', (cb) => {
    if (typeof cb === 'function') cb(Date.now());
  });

  // Desconexion
  socket.on('disconnect', () => {
    const dev = devices[socket.id];
    if (dev) {
      delete rooms[dev.userId];
      console.log(`[-] ${dev.userName} (${dev.role}) desconectado`);
    }
    delete devices[socket.id];
    io.to('all').emit('devices:update', Object.values(devices));
  });
});

// Cleanup periodico de dispositivos zombies (cada 5 min)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  Object.keys(devices).forEach(sid => {
    const sock = io.sockets.sockets.get(sid);
    if (!sock) {
      const dev = devices[sid];
      if (dev) delete rooms[dev.userId];
      delete devices[sid];
      changed = true;
    }
  });
  if (changed) {
    io.to('all').emit('devices:update', Object.values(devices));
  }
}, 300000);

server.listen(PORT, () => {
  console.log(`[+] Villa Moche Sync Server corriendo en puerto ${PORT}`);
  console.log(`    Servidor: http://localhost:${PORT}`);
});
