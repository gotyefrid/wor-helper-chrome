import { sendMessagesFromChat } from './process-chat-backend.js';
import { disableChaosBattle } from './process-common-backend.js';
import { CommonHelperBackground } from './CommonHelperBackground.js';

const GAME_URL = 'http://185.212.47.8/wap/';

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('sendMessagesAlarm', {
        periodInMinutes: 0.25 // 15 секунд (0.25 мин)
    });
    chrome.alarms.create('disableChaosBattle', {
        periodInMinutes: 30
    });
    chrome.alarms.create('tabWatchdog', {
        periodInMinutes: 1
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sendMessagesAlarm') {
        sendMessagesFromChat();
    }
    if (alarm.name === 'disableChaosBattle') {
        disableChaosBattle();
    }
    if (alarm.name === 'tabWatchdog') {
        chrome.tabs.query({}, (tabs) => {
            for (const tab of tabs) {
                if (tab.url && tab.url.startsWith('chrome-error://')) {
                    chrome.tabs.update(tab.id, { url: GAME_URL });
                }
            }
        });
    }
});

// Мгновенная реакция на "Aw, Snap!" — не ждём следующего alarm
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && changeInfo.url.startsWith('chrome-error://')) {
        chrome.tabs.update(tabId, { url: GAME_URL });
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "sendRequestResolveCaptcha") {
        (async () => {
            try {
                const base64 = message.data.imageBase64;
                const blob = await (await fetch(base64)).blob();

                let formData = new FormData();
                formData.append("file", blob, "captcha.png");

                const CAPTCHA_HOST = await CommonHelperBackground.getExtStorage('wor_captcha_host');

                if (!CAPTCHA_HOST.startsWith('http')) {
                    CommonHelperBackground.log('Не верно указан домен резовлинга капчи. Нужно начинать с http')
                    sendResponse({ success: false, error: 'Не верно указан домен резовлинга капчи. Нужно начинать с http' });
                }

                let response = await fetch(CAPTCHA_HOST + '/detect_puzzle', {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                sendResponse({ success: true, data: result });
            } catch (e) {
                let message = "Ошибка в запросе:" + e.toString();
                await CommonHelperBackground.sendTelegramMessage(message);
                CommonHelperBackground.log(message);
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