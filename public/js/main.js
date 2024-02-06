// public/js/main.js
document.addEventListener('DOMContentLoaded', function() {
    const messageBox = document.getElementById('message-box'); // Assume you have a div with this id in your EJS
  
    setInterval(async () => {
      try {
        const response = await fetch('/receive');
        if (response.ok) {
          const data = await response.json();
          messageBox.textContent = data.message; // Update the text content of the message box
        } else {
          messageBox.textContent = "No new messages";
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }, 5000); // Poll every 5 seconds
  });
  