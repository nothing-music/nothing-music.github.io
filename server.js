const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

let partyRooms = {};

io.on('connection', (socket) => {
    console.log('New device connected:', socket.id);

    socket.on('hostParty', (pin) => {
        socket.join(pin);
        partyRooms[pin] = { hostId: socket.id, state: null };
        console.log(`Room created: ${pin}`);
    });

    socket.on('joinParty', (pin, callback) => {
        if (partyRooms[pin]) {
            socket.join(pin);
            if (partyRooms[pin].state) {
                socket.emit('syncCommand', partyRooms[pin].state);
            }
            callback({ success: true });
        } else {
            callback({ success: false, message: "Invalid PIN or Host closed." });
        }
    });

    socket.on('hostCommand', (data) => {
        const { pin } = data;
        if (partyRooms[pin]) {
            partyRooms[pin].state = data;
            socket.to(pin).emit('syncCommand', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Device disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`NS Sync Server running on port ${PORT}`);
});
