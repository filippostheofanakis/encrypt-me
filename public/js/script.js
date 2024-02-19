document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesDiv = document.getElementById('messages');
    const socket = io();
    const qrCodeContainer = document.getElementById('qrCodeContainer');


    console.log('Document loaded and script initialized.');
    messageForm.style.display = 'block';

if (qrCodeContainer) {
    const fetchAndDisplayQRCode = async () => {
        console.log('Fetching QR code from server.');
        const response = await fetch('/generate-qr');
        if (response.ok) {
            const qrHtml = await response.text();
            qrCodeContainer.innerHTML = qrHtml;
        } else {
            console.error('Failed to fetch QR code');
        }
    };

    fetchAndDisplayQRCode();
}

    const sendMessage = (message) => {
        console.log(`Sending message: ${message}`);
        socket.emit('chat_message', message);
    };

    const displayMessage = (message) => {
        console.log(`Displaying message: ${message}`);
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.classList.add('message-style');
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            sendMessage(message);
            messageInput.value = '';
        }
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('chat_message', (message) => {
        console.log(`Received chat message: ${message}`);
        displayMessage(message);
    });

    // socket.on('auth_success', (data) => {
    //     console.log("Authentication successful", data.message);
    //     const token = data.token;
    //     window.location.href = '/chat';
    //     messageForm.style.display = 'block';
    //     // Redirect to the chat page with the token
    // });

    // Show the message form as the user is already authenticated if they are on this page
});