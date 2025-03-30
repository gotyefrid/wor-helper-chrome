import { sendMessagesFromChat } from './process-chat-backend.js';

// Пересылка сообщений с чата
setInterval(sendMessagesFromChat, 15000);


// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === "тут название команды для обработки") {
//         // тут можно что то делать полезное
//         return true; // ← ВАЖНО! Сообщаем Chrome, что ответ будет позже
//     }
// });