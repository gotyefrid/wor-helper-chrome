import { sendMessagesFromChat } from './process-chat-backend.js';
import { CommonHelperBackground } from './CommonHelperBackground.js';

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('sendMessagesAlarm', {
        periodInMinutes: 0.25 // 15 секунд (0.25 мин)
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sendMessagesAlarm') {
        sendMessagesFromChat();
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "sendRequestResoleCaptcha") {
        (async () => {
            try {
                const base64 = message.data.imageBase64;
                const blob = await (await fetch(base64)).blob();

                let formData = new FormData();
                formData.append("file", blob, "captcha.png");

                const CAPTCHA_HOST = await CommonHelperBackground.getExtStorage('wor_captcha_host');
                let response = await fetch(CAPTCHA_HOST, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                sendResponse({ success: true, data: result });
            } catch (e) {
                console.error("Ошибка в запросе:", e);
                sendResponse({ success: false, error: e.toString() });
            }
        })();

        return true; // <-- теперь Chrome точно "держит" канал
    }
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.type === "тут название команды для обработки") {
//         // тут можно что то делать полезное
//         return true; // ← ВАЖНО! Сообщаем Chrome, что ответ будет позже
//     }
// });