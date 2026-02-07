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

const PORT = process.env.PORT || 3000;
const THREE_HOURS = 3 * 60 * 60 * 1000; 
let messages = []; 

io.on('connection', (socket) => {
    const anonimNo = Math.floor(Math.random() * 999) + 1;
    const userName = `Anonim ${anonimNo}`;
    socket.userName = userName;
    
    socket.emit('set username', userName);

    // Yeni bağlanana sadece son 3 saatlik mesajları gönder
    const simdi = Date.now();
    const tazeMesajlar = messages.filter(m => simdi - m.timestamp < THREE_HOURS);
    socket.emit('all-messages', tazeMesajlar);

    socket.on('send-message', (text) => {
        const newMessage = {
            id: Math.random().toString(36).substr(2, 9),
            user: socket.userName,
            text: text,
            // TÜRKİYE SAATİNE SABİTLEME (UTC+3)
            time: new Date().toLocaleTimeString('tr-TR', { 
                timeZone: 'Europe/Istanbul', 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            timestamp: Date.now() 
        };
        
        messages.push(newMessage);
        io.emit('receive-message', newMessage);
    });
});

// OTOMATİK SÜPÜRGE (Her dakika çalışır)
setInterval(() => {
    const simdi = Date.now();
    const eskiSayi = messages.length;

    // 3 saati dolanları temizle
    messages = messages.filter(msg => (simdi - msg.timestamp) < THREE_HOURS);

    if (messages.length < eskiSayi) {
        io.emit('all-messages', messages);
        console.log("Süresi dolan mesajlar temizlendi.");
    }
}, 60000);

server.listen(PORT, () => {
    console.log(`Sunucu TR saatine göre ayarlandı ve aktif.`);
});
