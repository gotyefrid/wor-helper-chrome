import { sendMessagesFromChat } from './process-chat-backend.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('sendMessagesAlarm', {
        periodInMinutes: 0.1 // 15 секунд (0.25 мин)
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sendMessagesAlarm') {
        sendMessagesFromChat();
    }
});
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === "тут название команды для обработки") {
//         // тут можно что то делать полезное
//         return true; // ← ВАЖНО! Сообщаем Chrome, что ответ будет позже
//     }
// });