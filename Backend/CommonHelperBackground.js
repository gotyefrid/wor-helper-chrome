export class CommonHelperBackground {
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async log(message, showInFront = true, important, toConsole = true) {
        try {
            let logActive = await CommonHelperBackground.getExtStorage('wor_log_active');

            if (showInFront) {
                // CommonHelperBackground.putInfoBlock();
                // let div = document.querySelector('#temp_block')
                // div.textContent = message;
            }

            if (toConsole) {
                if (logActive) {
                    console.log(message);
                }
            }

            if (important) {
                console.log(message);
            }
        } catch (error) {
        }
    }

    static async getExtStorage(key) {
        let result = await chrome.storage.local.get([key]);

        if (result[key] !== undefined) {
            return result[key];
        }

        return null;
    }

    static async setExtStorage(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }

    static async getTgData(bot = 'common') {
        let botToken;
        let chatId = await CommonHelperBackground.getExtStorage('wor_tg_chat_id');

        switch (bot) {
            case 'chat':
                botToken = await CommonHelperBackground.getExtStorage('wor_tg_bot_chat_token');
                break;
            default:
                botToken = await CommonHelperBackground.getExtStorage('wor_tg_bot_common_token');
        }

        return { botToken, chatId };
    }

    static async sendTelegramMessage(text, bot = 'common', notify = true, parseMode = 'html', expireInSeconds = 60) {
        let notification = await CommonHelperBackground.getExtStorage('wor_tg_notifications_active');

        if (!notification) {
            return;
        }
        let { botToken, chatId } = await CommonHelperBackground.getTgData(bot);

        if (!botToken || !chatId) {
            CommonHelperBackground.log('Нет возможности отправить сообщение в телеграм-бот. Укажите botToken и chatId в localStroage');
            return;
        }

        if (bot === 'common') {
            const now = Math.floor(Date.now() / 1000);

            const lastMessage = await CommonHelperBackground.getExtStorage('wor_tg_common_last_message');
            const isSameText = lastMessage?.text === text;
            const isNotExpired = lastMessage && (now - lastMessage.timestamp) < lastMessage.expire;

            if (isSameText && isNotExpired) {
                CommonHelperBackground.log('Сообщение уже отправлялось недавно. Пропускаем отправку.');
                return;
            }

            await CommonHelperBackground.setExtStorage('wor_tg_common_last_message', {
                text,
                timestamp: now,
                expire: expireInSeconds,
            });
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode,
                disable_notification: !notify
            })
        }).then(response => response.json())
            .then(() => CommonHelperBackground.log("Отправили сообщение в Телеграм", false))
            .catch(error => CommonHelperBackground.log("Ошибка отправки в Telegram:" + JSON.stringify(error), false));
    }
}