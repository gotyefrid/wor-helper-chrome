import { Chat } from './Chat.js';
import { CommonHelperBackground } from './CommonHelperBackground.js';

export async function sendMessagesFromChat() {
    try {
        let notification = await CommonHelperBackground.getExtStorage('wor_tg_notifications_active');

        if (!notification) {
            return;
        }

        const tabs = await chrome.tabs.query({});
        // Находим первую вкладку, где в URL есть "/wap/"
        const targetTab = tabs.find(tab => tab.url && tab.url.includes("/wap/"));

        if (!targetTab || !targetTab.id) {
            await CommonHelperBackground.log('Вкладка с "/wap/" в URL не найдена');
            return;
        }

        chrome.tabs.sendMessage(targetTab.id, { type: "getChatMessages" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Ошибка при отправке сообщения:', chrome.runtime.lastError.message);
                return;
            }

            if (response.error) {
                return;
            }

            (async () => {
                let chat = new Chat();
                let newMessages = [];
                let resultMessages = [];

                let actualMessages = response.formattedMessages;
                let oldMessages = await CommonHelperBackground.getExtStorage('wor_chat_message_queue') || [];
                let oldNewestMessage = oldMessages[0] ?? {};

                if (oldMessages.length === 0) {
                    resultMessages = actualMessages
                    await CommonHelperBackground.sendTelegramMessage('Очередь пуста, беру все сообщения.');
                } else if (oldNewestMessage) {
                    newMessages = chat.removeFromMatch(actualMessages, oldNewestMessage);
                    resultMessages = [...newMessages, ...oldMessages];
                }

                await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);

                if (resultMessages.length > 50) {
                    await CommonHelperBackground.sendTelegramMessage('Отправляем все сообщения со страницы');
                }

                while (resultMessages.length >= 1) {
                    if (resultMessages.length == 1 && resultMessages[0] !== undefined) {

                        if (resultMessages[0].sended == true) {
                            break;
                        }

                        resultMessages[0].sended = true;
                        await chat.sendMessagesToTelegram(resultMessages[0]);
                        await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);
                        break;
                    }

                    // Вырезаем последний элемент
                    const lastElement = resultMessages.pop();

                    if (lastElement.sended != true) {
                        await chat.sendMessagesToTelegram(lastElement);
                    }

                    await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);
                }

                CommonHelperBackground.log("Всё отправили.");
            })();

        });

    } catch (err) {
        CommonHelperBackground.log('Ошибка при поиске вкладки:' + JSON.stringify(err));
    }
}
