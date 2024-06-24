require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');
const { db } = require('./config');
const socketio = require('socket.io');

const PORT = process.env.PORT || 5000;
const models = require('./models');
const { SOCKET_EVENTS } = require('./constants');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = require('http').Server(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});
app.use(express.json());
app.use(cors());

app.get('/api/test', (req, res) => res.send('Backend Working...'));
app.use('/api/v1', require('./routes/v1'));

db.then(() => {
  console.log('Database Connected Successfully');
  server.listen(PORT, console.log(`Server Started on PORT: ${PORT}`));
}).catch((err) => console.log('Database Connection Error: ', err));

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

app.set('socketio', io);
global.socket = io;
