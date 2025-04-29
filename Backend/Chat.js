import { CommonHelperBackground } from './CommonHelperBackground.js';

export class Chat {
    isChatPage = false;

    /**
     * @param {array}  array  – массив сообщений со страницы
     * @param {object} target – объект последнего отправленного сообщения
     */
    removeFromMatch(array, target) {
        if (!array) {
            return [];
        }

        if (!target) {
            return array;
        }

        // помощник: "2025-04-26 10:00:16" →  Date-timestamp
        const toMs = s => Date.parse(s.replace(' ', 'T'));

        const index = array.findIndex(item =>
            item.type === target.type &&
            item.time === target.time &&
            item.text === target.text
        );

        if (index !== -1) {
            array.splice(index);
        } else {
            // ╔══ обрезка старых сообщений ══╗
            const tgtMs = toMs(target.time);

            // ищем первый элемент, НЕ старее цели
            const firstNewerIdx = array.findIndex(msg => toMs(msg.time) >= tgtMs);

            if (firstNewerIdx === -1) {
                // все сообщения старее – очищаем массив
                array.length = 0;
            } else if (firstNewerIdx > 0) {
                // удаляем всё до firstNewerIdx (сам элемент newer остаётся)
                array.splice(0, firstNewerIdx);
            }
            // ╚════════════════════════════════════════╝
        }

        return array;
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