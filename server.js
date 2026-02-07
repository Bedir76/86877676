const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Henüz süresi dolmamış mesajlar (RAM)
let messageHistory = [];

io.on('connection', (socket) => {
    // 1–999 arası anonim numara
    const anonimNo = Math.floor(Math.random() * 999) + 1;
    const userName = `Anonim ${anonimNo}`;

    // Kullanıcı bağlanınca eski mesajları gönder
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
                timeZone: 'Europe/Istanbul' // 🔥 KRİTİK SATIR
            })
        };

        // Mesajı kaydet ve herkese gönder
        messageHistory.push(messageData);
        io.emit('chat message', messageData);

        // 3 SAAT SONRA SİL (10.800.000 ms)
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
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif (TR saat dilimi).`);
});
