(async function () {

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let notification = await CommonHelper.getExtStorage('wor_tg_notifications_active');

    if (!notification) {
        return;
    }

    let chat = new Chat();

    if (!chat.isChatPage) {
        return;
    }

    while (true) {
        try {
            // Отправка сообщений из чата в Telegram
            chat.sendMessagesToTelegram(chat.getParsedMessages());

            // Получаем последний update_id
            let lastId = await CommonHelper.getRemoteTGUpdateId();

            if (!lastId || lastId == 0) {
                CommonHelper.log('update_id не найден! Процессим в холостую', false);
                await CommonHelper.getTelegramUpdates('chat', 0, true);
            } else {
                CommonHelper.log('Получили последний update_id: ' + lastId, false);
                const messages = await CommonHelper.getTelegramUpdates('chat', lastId, false);
                
                CommonHelper.log('Получили сообщения из телеграма: ' + JSON.stringify(messages), false);
                await handleTelegramMessages(messages);
            }
        } catch (err) {
            CommonHelper.log('Ошибка в цикле обработки:', err);
        }

        // Ждём 10 секунд перед следующим запуском
        await CommonHelper.delay(10000);
    }
})();

async function handleTelegramMessages(messages) {
    for (const { message } of messages) {
        if (!message) continue;

        let recipient = null;
        let content = message;
        let privateMessage = false;

        const privateMatch = message.match(/^@@(.+?)@\s*(.+)/);
        const publicMatch = message.match(/^@(.+?)@\s*(.+)/);

        if (privateMatch) {
            recipient = privateMatch[1].trim();
            content = privateMatch[2].trim();
            privateMessage = true;
        } else if (publicMatch) {
            recipient = publicMatch[1].trim();
            content = publicMatch[2].trim();
            privateMessage = false;
        }

        // Отправляем сообщение в игру
        CommonHelper.sendMessageToChat(content, recipient, privateMessage);
        console.log(`➡️ Написали в игровой чат: "${content}" → ${recipient || 'всем'} ${privateMessage ? '(приватно)' : ''}`);
    }
}
