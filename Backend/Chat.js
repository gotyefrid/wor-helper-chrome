import { CommonHelper } from './CommonHelper.js';
export class Chat {
    isChatPage = false;

    removeFromMatch(array, target) {
        if (!array) {
            return [];
        }

        if (!target) {
            return array;
        }

        const index = array.findIndex(item =>
            item.type === target.type &&
            item.time === target.time &&
            item.text === target.text
        );

        if (index !== -1) {
            array.splice(index); // удаляет с найденного индекса и до конца
        }

        return array;
    }

    async sendMessagesToTelegram(msg) {
        let isToMe = false;
        let playerName = await CommonHelper.getExtStorage('wor_chat_player_name');

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
            await CommonHelper.sendTelegramMessage(text, 'common', isToMe, 'MarkdownV2');
        }

        await CommonHelper.sendTelegramMessage(text, 'chat', isToMe, 'MarkdownV2');
        await CommonHelper.delay(200);
    }
}