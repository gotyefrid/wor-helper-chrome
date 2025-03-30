import { Chat } from './Chat.js';
import { CommonHelper } from './CommonHelper.js';

export async function sendMessagesFromChat() {
    try {
        const tabs = await chrome.tabs.query({});
        // Находим первую вкладку, где в URL есть "/wap/"
        const targetTab = tabs.find(tab => tab.url && tab.url.includes("/wap/"));

        if (!targetTab || !targetTab.id) {
            console.log('Вкладка с "/wap/" в URL не найдена');
            return;
        }

        chrome.tabs.sendMessage(targetTab.id, { type: "getChatMessages" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Ошибка при отправке сообщения:', chrome.runtime.lastError.message);
                return;
            }

            (async () => {
                let chat = new Chat();
                let newMessages = [];

                let actualMessages = response.formattedMessages;
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
            })();

        });

    } catch (err) {
        console.error('Ошибка при поиске вкладки:', err);
    }
}
