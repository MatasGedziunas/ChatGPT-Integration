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
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // return chat <li> element
}

const generateResponse = async (chatElement, userMessage) => {
    saveChatMessage(roles.user, userMessage);
    // fix this stuff, reikia kad normaliai json objektai butu storinami in storage, o 
    // tesiog stringai.
    chatHistory = localStorage.getItem(localStorageIdentifier);
    console.log(chatHistory);
    const messageElement = chatElement.querySelector("p");
    const body = { key: "val" };
    apiCall = async () => {
        const settings = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "conversation": chatHistory
            })
        };
        try {
            const fetchResponse = await fetch(serverUrl, settings);
            const data = await fetchResponse.json();
            return data;
        } catch (e) {
            console.log(e);
        }
    }
    let apiResponse = await apiCall();
    // apiResponse = apiResponse.message;
    console.log(apiResponse);
    if (typeof apiResponse !== 'undefined' && apiResponse !== null && apiResponse.message.status == 200) {
        console.log(apiResponse.status);
        messageElement.textContent = apiResponse.message.message;
        saveChatMessage(roles.assistant, apiResponse.message.message);
    } else {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong on our servers. For the best support, please contact us at support@simple-painting.com. Thank you for understanding.";
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
    sendChatBtn.disabled = true;
    setTimeout(function () {
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
    // Append the user's message to the chatbox
    // saveChatMessage(userMessage);
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

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot")
    showChatHistory();
});
// add messages from history
showStarterQuestions();