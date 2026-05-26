import { sendMessagesFromChat } from './process-chat-backend.js';
import { disableChaosBattle } from './process-common-backend.js';
import { CommonHelperBackground } from './CommonHelperBackground.js';

const CHAT_ALARM_MS_FROM_DEFAULT = 5000;
const CHAT_ALARM_MS_TO_DEFAULT = 30000;

async function scheduleNextChatAlarm() {
    let msFrom = CHAT_ALARM_MS_FROM_DEFAULT;
    let msTo = CHAT_ALARM_MS_TO_DEFAULT;

    const stored = await CommonHelperBackground.getExtStorage('wor_chat_parse_interval');
    if (stored) {
        const m = stored.match(/^(\d+)(?:,(\d+))?$/);
        if (m) {
            msFrom = parseInt(m[1]) * 1000;
            msTo = m[2] !== undefined ? parseInt(m[2]) * 1000 : msFrom;
        }
    }

    const ms = Math.floor(Math.random() * (msTo - msFrom + 1)) + msFrom;
    chrome.alarms.create('sendMessagesAlarm', { delayInMinutes: ms / 60000 });
}

async function ensureAlarmsCreated() {
    const chatAlarm = await chrome.alarms.get('sendMessagesAlarm');
    if (!chatAlarm) {
        scheduleNextChatAlarm();
    }
    const chaosAlarm = await chrome.alarms.get('disableChaosBattle');
    if (!chaosAlarm) {
        chrome.alarms.create('disableChaosBattle', { periodInMinutes: 30 });
    }
}

chrome.runtime.onInstalled.addListener(ensureAlarmsCreated);
chrome.runtime.onStartup.addListener(ensureAlarmsCreated);
ensureAlarmsCreated();

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sendMessagesAlarm') {
        sendMessagesFromChat();
        scheduleNextChatAlarm();
    }
    if (alarm.name === 'disableChaosBattle') {
        disableChaosBattle();
    }
});


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "sendRequestResolveCaptcha") {
        (async () => {
            try {
                const { bgBase64, puzzleBase64 } = message.data;
                const bgBlob = await (await fetch(bgBase64)).blob();

                let formData = new FormData();
                formData.append("background", bgBlob, "captcha_bg.png");

                if (puzzleBase64) {
                    const puzzleBlob = await (await fetch(puzzleBase64)).blob();
                    formData.append("piece", puzzleBlob, "captcha_puzzle.png");
                }

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