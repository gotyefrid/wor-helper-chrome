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
    removeFromMatch(array, target) {
        if (!Array.isArray(array) || array.length === 0) {
            return [];
        }
        if (!target || !target.time) {
            return array;
        }

        // парсер "HH:MM:SS" → секунды
        const timeToSec = str => {
            const [h, m, s] = str.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        };

        const secTarget = timeToSec(target.time);
        const secLatest = timeToSec(array[0].time);
        // *** вот эта проверка ***
        // если target случился позже, чем самое свежее сообщение в array,
        // то новых сообщений просто нет:
        if (secTarget > secLatest) {
            return [];
        }

        // дальше — ваша прежняя логика для учёта перехода через полночь
        const secs = array.map(msg => timeToSec(msg.time));
        const offsets = new Array(array.length);
        offsets[0] = 0;
        for (let i = 1; i < array.length; i++) {
            // если время возросло — значит мы перешли в "еще более старый" день
            offsets[i] = offsets[i - 1] + (secs[i] > secs[i - 1] ? 1 : 0);
        }

        // найдём границу "нулевого дня":
        let maxSecDay0 = secs[0];
        // определяем смещение дня для target (0 — текущий, 1 — предыдущий)
        const targetOffset = secTarget > maxSecDay0 ? 1 : 0;

        // фильтруем: оставляем те, которые строго новее таргета
        return array.filter((msg, i) => {
            if (offsets[i] < targetOffset) {
                return true;
            }
            if (offsets[i] > targetOffset) {
                return false;
            }
            return secs[i] > secTarget;
        });
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