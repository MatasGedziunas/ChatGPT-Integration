const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const conversation = document.querySelector(".conversation");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatInputDiv = document.querySelector(".chat-input");
const starterQuestions = document.getElementById('starter-questions');
const localStorageIdentifier = "simplePainting-chatHistory";
const feedbackDiv = document.getElementById('feedback');
const dislikeFeedbackDiv = document.getElementById('dislike-feedback');
const dislikeFeedbackInput = document.getElementById('feedback-textarea');
const dislikeFeedbackSendButton = document.getElementById('feedback-btn');
const thankYouDiv = document.getElementById('thank-you-div');
let userMessage = null; // Variable to store user's message
let canSend = true;
let chatHistory = localStorage.getItem(localStorageIdentifier);
const inputInitHeight = chatInput.scrollHeight;
const serverUrl = "http://localhost:3000/getResponse";
const roles = { user: "user", assistant: "assistant" };
const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    message = getMarkdownText(message);
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
    // Clear the last message element when the first chunk arrives
    if (isFirstChunk) {
        lastMessageElement.innerHTML = '';
        isFirstChunk = false;
    }
    if (chunk.status == 200) {
        saveChatMessage(roles.assistant, lastMessageElement.innerHTML);
        lastMessageElement.innerHTML = getMarkdownText(lastMessageElement);
        canSend = true;
    } else {
        lastMessageElement.innerHTML += chunk.message;
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
}

const generateResponse = async (chatElement, userMessage) => {
    saveChatMessage(roles.user, userMessage);
    chatHistory = localStorage.getItem(localStorageIdentifier);
    let messageElement = chatElement.querySelector('p');
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(chatHistory);
    } else {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong on our servers. For the best support, please contact us at support@simple-painting.com. Thank you for understanding.";
        canSend = true;
    }

    isFirstChunk = true;
    chatbox.scrollTo(0, chatbox.scrollHeight);
    sendChatBtn.disabled = true;
    setTimeout(function () {
        sendChatBtn.disabled = false;
    }, 1000);
}

const handleChat = () => {
    canSend = false;
    hideStarterQuestions();
    userMessage = chatInput.value.trim();
    if (!userMessage) return;
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    addMessageElementToChat(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    setTimeout(() => {
        // Display "Thinking..." message while waiting for the response
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        addMessageElementToChat(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi, userMessage);
    }, 600);
}

function getMarkdownText(text) {
    const temp = document.createElement('div');
    temp.innerHTML = marked(text);
    return temp.querySelector('p').textContent;
}

function linkifyApiResponse(apiResponse) {
    // Extract the message from the response
    let message = apiResponse;

    // Regular expression to match URLs
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    // Replace URLs with <a> tags
    const linkedMessage = message.replace(urlRegex, function (url) {
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
    chatbox.style.padding = "25px 15px 40px";
}

function handleStarterQuestion(button) {
    const question = button.textContent;
    chatInput.value = question;
    hideStarterQuestions();
    handleChat();
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
}

function showChatHistory() {
    let objectChatHistory = JSON.parse(chatHistory);
    for (let msg of objectChatHistory) {
        let chatLi;
        if (msg.role == roles.user) {
            chatLi = createChatLi(msg.content, "outgoing");
        } else if (msg.role == roles.assistant) {
            chatLi = createChatLi(msg.content, "incoming");
        }
        addMessageElementToChat(chatLi);
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
}

function addMessageElementToChat(chatLi) {
    console.log(chatLi);
    chatbox.appendChild(chatLi);
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
            // setTimeout(() => {
            //     canSend = true;
            // }, 1000);
        }
    }
});

function initiateWebSocketConnection() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => { };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response && (response.status === 200 || response.status === 206)) {
            // Update your chat UI here with the streamed response
            updateChatUI(response);
        } else {
            // Handle errors or status messages
            console.error("Can't connect to backend server");
        }
    };
}

function closeChatbox() {
    chatbox.classList.add('hide');
    chatInputDiv.classList.add('hide');
    feedbackDiv.classList.remove('hide');
}

function openChatbox() {
    chatbox.classList.remove('hide');
    chatInputDiv.classList.remove('hide');
    feedbackDiv.classList.add('hide');
}

function closeHandler() {
    if (!document.body.classList.contains("show-chatbot")) {
        document.body.classList.toggle("show-chatbot");
    } else if (!chatbox.classList.contains('hide')) {
        closeChatbox();
    } else {
        closeFeedback();
    }
}

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => {
    closeHandler();
    ws.close();
});
chatbotToggler.addEventListener("click", () => {
    closeHandler();
    if (chatHistory) {
        showChatHistory();
    }
    initiateWebSocketConnection();
});

function closeFeedback() {
    document.body.classList.toggle("show-chatbot");
    dislikeFeedbackDiv.classList.add('hide');
    thankYouDiv.classList.add('hide');
    setTimeout(() => {
        openChatbox();
    }, 400);
}


function dislikeFeedbackHandler() {
    console.log(dislikeFeedbackInput.value);
    dislikeFeedbackDiv.classList.toggle('hide');
    thankYouDiv.classList.remove('hide');
    dislikeFeedbackInput.value = "";
}

dislikeFeedbackSendButton.addEventListener("click", () => {
    dislikeFeedbackHandler();
});

dislikeFeedbackInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed and message sending is allowed
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        dislikeFeedbackHandler();
    }
});

function rateChatbot(rating) {
    if (rating === 'like') {
        setTimeout(() => {
            closeFeedback();
        }, 100);
    } else {
        feedbackDiv.classList.add('hide');
        dislikeFeedbackDiv.classList.remove('hide');
    }

}

showStarterQuestions();