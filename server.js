const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Diğer projeden erişim izni verir

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Güvenlik için tüm kaynaklara izin verildi
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    // 1-999 arası rastgele anonim isim oluştur
    const anonimNo = Math.floor(Math.random() * 999) + 1;
    const userName = `Anonim ${anonimNo}`;
    
    console.log(`${userName} bağlandı.`);

    // Kullanıcıya ismini gönder
    socket.emit('set username', userName);

    // Mesaj geldiğinde
    socket.on('chat message', (msgText) => {
        const messageData = {
            id: Math.random().toString(36).substr(2, 9), // Silme işlemi için eşsiz ID
            user: userName,
            text: msgText,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };

        // Mesajı herkese yayınla
        io.emit('chat message', messageData);

        // 3 SAAT SONRA SİLME (3 * 60 * 60 * 1000 ms)
        setTimeout(() => {
            io.emit('delete message', messageData.id);
        }, 10800000); 
    });

    socket.on('disconnect', () => {
        console.log(`${userName} ayrıldı.`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda hazır.`);
});

