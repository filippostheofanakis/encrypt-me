require('dotenv').config();
const express = require("express");
const QRCode = require('qrcode');
const crypto = require('crypto');
const { encryptMessage, decryptMessage } = require('./encryption'); // Require the encryption functions
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');



const ngrokPublicUrl = process.env.NGROK_URL; // Ensure you set this environment variable

const app = express();
const server = require('http').createServer(app);// Create HTTP server for socket.io
const io = require('socket.io')(server); // Initialize socket.io with the HTTP server
const PORT = process.env.PORT || 3000;


// Global state
let messages = []; // This will temporarily store messages in memory
let validTokens= {}; // Store for valid authentication tokens

// Express app setup
app.use(express.static('public')); // Serve static files from the 'public' directory
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Note: In production, set this to true and use HTTPS
}));


// Utility functions
const autoDeleteOldMessages = () => {
  const oneMinuteAgo = new Date(new Date() - 60000); // 60000 milliseconds = 1 minute
  messages = messages.filter(messageObj => messageObj.timestamp > oneMinuteAgo);
};

// Routes for messaging
app.post('/send', (req, res) => {
  const { message } = req.body;
  if (message) {
      const encryptedMessage = encryptMessage(message);
      const timestamp = new Date();
      messages.push({ encryptedMessage, timestamp });
      io.emit('chat_message', decryptMessage(encryptedMessage));
      res.status(200).send({ message: 'Message sent successfully' });

  } else {
      res.status(400).send({ message: 'No message provided' });
  }
});

// Main page route
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/receive', (req, res) => {
  autoDeleteOldMessages(); // Remove old messages

  // If there are no messages, send a 404 response
  if (messages.length === 0) {
      return res.status(200).send({ message: 'No new messages' });
  }

  // If there are messages, decrypt the first one and send it
  const messageToDecrypt = messages.shift().encryptedMessage;
  const decryptedMessage = decryptMessage(messageToDecrypt);
  res.status(200).send({ message: decryptedMessage });
});

app.get('/auth', async (req, res) => {
  const token = `auth_${crypto.randomBytes(16).toString('hex')}`;
  const url = `${process.env.NGROK_URL}/authenticate?token=${token}`;
  validTokens[token] = true; // Temporarily store the token

  QRCode.toDataURL(url, (err, qrCodeData) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error generating QR code');
    }
    res.render('auth', { qrCodeData });
  });
});

// QR Code generation route
app.get('/generate-qr', async (req, res) => {
  const token = `auth_${crypto.randomBytes(16).toString('hex')}`; // Generate a secure token
  const url = `${process.env.NGROK_URL}/authenticate?token=${token}`;

  // Store the token as valid for a short period (e.g., 10 minutes)
  validTokens[token] = setTimeout(() => delete validTokens[token], 10 * 60 * 1000);

  try {
    const qr = await QRCode.toDataURL(url);
    res.send(`<img src="${qr}" />`); // Send QR code as an image to the client
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating QR code');
  }
});

// Hnadle authentication from QR Code
app.get('/authenticate', (req, res) => {
  const { token } = req.query;
  if (validTokens[token]) {
      delete validTokens[token]; // Remove token from valid tokens
      req.session.isAuthenticated = true; // Set the authentication status in the session
      // Send a webpage that redirects to the chat page
      res.send(`
          <html>
          <body>
              <h1>Authentication Successful</h1>
              <button onclick="window.location.href='/chat'">Go to Chat</button>
          </body>
          </html>
      `);
  } else {
      res.status(401).send('Invalid or expired token.');
  }
});

app.get('/isAuthenticated', (req, res) => {
  const isAuthenticated = req.session.isAuthenticated || false;
  

  res.send({ isAuthenticated });
});

app.get('/chat', (req, res) => {
  // const { token } = req.query;
  if (req.session.isAuthenticated) {
    res.render('chat'); // Render the chat page
  } else {
      res.redirect('/'); // If not authenticated, redirect to the main page
  }
});


// Setup WebSocket communication using socket.io
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on('chat_message', (msg) => {
      // Broadcast message to all users in the chat room
      io.emit('chat_message', msg)
  });

  socket.on('disconnect', () => {
      console.log('User disconnected from the chat room.');
  });
});

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
