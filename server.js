const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Henüz süresi dolmamış mesajları tutan liste
let messageHistory = [];

io.on('connection', (socket) => {
    // 1-999 arası anonim numara
    const anonimNo = Math.floor(Math.random() * 999) + 1;
    const userName = `Anonim ${anonimNo}`;
    
    // Kullanıcı bağlandığında mevcut (silinmemiş) mesajları gönder
    socket.emit('chat history', messageHistory);
    socket.emit('set username', userName);

    socket.on('chat message', (msgText) => {
        if (!msgText.trim()) return;

        const messageData = {
            id: Math.random().toString(36).substr(2, 9),
            user: userName,
            text: msgText,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };

        // Mesajı geçmişe ekle ve herkese yayınla
        messageHistory.push(messageData);
        io.emit('chat message', messageData);

        // TAM 3 SAAT SONRA SİLME AYARI (10.800.000 ms)
        setTimeout(() => {
            // Sunucu listesinden çıkart
            messageHistory = messageHistory.filter(m => m.id !== messageData.id);
            // Tüm kullanıcılara bu mesajı sil komutu gönder
            io.emit('delete message', messageData.id);
            console.log(`Mesaj silindi: ${messageData.id}`);
        }, 3 * 60 * 60 * 1000); 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
