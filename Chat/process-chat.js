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
            let newMessages = [];

            let actualMessages = Chat.getParsedMessages();
            let oldMessages = await CommonHelper.getExtStorage('wor_chat_message_queue') || [];
            let oldNewestMessage = oldMessages[0] ?? [];

            if (oldMessages.length === 0) {
                newMessages = actualMessages;
            } else {
                newMessages = chat.removeFromMatch(actualMessages, oldNewestMessage);
            }

            let resultMessages = [...newMessages, ...oldMessages];

            await CommonHelper.setExtStorage('wor_chat_message_queue', resultMessages);

            while (resultMessages.length > 1) {
                // Вырезаем последний элемент
                const lastElement = resultMessages.pop();
                await chat.sendMessagesToTelegram(lastElement);
                await CommonHelper.setExtStorage('wor_chat_message_queue', resultMessages);
            }

            CommonHelper.log("Всё отправили.");
        } catch (err) {
            console.log(err);
        }

        // Ждём 10 секунд перед следующим запуском
        await CommonHelper.delay(10000);
    }
})();
