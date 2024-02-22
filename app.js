//app.js
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
let userNames = {};

// Express app setup
app.use(express.static('public')); // Serve static files from the 'public' directory
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Mitigate XSS
    sameSite: 'strict' // Mitigate CSRF
  }
}));


// Utility functions
const autoDeleteOldMessages = () => {
  const oneMinuteAgo = new Date(new Date() - 60000); // 60000 milliseconds = 1 minute
  messages = messages.filter(messageObj => messageObj.timestamp > oneMinuteAgo);
};

// Routes for messaging
app.post('/send', (req, res) => {
  const { message, userName } = req.body;
  if (message && userName) {
    const encryptedMessage = encryptMessage(message);
    const timestamp = new Date();
    messages.push({ encryptedMessage: encryptMessage(message), timestamp, userName });
    io.emit('chat_message', { msg: decryptMessage(encryptedMessage), userName });
    res.status(200).send({ message: 'Message sent successfully' });
  } else {
    res.status(400).send({ message: 'No message or username provided' });
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
  const token = `auth_${crypto.randomBytes(16).toString('hex')}`;
  const expiration = Date.now() + 10 * 60 * 1000; // Token expiration time (10 minutes)
  validTokens[token] = expiration;
  const url = `${process.env.NGROK_URL}/authenticate?token=${token}`;

  try {
    const qr = await QRCode.toDataURL(url);
    res.send(`<img src="${qr}" />`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating QR code');
  }
});


// Hnadle authentication from QR Code
app.get('/authenticate', (req, res) => {
  const { token } = req.query;
  if (validTokens[token] && validTokens[token] > Date.now()) {
    delete validTokens[token]; // Invalidate token after usex
    req.session.isAuthenticated = true;
  
      // Send a webpage that redirects to the chat page
      res.send(`
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 50px;
              }
  
              h1 {
                  color: #4CAF50; /* Green text color */
              }
  
              input, button {
                padding: 10px;
                margin: 10px;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
            button {
                background-color: #008CBA; /* Blue background */
                color: white; /* White text */
                cursor: pointer;
            }
  
              button:hover {
                  background-color: #005F8C; /* Darker blue on hover */
              }
          </style>
      </head>
      <body>
      <h1>Welcome to the Chat! app.js</h1>
      <p>Set your username to continue:</p>
      <input type="text" id="username" placeholder="Your username">
      <button onclick="setUsernameAndGoToChat()">Set Username & Enter Chat</button>
      <script>
      function setUsernameAndGoToChat() {
          const username = document.getElementById('username').value;
          // Redirect to the chat page with the username
          window.location.href = '/chat?username=' + encodeURIComponent(username) + '&token=' + encodeURIComponent('${token}');
      }
  </script>
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
  const { token } = req.query;
  if (req.session.isAuthenticated || (validTokens[token] && validTokens[token] > Date.now())) {
    res.render('chat'); // Render the chat page
  } else {
    res.redirect('/'); // If not authenticated, redirect to the main page
  }
});


// Setup WebSocket communication using socket.io
io.on('connection', (socket) => {
  // console.log('A user connected', socket.id);
  const existingMessages = messages.map(msgObj => ({
    msg: decryptMessage(msgObj.encryptedMessage),
    userName: msgObj.userName
  }));
  socket.emit('existing_messages', existingMessages);

    // Listen for setting username
    socket.on('set_username', (userName) => {
      userNames[socket.id] = userName;
      console.log(`${userName} has joined the chat`);
      // Broadcast to all users the new user's arrival
      io.emit('user_joined', `${userName} has joined the chat`);
    });

    socket.on('chat_message', ({ userName, msg }) => {
      console.log(userNames); // Debug: Log the userNames object
      // console.log(socket.id); // Debug: Log the socket ID
      const currentUserName = userNames[socket.id] || 'Anonymous';
      io.emit('chat_message', { userName: currentUserName, msg: msg });
  });

  socket.on('disconnect', () => {
    // console.log(`${userNames[socket.id] || 'A user'} disconnected from the chat room.`);
    // Optionally, broadcast that the user has left
    io.emit('user_left', `${userNames[socket.id] || 'A user'} has left the chat.`);
    delete userNames[socket.id]; // Clean up the username store
  });
});

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
