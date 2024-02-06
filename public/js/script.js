document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('message');
    const messagesDiv = document.getElementById('messages');

    
  
    // Function to send a message to the server
    const sendMessage = async (message) => {
      try {
        const response = await fetch('/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
        const data = await response.json();
        console.log(data.message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };
  
    // Function to poll for new messages
    const pollMessages = () => {
      setInterval(async () => {
        try {
          const response = await fetch('/receive');
          if (response.ok) {
            const data = await response.json();
            displayMessage(data.message);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }, 5000); // Poll every 5 seconds
    };

// Function to display a message
// Function to display a message
const displayMessage = (message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add('message-style'); // Add class for styling
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
  };
  
  
    // Event listener for form submission
    messageForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = messageInput.value;
      sendMessage(message);
      messageInput.value = ''; // Clear the input after sending
    });
  
    // Start polling for messages when the page loads
    pollMessages();
  });
  