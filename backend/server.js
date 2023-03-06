const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});
const cors = require('cors');

app.use(cors());

const state = {
    points: new Set(),
};

io.on('connection', (socket) => {
    socket.emit('draw', [...state.points]);
    socket.on('draw', (msg) => {
        msg.forEach((point) => {
            state.points.add(point);
        });
        socket.broadcast.emit('draw', msg);
    });

    socket.on('clear', (points) => {
        const deletedPoints = [];
        points.forEach((point) => {
            state.points.forEach((p) => {
                if (p.x === point.x && p.y === point.y) {
                    state.points.delete(p);
                    deletedPoints.push(p);
                }
            });
        });

        console.log('deleted', deletedPoints);
        socket.broadcast.emit('clear', deletedPoints);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
