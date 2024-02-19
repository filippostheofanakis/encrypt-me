require('dotenv').config();
const axios = require('axios');
const ngrokUrl = process.env.NGROK_URL;
const readline = require('readline');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const sendMessage = async (message) => {
  try {
    const response = await axios.post(`${ngrokUrl}/send`, {
      message
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(response.data); // The response from the server
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

// Function to ask for user input and send messages
const promptAndSendMessage = () => {
  rl.question('Enter your message: ', (message) => {
    sendMessage(message);
    promptAndSendMessage(); // Prompt for another message after sending
  });
};


// To handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping the message sender.');
  rl.close();
  process.exit();
});

// Start the process
promptAndSendMessage();


