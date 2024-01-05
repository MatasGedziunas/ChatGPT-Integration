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
        const assistant = await openai.beta.assistants.create({
            name: "Paint by numbers shop assistant",
            instructions: "You are a paint by numbers shop assistant. The shop is called 'Simple Painting'. Provide help to users",
            tools: [{type: "retrieval"}],
            model: "gpt-3.5-turbo-1106"
        });
        const thread = await openai.beta.threads.create();
        for(let i = 0; i < messages.length;i++){
            // await openai.beta.threads.messages.create(
            //     thread.id,
            //     {role: messages[i].role, content: messages[i].content}
            // );
            
        }
        await openai.beta.threads.messages.create(
            thread.id,
            { role: "user", content: "How does AI work? Explain it in simple terms." }
          );
        const run = await openai.beta.threads.runs.create(
            thread.id,
            {
                assistant_id: assistant.id
            }
        );
        const runStatus = await checkRunStatus(thread.id, run.id);
        const messageList = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messageList.data[messageList.data.length - 1].content.text;
        return lastMessage;
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