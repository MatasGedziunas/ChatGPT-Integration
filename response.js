const express = require('express');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for the HTTP server port
const WSS_PORT = process.env.WSS_PORT || PORT; // Use the same port for WebSocket Server if not specified

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create an HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Start streaming ChatGPT responses back to the client
        startStreamingToClient(ws, message);
    });
});


function startStreamingToClient(ws, messages) {
    try {
        useAssistant(messages, ws);
    } catch (error) {
        return error;
    }
}

const OpenAI = require("openai");
const openai = new OpenAI();
const systemMessage = { "role": "system", "content": "" };

fs.readFile(path.join(__dirname, 'public', "instructions.txt"), 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
    } else {
        systemMessage.content = data;
    }
});

class Response {
    constructor() {
        this.status = "";
        this.message = "";
    }

    addStatus(status) {
        this.status = status;
        return this;
    }
    addMessage(message) {
        this.message = message;
        return this;
    }
    getJsonObject() {
        return { status: this.status, message: this.message };
    }
}
// IMPLEMENTUOTI VALIDATIONS
let fullText = ""; // Ensure this is in the appropriate scope if you need to accumulate messages

async function useAssistant(messages, ws) {
    try {
        messages = JSON.parse(messages);
        messages = validateMessages(messages);
        messages.unshift(systemMessage);

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
            stream: true
        });

        // Stream responses as they arrive
        for await (const part of completion) {
            if (part.choices && part.choices[0] && part.choices[0].delta) {
                let text = part.choices[0].delta.content || "";
                // Send each part as it arrives
                ws.send(JSON.stringify(new Response().addMessage(text).addStatus(206).getJsonObject()));
            }
        }
        ws.send(JSON.stringify({ status: 200, message: "End of response" }));
    } catch (error) {
        console.error("Error contacting assistant:", error);
        return { status: 400, content: "Oops! Something went wrong on our servers. For the best support, please contact us at support@simple-painting.com. Thank you for understanding." };
    }
}

app.get('/getChatbot', (request, response) => {
    const chatbotPath = path.join(__dirname, '/public/chatbot.html');
    response.sendFile(chatbotPath);
})

function validateMessages(messages) {
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.role == null || message.content == null) {
            messages.splice(i, 1);
        }
    }
    return messages;
}