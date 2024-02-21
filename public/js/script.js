document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messagesDiv = document.getElementById('messages');
    const socket = io();
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const usernameFormContainer = document.getElementById('usernameFormContainer'); // Add this line
    const usernameForm = document.getElementById('usernameForm'); // Add this line
    const usernameInput = document.getElementById('usernameInput'); // Add this line
    const params = new URLSearchParams(window.location.search);
const username = params.get('username'); // Now you have the username to use


    console.log('Document loaded and script initialized.');
    messageForm.style.display = 'block';

    if (username) {
        socket.emit('set_username', username);
    }


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
    socket.emit('chat_message', { userName: username, msg: message });
};

// Function to escape HTML to prevent XSS attacks
function escapeHTML(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${escapeHTML(message.userName)}</strong>: ${escapeHTML(message.msg)}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom of the chat
}

    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            sendMessage( message);
            messageInput.value = '';
        }
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('chat_message', (data) => {
        displayMessage(data);
    });

    // socket.on('auth_success', (data) => {
    //     console.log("Authentication successful", data.message);
    //     const token = data.token;
    //     window.location.href = '/chat';
    //     messageForm.style.display = 'block';
    //     // Redirect to the chat page with the token
    // });

    // Show the message form as the user is already authenticated if they are on this page


        // Handle username selection submission
        usernameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = usernameInput.value.trim();
            if (username) {
                socket.emit('set_username', username);
                usernameFormContainer.style.display = 'none'; // Hide the username form
                messageForm.style.display = 'block'; // Show the message form
            }
        });
    
        // Example handling for auth_success - adapt based on your server logic
        socket.on('auth_success', () => {
            qrCodeContainer.style.display = 'none'; // Hide the QR code
            usernameFormContainer.style.display = 'block'; // Show the username form
        });

        socket.on('existing_messages', (messages) => {
            messages.forEach(displayMessage);
        });
});

