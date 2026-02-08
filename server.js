const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

/* 🔥 PING ROUTE — BUNU CRON VURACAK */
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

/* İstersen ana sayfa */
app.get('/', (req, res) => {
    res.send('Socket.IO Server Aktif 🚀');
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

/* RAM’de mesajlar */
let messageHistory = [];

io.on('connection', (socket) => {
    const anonimNo = Math.floor(Math.random() * 999) + 1;
    const userName = `Anonim ${anonimNo}`;

    console.log(`${userName} bağlandı`);

    socket.emit('chat history', messageHistory);
    socket.emit('set username', userName);

    socket.on('chat message', (msgText) => {
        if (!msgText || !msgText.trim()) return;

        const messageData = {
            id: Math.random().toString(36).substring(2, 11),
            user: userName,
            text: msgText,
            time: new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Istanbul'
            })
        };

        messageHistory.push(messageData);
        io.emit('chat message', messageData);

        /* 3 saat sonra sil */
        setTimeout(() => {
            messageHistory = messageHistory.filter(m => m.id !== messageData.id);
            io.emit('delete message', messageData.id);
            console.log(`Mesaj silindi: ${messageData.id}`);
        }, 3 * 60 * 60 * 1000);
    });

    socket.on('disconnect', () => {
        console.log(`${userName} ayrıldı`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
