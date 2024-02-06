# Encrypt-Me: Encrypted Messaging Service

## Description

Encrypt-Me is an encrypted messaging service built with Node.js. It uses Express.js to handle HTTP requests and provides end-to-end encryption for secure message exchange.

## Installation

To set up the Encrypt-Me project, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/filippostheofanakis/encrypt-me.git
   ```
   Navigate to the project directory:
   cd encrypt-me

Install dependencies:
npm install

To run the Encrypt-Me server, execute:
node app.js

Usage
Currently, the application provides a basic server setup. More features will be added progressively.

## Environment Variables

Create a `.env` file in the root directory of the project and add the following variables:

- `SECRET_KEY`: A secret key used for encryption.
- `PORT`: The port number on which the server will run. Default is `3000`.
- `NGROK_URL`: The ngrok URL for sending messages.

Example:

```plaintext
SECRET_KEY=your_secret_key_here
PORT=3000
NGROK_URL=your_ngrok_url_here

Contributing
Contributions to the Encrypt-Me project are welcome. Please ensure to update tests as appropriate.
