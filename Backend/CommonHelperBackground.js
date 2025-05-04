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

    static async sendTelegramMessage(text, bot = 'common', notify = true, parseMode = 'html') {
        let notification = await CommonHelperBackground.getExtStorage('wor_tg_notifications_active');

        if (!notification) {
            return;
        }
        
        let { botToken, chatId } = await CommonHelperBackground.getTgData(bot);

        if (!botToken || !chatId) {
            console.log('Нет возможности отправить сообщение в телеграм-бот. Укажите botToken и chatId в Stroage');
            return;
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

    static async turnAlchemistry(active = true) {
        await CommonHelperBackground.setExtStorage('wor_chemistry_active', active);
    }

    static async turnFighting(active = true) {
        await CommonHelperBackground.setExtStorage('wor_fight_active', active);
    }

    static async turnBandits(active = true) {
        await CommonHelperBackground.setExtStorage('wor_bandits_active', active);
    }

    static async turnFishing(active = true) {
        await CommonHelperBackground.setExtStorage('wor_fishing_active', active);
    }

    static async setFightExitUrl(url) {
        if (!url) {
            CommonHelperBackground.log('Очищаем ссылку выхода из боя', false);
        } else {
            CommonHelperBackground.log('Запоминаем ссылку выхода из боя', false);
        }
        
        CommonHelperBackground.setExtStorage('wor_fight_exit_url', url);
    }
}