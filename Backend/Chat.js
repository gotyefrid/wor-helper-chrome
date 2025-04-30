import { CommonHelperBackground } from './CommonHelperBackground.js';

export class Chat {
    isChatPage = false;

    /**
     * Оставляет в массиве только те сообщения, которые новее, чем target.
     * Работет ХЗ как - ЧатЖпт писал. Решает проблему переходящих суток.
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
            // если нет target — ничего не отрезаем
            return array;
        }

        // 1) Вспомогательная: парсит "HH:MM:SS" → число секунд
        const timeToSec = str => {
            const [h, m, s] = str.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        };

        // 2) Преобразуем все времена в секунды
        const secs = array.map(msg => timeToSec(msg.time));

        // 3) Построим массив offsets — «номер» дня для каждого сообщения
        //    offset = 0 для самого нового (array[0]), инкрементится, когда время растёт (т.е. мы пересекли полночь)
        const offsets = new Array(array.length);
        offsets[0] = 0;
        for (let i = 1; i < array.length; i++) {
            // если время current > время предыдущего, значит текущий лежит в «еще более старом» дне
            offsets[i] = offsets[i - 1] + (secs[i] > secs[i - 1] ? 1 : 0);
        }

        // 4) Найдем максимальное время в исходном «дне 0» (offset = 0).
        //    Всё, что больше этого — уже на следующий день
        let maxSecDay0 = 0;
        for (let i = 0; i < array.length && offsets[i] === 0; i++) {
            if (secs[i] > maxSecDay0) {
                maxSecDay0 = secs[i];
            }
        }

        // 5) Парсим target.time и определяем его offset:
        //    если целевой time-of-day больше любого времени из day0,
        //    значит target лежит в предыдущем дне (offset = 1), иначе — в текущем (0)
        const secTarget = timeToSec(target.time);
        const targetOffset = secTarget > maxSecDay0 ? 1 : 0;

        // 6) Фильтруем: сообщение новее target, если
        //    — его offset < targetOffset  (оно из более «свежего» дня),
        //    или
        //    — offset === targetOffset и его time-of-day больше secTarget
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