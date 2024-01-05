const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
let userMessage = null; // Variable to store user's message
let canSend = true;
let chatHistory = localStorage.getItem('chatHistory');
const inputInitHeight = chatInput.scrollHeight;
// const { response } = require("express");
// const { Configuration, OpenAIApi } = require("openai");
// const configuration = new Configuration({ apiKey: API_KEY });
// const openai = new OpenAIApi(configuration);
// const assistant = openai.beta.assistants.create({
//     id: "paint-by-numbers-ecommerce-assistant",
//     model: "gpt-3.5-turbo",
//     settings: {
//         role: "system",
//         user_prompt: ["You are a helpful assistant for an ecommerce store that sells paint by numbers paintings."],
//         system_prompt: ["You are a helpful assistant for an ecommerce store that sells paint by numbers paintings."]
//     }
// })
// let thread;
const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // return chat <li> element
}

const generateResponse = async(chatElement) => {
    if(!canSend){
        return;
    }
    const messageElement = chatElement.querySelector("p");
    const body = {key: "val"};
    apiCall = async() => {
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
        try{
            const fetchResponse = await fetch("http://localhost:3000/getResponse", settings);
            const data = await fetchResponse.json();
            return data;
        }
        catch(e){
            console.log(e);
        }
    }
    const apiResponse = await apiCall();
    console.log(apiResponse);
    sendChatBtn.disabled = true;   
    setTimeout(function(){
        sendChatBtn.disabled = false;
    }, 1000);
    // Define the properties and message for the API request
    // if (thread == null) {
    //     thread = await openai.beta.threads.create();
    // }
    // const message = await openai.beta.threads.messages.create(
    //     thread.id, {
    //         role: "user",
    //         content: "I need to solve the equation `3x + 11 = 14`. Can you help me?"
    //     }
    // );
    // const run = await openai.beta.threads.runs.create(
    //     thread.id, {
    //         assistant_id: assistant.id,
    //         instructions: "Please address the user as Jane Doe. The user has a premium account."
    //     }
    // );
    // const messages = await openai.beta.threads.messages.list(
    //     thread.id
    // );
    // messageElement.textContent = messages.data[messages.data.length - 1].content.text.value;
    // Send POST request to API, get response and set the reponse as paragraph text
    // fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
    //     messageElement.textContent = data.choices[0].message.content.trim();
    // }).catch(() => {
    //     messageElement.classList.add("error");
    //     messageElement.textContent = "Oops! Something went wrong. Please try again.";
    // }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}
const handleChat = () => {
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if (!userMessage) return;
    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    // Append the user's message to the chatbox
    // saveChatMessage(userMessage);
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        // Display "Thinking..." message while waiting for the response
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 600);
}

function saveChatMessage(message) {
    if (!chatHistory) {
        chatHistory = [];
    } else {
        chatHistory = JSON.parse(chatHistory);
    }

    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});
chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed and message sending is allowed
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if(canSend){
            handleChat();
            chatInput.style.height = `${inputInitHeight}px`;
            chatInput.style.height = `${chatInput.scrollHeight}px`;
            canSend = false;
            setTimeout(() => {
                canSend = true;
            }, 1000);
        }
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
