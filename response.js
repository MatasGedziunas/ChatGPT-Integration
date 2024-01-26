const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, () => { console.log("Server running") });

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

function validateMessages(messages) {
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.role == null || message.content == null) {
            messages.splice(i, 1);
        }
    }
    return messages;
}

// IMPLEMENTUOTI VALIDATIONS
async function useAssistant(messages) {
    try {
        messages = JSON.parse(messages);
        messages = validateMessages(messages);
        messages.unshift(systemMessage);
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
        });
        let responseMessage = completion.choices[0].message.content;
        console.log(responseMessage);
        let response = new Response().addMessage(responseMessage).addStatus(200);
        return response.getJsonObject();
    } catch (error) {
        let response = { status: 400, content: "Oops! Something went wrong on our servers. For the best support, please contact us at support@simple-painting.com. Thank you for understanding." };
        console.error("Error contacting assistant:", error);
    }
}

app.post('/getResponse', async(request, response) => {
    try {
        console.log("Got request");
        const assistantResponse = await useAssistant(request.body.conversation);
        console.log(assistantResponse);
        response.json({ message: assistantResponse });
    } catch (error) {
        console.error("Error in /getResponse:", error);
        response.status(500).send("An error occurred while processing your request.");
    }
});

app.get('/getChatbot', (request, response) => {
    const chatbotPath = path.join(__dirname, '/public/chatbot.html');
    response.sendFile(chatbotPath);
})