const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
let userMessage = null; // Variable to store user's message
let canSend = true;
let chatHistory = localStorage.getItem('chatHistory');
const inputInitHeight = chatInput.scrollHeight;
const createChatLi = (message, className) => {
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; // return chat <li> element
}

const generateResponse = async (chatElement) => {
    console.log("Hello");
    console.log("Hellos");
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
                "conversation": [
                    { "role": "user", "content": "If you buy 3 sets in a bundle are there still free brushes with the set?" }
                ]
            })
        };
        try {
            const fetchResponse = await fetch("http://localhost:3000/getResponse", settings);
            const data = await fetchResponse.json();
            return data;
        } catch (e) {
            console.log(e);
        }
    }
    const apiResponse = await apiCall();
    console.log(apiResponse);
    if (typeof apiResponse !== 'undefined' && apiResponse !== null) {
        messageElement.textContent = apiResponse.message;
    } else {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. For the best support, please contact us at support@simple-painting.com. Thank you for understanding.";
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
    sendChatBtn.disabled = true;
    setTimeout(function () {
        sendChatBtn.disabled = false;
    }, 1000);

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
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));