require('dotenv').config();
const express = require("express");
const crypto = require('crypto');
const { encryptMessage, decryptMessage } = require('./encryption'); // Require the encryption functions

const path = require('path');
const app = express();
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.use(express.static('public')); // Serve static files from the 'public' directory



app.use(express.json());

let messages = []; // This will temporarily store messages in memory


app.post('/send', (req, res) => {
  const { message } = req.body;
  if (message) {
      const encryptedMessage = encryptMessage(message);
      const timestamp = new Date();
      messages.push({ encryptedMessage, timestamp });
      res.status(200).send({ message: 'Message sent successfully' });
  } else {
      res.status(400).send({ message: 'No message provided' });
  }
});

const autoDeleteOldMessages = () => {
  const oneMinuteAgo = new Date(new Date() - 60000); // 60000 milliseconds = 1 minute
  messages = messages.filter(messageObj => messageObj.timestamp > oneMinuteAgo);
};

app.get('/', (req, res) => {
  res.render('index');
});



app.get('/receive', (req, res) => {
  autoDeleteOldMessages(); // Remove old messages
  // For now, we just send the first message in the queue
  if (messages.length === 0) {
      return res.status(404).send({ message: 'No messages' });
  }
  const messageToDecrypt = messages.shift().encryptedMessage;
  const decryptedMessage = decryptMessage(messageToDecrypt);
  res.status(200).send({ message: decryptedMessage });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
