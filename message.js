require('dotenv').config();
const axios = require('axios');
const ngrokUrl = process.env.NGROK_URL;

const sendMessage = async () => {
  try {
    const response = await axios.post(`${ngrokUrl}/send`, {
      message: 'i am filippos'
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

sendMessage();
