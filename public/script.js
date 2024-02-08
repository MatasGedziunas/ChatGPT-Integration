const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const conversation = document.querySelector(".conversation");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const starterQuestions = document.querySelector("#starter-questions");
const localStorageIdentifier = "simplePainting-chatHistory";
let userMessage = null; // Variable to store user's message
let canSend = true;
let chatHistory = localStorage.getItem(localStorageIdentifier);
const inputInitHeight = chatInput.scrollHeight;
const serverUrl = "http://localhost:3000/getResponse";
const roles = { user: "user", assistant: "assistant" };
const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    message = linkifyApiResponse(message);
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").innerHTML = message;
    return chatLi; // return chat <li> element
}

// WEBSOCKETS
let ws;
let isFirstChunk = true;

function updateChatUI(chunk) {
    const lastMessageElement = chatbox.lastChild.querySelector("p");
    console.log("hellop");
    // Clear the last message element when the first chunk arrives
    if (isFirstChunk) {
        lastMessageElement.innerHTML = '';
        isFirstChunk = false;
    }
    if (chunk.status == 200) {
        saveChatMessage(roles.assistant, lastMessageElement.innerHTML);
        lastMessageElement.innerHTML = linkifyApiResponse(lastMessageElement.innerHTML);
    } else {
        lastMessageElement.innerHTML += chunk.message;
    }

}

const generateResponse = async(chatElement, userMessage) => {
    saveChatMessage(roles.user, userMessage);
    chatHistory = localStorage.getItem(localStorageIdentifier);
    console.log(chatHistory);
    let messageElement = chatElement.querySelector('p');
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(chatHistory);
    } else {
        console.error('WebSocket connection is not open');
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong on our servers. For the best support, please contact us at support@simple-painting.com. Thank you for understanding.";
    }
    isFirstChunk = true;
    chatbox.scrollTo(0, chatbox.scrollHeight);
    sendChatBtn.disabled = true;
    setTimeout(function() {
        sendChatBtn.disabled = false;
    }, 1000);
}

const handleChat = () => {
    hideStarterQuestions();
    userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
    if (!userMessage) return;
    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    setTimeout(() => {
        // Display "Thinking..." message while waiting for the response
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi, userMessage);
    }, 600);
}

function linkifyApiResponse(apiResponse) {
    // Extract the message from the response
    let message = apiResponse;

    // Regular expression to match URLs
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    // Replace URLs with <a> tags
    const linkedMessage = message.replace(urlRegex, function(url) {
        // Ensure the url starts with a valid protocol or 'www.'
        let hyperlink = url;
        if (!hyperlink.match('^https?:\/\/')) {
            hyperlink = 'http://' + hyperlink; // Assuming http if no protocol is specified
        }
        // Return the hyperlink <a> tag
        return `<a href="${hyperlink}" target="_blank">${url}</a>`;
    });

    // Return the linked message
    return linkedMessage;
}


function saveChatMessage(role, message) {
    try {
        chatHistory = localStorage.getItem(localStorageIdentifier);
        // Parse the string back into an array
        chatHistory = chatHistory ? JSON.parse(chatHistory) : [];
        const jsonMsg = { "role": role, "content": message };
        chatHistory.push(jsonMsg);

        // Convert the array back to a string to store in localStorage
        localStorage.setItem(localStorageIdentifier, JSON.stringify(chatHistory));
    } catch (error) {
        console.error("Error handling chat history:", error);

        // Clear or reset localStorage if there's an error
        localStorage.setItem(localStorageIdentifier, JSON.stringify([]));
        chatHistory = localStorage.getItem(localStorageIdentifier);
        chatHistory = chatHistory ? JSON.parse(chatHistory) : [];
        const jsonMsg = { "role": role, "content": message };
        chatHistory.push(jsonMsg);

        // Convert the array back to a string to store in localStorage
        localStorage.setItem(localStorageIdentifier, JSON.stringify(chatHistory));
    }
}


function showStarterQuestions() {
    starterQuestions.classList.add('show');
}

function hideStarterQuestions() {
    starterQuestions.classList.remove('show');
}

function handleStarterQuestion(starterQuestionDiv) {
    const question = starterQuestionDiv.querySelector("li").textContent;
    chatInput.value = question;
    hideStarterQuestions();
    handleChat();
}

function showChatHistory() {
    console.log(chatHistory);
    let objectChatHistory = JSON.parse(chatHistory);
    for (let msg of objectChatHistory) {
        let chatLi;
        if (msg.role == roles.user) {
            chatLi = createChatLi(msg.content, "outgoing");
        } else if (msg.role == roles.assistant) {
            chatLi = createChatLi(msg.content, "incoming");
        }
        chatbox.appendChild(chatLi);
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
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
        if (canSend) {
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

function initiateWebSocketConnection() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response && (response.status === 200 || response.status === 206)) {
            // Update your chat UI here with the streamed response
            updateChatUI(response);
        } else {
            // Handle errors or status messages
            console.error('Streaming error:', response.content);

        }
    };
}

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => {
    document.body.classList.remove("show-chatbot")
    ws.close();
});
chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot")
    if (chatHistory) {
        showChatHistory();
    }
    initiateWebSocketConnection();
});
// add messages from history
if (chatHistory == null) {
    showStarterQuestions();
}