import {CommonHelperBackground} from './CommonHelperBackground.js';

export class Chat {
    isChatPage = false;

    /**
     * Оставляет в массиве только те сообщения, которые новее, чем target.
     * Работает ХЗ как - ЧатЖпт писал. Решает проблему переходящих суток.
     *
     * @param {Array}  array  – массив сообщений, отсортированный от новых к старым
     * @param {Object} target – объект последнего известного сообщения { type, time, text }
     * @return {Array}        – отфильтрованный массив только с новыми сообщениями
     */
    removeFromMatch(arr, target) {
        // 1. array non-array или пустой → []
        if (!Array.isArray(arr) || arr.length === 0) {
            return [];
        }
        // 2. target falsy или без time → возвращает исходный array
        if (!target || typeof target.time !== 'string') {
            return arr;
        }

        // Парсер времени "HH:MM:SS" → секунды с начала дня
        const parseTimeSec = (timeStr) => {
            const [h, m, s] = timeStr.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        };

        const arrSecs = arr.map(item => parseTimeSec(item.time));
        const targetSec = parseTimeSec(target.time);

        // Проверяем, есть ли переход через полночь
        const wrap = arrSecs[0] < arrSecs[arrSecs.length - 1];

        if (!wrap) {
            // --- Простой случай: без перехода суток ---
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                if (arrSecs[i] >= targetSec) {
                    result.push(arr[i]);
                } else {
                    break;
                }
            }
            return result;
        } else {
            // --- Случай с переходом через полночь ---
            // Находим индекс, где начинается "предыдущий день"
            let splitIndex = -1;
            for (let i = 1; i < arrSecs.length; i++) {
                if (arrSecs[i] > arrSecs[i - 1]) {
                    splitIndex = i;
                    break;
                }
            }
            // Если не нашли точку разрыва, обрабатываем как без перехода
            if (splitIndex === -1) {
                const result = [];
                for (let i = 0; i < arr.length; i++) {
                    if (arrSecs[i] >= targetSec) {
                        result.push(arr[i]);
                    } else {
                        break;
                    }
                }
                return result;
            }

            // Границы зон
            const prefixMax = arrSecs[0];
            const prefixMin = arrSecs[splitIndex - 1];
            const suffixMax = arrSecs[splitIndex];
            const suffixMin = arrSecs[arrSecs.length - 1];

            // Определяем, в какой "зоне" лежит target
            let zone = null;
            if (targetSec <= prefixMax && targetSec >= prefixMin) {
                zone = 'prefix';
            } else if (targetSec <= suffixMax && targetSec >= suffixMin) {
                zone = 'suffix';
            }
            // Если target вне диапазона — решаем, older или newer
            if (!zone) {
                // новее всех → []
                if (targetSec > prefixMax) return [];
                // старше всех → весь массив
                if (targetSec < suffixMin) return arr;
                // на всякий случай
                return [];
            }

            // Собираем результат по зонам
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                const itemSec = arrSecs[i];

                if (zone === 'prefix') {
                    // в "утренней" части до полуночи
                    if (i < splitIndex) {
                        if (itemSec >= targetSec) {
                            result.push(arr[i]);
                        } else {
                            break;
                        }
                    } else {
                        // дальше — предыдущий день
                        break;
                    }
                } else {
                    // zone === 'suffix'
                    if (i < splitIndex) {
                        // все утренние события — после цели
                        result.push(arr[i]);
                    } else {
                        // в "вечерней" части до полуночи
                        if (itemSec >= targetSec) {
                            result.push(arr[i]);
                        } else {
                            break;
                        }
                    }
                }
            }
            return result;
        }
    }


    async sendMessagesToTelegram(msg) {
        let isToMe = false;
        let playerName = await CommonHelperBackground.getExtStorage('wor_chat_player_name');

        if (playerName) {
            isToMe = msg.to && msg.to.toLowerCase().includes(playerName.toLowerCase());
        }

        const escape = (text) => {
            if (!text) return ''; // Проверяет null, undefined, '', 0, false, NaN
            return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
        };

        const time = escape(msg.time);
        let text = `[${time}] `;
        text += isToMe ? `🔔 ` : '';

        if (msg.type === 'chat') {
            text += `\`${escape(msg.from)}\``;
            if (msg.to) text += ` → \`${escape(msg.to)}\``;
            text += `: ${escape(msg.text)}`;
        } else if (msg.type === 'system') {
            text += `*Система*: ${escape(msg.text)}`;
        } else {
            text += escape(msg.text);
        }

        if (isToMe) {
            await CommonHelperBackground.sendTelegramMessage(text, 'common', isToMe, 'MarkdownV2');
        }

        if (
            msg.type === 'system' &&
            (
                msg.text.includes('изъята и возвращена') ||
                msg.text.includes('получена и будет доступна') ||
                msg.text.includes('штраф') ||
                msg.text.includes('травм') ||
                msg.text.includes(playerName)
            )
        ) {
            await CommonHelperBackground.sendTelegramMessage(text, 'common', isToMe, 'MarkdownV2');
        }

        await CommonHelperBackground.sendTelegramMessage(text, 'chat', isToMe, 'MarkdownV2');
        await CommonHelperBackground.delay(200);
    }
}