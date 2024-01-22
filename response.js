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
const { threadId } = require('worker_threads');
const openai = new OpenAI();
const systemMessage = { "role": "system", "content": "" };
fs.readFile(path.join(__dirname, 'public', "instructions.txt"), 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
    } else {
        systemMessage.content = data;
    }
});
async function checkRunStatus(threadId, runId) {
    try {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(run.status);
        console.log(run.last_error);
        if (run.status == "failed") {
            return false;
        } else if (run.status != "completed") {
            await new Promise(resolve => setTimeout(resolve, 500));
            return checkRunStatus(threadId, runId);
        } else {
            return true;
        }
    } catch (error) {
        console.error("Error checking run status: ", error);
    }
}

async function useAssistant(messages) {
    try {
        messages.unshift(systemMessage);
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
        });
        const response = completion.choices[0].message;
        return response.content;
    } catch (error) {
        console.error("Error creating assistant:", error);
    }
}

app.post('/getResponse', async (request, response) => {
    try {
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