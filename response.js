const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, () => {console.log("Server running")});

const OpenAI = require("openai");
const { threadId } = require('worker_threads');
const openai = new OpenAI();

async function checkRunStatus(threadId, runId){
    try{
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(run.status);
        console.log(run.last_error);
        if(run.status == "failed"){
            return false;
        }
        else if(run.status != "completed"){
            await new Promise(resolve => setTimeout(resolve, 500));
            return checkRunStatus(threadId, runId);
        }
        else{
            return true;
        }
    }
    catch(error){
        console.error("Error checking run status: ", error);
    }
}

async function useAssistant(messages) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [{"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"},
        {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
        {"role": "user", "content": "Where was it played?"}],
            model: "gpt-3.5-turbo",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error creating assistant:", error);
    }
}

app.post('/getResponse', async(request, response) => {
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