import { CommonHelperBackground } from './CommonHelperBackground.js';

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
        // 8. ранний выход: если есть элемент с тем же time и text → всё до него
        if (typeof target.text === 'string') {
            const idx = arr.findIndex(
                m => m.time === target.time && m.text === target.text
            );
            if (idx !== -1) {
                return arr.slice(0, idx);
            }
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
            // если ничего не подошло (target свежее всех) — вернуть самый свежий
            return result.length ? result : [arr[0]];
        } else {
            // --- Случай с переходом через полночь ---
            // Находим точку разрыва (где секунды начинают расти)
            let splitIndex = -1;
            for (let i = 1; i < arrSecs.length; i++) {
                if (arrSecs[i] > arrSecs[i - 1]) {
                    splitIndex = i;
                    break;
                }
            }
            if (splitIndex === -1) {
                // не нашли — обрабатывать как без перехода
                const result = [];
                for (let i = 0; i < arr.length; i++) {
                    if (arrSecs[i] >= targetSec) {
                        result.push(arr[i]);
                    } else {
                        break;
                    }
                }
                return result.length ? result : [arr[0]];
            }

            // Границы зон
            const prefixMax = arrSecs[0],            // самое свежее после полуночи
                prefixMin = arrSecs[splitIndex - 1],
                suffixMax = arrSecs[splitIndex],
                suffixMin = arrSecs[arrSecs.length - 1];

            // Определяем зону target
            let zone = null;
            if (targetSec <= prefixMax && targetSec >= prefixMin) {
                zone = 'prefix';
            } else if (targetSec <= suffixMax && targetSec >= suffixMin) {
                zone = 'suffix';
            }
            // target вне диапазона
            if (!zone) {
                // свежее всех → вернуть самый свежий
                if (targetSec > prefixMax) return [arr[0]];
                // старше всех → весь массив
                if (targetSec < suffixMin) return arr;
                // на всякий случай
                return [arr[0]];
            }

            // Формируем результат по зонам
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                const sec = arrSecs[i];
                if (zone === 'prefix') {
                    if (i < splitIndex) {
                        if (sec >= targetSec) result.push(arr[i]);
                        else break;
                    } else break;
                } else { // 'suffix'
                    if (i < splitIndex) {
                        result.push(arr[i]);
                    } else {
                        if (sec >= targetSec) result.push(arr[i]);
                        else break;
                    }
                }
            }
            return result;
        }
    }


    /**
     * Форматирует одно сообщение чата и отправляет его в Telegram.
     *
     * Логика отправки:
     *   1. Если сообщение адресовано игроку (isToMe) — шлём в бот 'common' с 🔔.
     *   2. Если системное и касается игрока (травма, штраф, письмо и т.д.) — тоже в 'common'.
     *   3. Все сообщения всегда идут в бот 'chat' для полного архива.
     *
     * @param {Object} msg - объект сообщения из getParsedMessagesNew
     */
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

        const isChat = msg.type === 'PUBLIC' || msg.type === 'PUBLIC_TO' || msg.type === 'PRIVATE';
        const isSystem = msg.type === 'SYSTEM';

        if (isChat) {
            text += `\`${escape(msg.from)}\``;
            if (msg.to) text += ` → \`${escape(msg.to)}\``;
            text += `: ${escape(msg.text)}`;
        } else if (isSystem) {
            text += `*Система*: ${escape(msg.text)}`;
        } else {
            text += escape(msg.text);
        }

        if (isToMe) {
            await CommonHelperBackground.sendTelegramMessage(text, 'common', isToMe, 'MarkdownV2');
            await this.processDirectMessage(msg);
        }

        // Системные сообщения, которые касаются игрока — дополнительно шлём в 'common'
        if (
            isSystem &&
            (
                msg.text.includes('изъята и возвращена') ||
                msg.text.includes('получена и будет доступна') ||
                msg.text.includes('штраф') ||
                msg.text.includes('травм') ||
                msg.text.includes(playerName) ||
                msg.text.includes('новое письмо')
            )
        ) {
            await CommonHelperBackground.sendTelegramMessage(text, 'common', isToMe, 'MarkdownV2');
        }

        // Все сообщения идут в чат-бот для полного архива
        await CommonHelperBackground.sendTelegramMessage(text, 'chat', isToMe, 'MarkdownV2');
        await CommonHelperBackground.delay(200);
    }

    async _getGameTabId() {
        const tabs = await chrome.tabs.query({});
        const targetTab = tabs.find(tab => tab.url && tab.url.includes('/wap/'));
        return targetTab?.id ?? null;
    }

    async processDirectMessage(msg) {
        const isActive = await CommonHelperBackground.getExtStorage('wor_chat_auto_reply_active');
        if (!isActive) return;

        const senders = await CommonHelperBackground.getExtStorage('wor_chat_auto_reply_senders') || ['Модераторы'];
        const isAllowed = await this._isSenderAllowed(msg.from, senders);
        if (!isAllowed) return;

        const lastSent = await CommonHelperBackground.getExtStorage('wor_chat_auto_reply_last_sent');
        const cooldownMin = (await CommonHelperBackground.getExtStorage('wor_chat_auto_reply_cooldown')) ?? 5;
        const couldownPassed = !lastSent || (Date.now() - lastSent) > cooldownMin * 60 * 1000;

        if (couldownPassed) {
            let answer = await CommonHelperBackground.getExtStorage('wor_chat_auto_answer_text');

            if (!answer) {
                const patterns = await CommonHelperBackground.getExtStorage('wor_chat_auto_reply_patterns') || [];
                answer = this.getAutoReply(msg.text, patterns);
            }

            await this.sendDirectMessage(msg.from, answer, msg.isPrivate);
        }
    }

    async _isSenderAllowed(name, senders) {
        if (senders.includes('Все')) return true;
        if (senders.includes('Модераторы') && await this.isPlayerModerator(name)) return true;
        return senders.includes(name);
    }

    getAutoReply(message, storedPatterns = []) {
        const defaults = ['.гг.', '.гыы.', '.гы.', '.еду.', '.фотограф.', '.куку.'];
        const defaultText = () => defaults[Math.floor(Math.random() * defaults.length)];

        if (!message) return defaultText();

        const text = message.toLowerCase().trim();

        // Формат паттерна: "ключевое_слово:ответ1|ответ2|ответ3"
        for (const patternStr of storedPatterns) {
            const colonIdx = patternStr.indexOf(':');
            if (colonIdx === -1) continue;
            const keyword = patternStr.slice(0, colonIdx).trim().toLowerCase();
            const replies = patternStr.slice(colonIdx + 1).split('|').map(r => r.trim()).filter(Boolean);
            if (!keyword || !replies.length) continue;
            if (text.includes(keyword)) {
                return replies[Math.floor(Math.random() * replies.length)];
            }
        }

        return defaultText();
    }

    async isPlayerModerator(name) {
        const CACHE_TTL = 48 * 60 * 60 * 1000;
        const cached = await CommonHelperBackground.getExtStorage('wor_chat_moderators_list');

        if (cached && cached.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.list.includes(name);
            // return true;
        }

        const tabId = await this._getGameTabId();
        if (!tabId) {
            CommonHelperBackground.log('Вкладка игры не найдена для получения списка модераторов');
            return false;
        }

        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { type: 'fetchModeratorsList', url: '/wap/infoklan.php?name=Misha' }, async (response) => {
                if (chrome.runtime.lastError || !response || response.error) {
                    CommonHelperBackground.log('Ошибка получения списка модераторов: ' + (chrome.runtime.lastError?.message || response?.error));
                    resolve(false);
                    return;
                }

                const list = response.names || [];

                if (!list.includes('Misha')) {
                    list.push('Misha');
                }
                
                await CommonHelperBackground.setExtStorage('wor_chat_moderators_list', {
                    list,
                    timestamp: Date.now()
                });
                resolve(list.includes(name));
                // resolve(true);
            });
        });
    }

    async sendDirectMessage(to, answer, isPrivate = true) {
        const tabId = await this._getGameTabId();
        if (!tabId) {
            CommonHelperBackground.log('Вкладка игры не найдена для отправки сообщения');
            return;
        }

        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { type: 'sendDirectMessage', to, answer, isPrivate }, async (response) => {
                if (chrome.runtime.lastError || !response) {
                    CommonHelperBackground.log('Ошибка отправки личного сообщения: ' + chrome.runtime.lastError?.message);
                    resolve(false);
                    return;
                }

                if (response.status === 200) {
                    await CommonHelperBackground.setExtStorage('wor_chat_auto_reply_last_sent', Date.now());
                    CommonHelperBackground.log(`Ответ отправлен игроку ${to}`);
                    resolve(true);
                } else {
                    CommonHelperBackground.log(`Ошибка при отправке сообщения, статус: ${response.status}`);
                    resolve(false);
                }
            });
        });
    }
}