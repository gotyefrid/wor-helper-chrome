import { Chat } from './Chat.js';
import { CommonHelperBackground } from './CommonHelperBackground.js';

/**
 * Основной цикл отправки сообщений чата в Telegram. Вызывается alarm'ом каждые 15 секунд.
 *
 * Алгоритм:
 * 1. Запрашивает актуальные сообщения с чат-страницы через content script (getChatMessages).
 * 2. Сравнивает с ранее сохранённой очередью (wor_chat_message_queue):
 *    - Если очередь пуста — берём все актуальные сообщения.
 *    - Иначе — берём только те, что новее самого свежего сообщения из очереди
 *      (определяется через removeFromMatch по полям time и text).
 * 3. Объединяет новые и старые (ещё не отправленные) сообщения в одну очередь.
 * 4. Отправляет из очереди по одному сообщению за цикл, начиная со старейшего
 *    (обходим с конца массива, где старые сообщения), помечая отправленные флагом sended=true.
 * 5. Сохраняет актуальное состояние очереди в storage после каждого шага.
 *
 * Очередь (wor_chat_message_queue) хранит сообщения от НОВЫХ к СТАРЫМ (индекс 0 = самое новое).
 */
export async function sendMessagesFromChat() {
    try {
        let parseActive = await CommonHelperBackground.getExtStorage('wor_chat_parse_active');

        if (!parseActive) {
            return;
        }

        let notification = await CommonHelperBackground.getExtStorage('wor_tg_notifications_active');

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

                // actualMessages — свежие сообщения со страницы (от новых к старым)
                let actualMessages = response.formattedMessages;
                // oldMessages — очередь из предыдущего цикла (тоже от новых к старым)
                let oldMessages = await CommonHelperBackground.getExtStorage('wor_chat_message_queue') || [];
                // oldNewestMessage — самое свежее ранее известное сообщение (индекс 0)
                let oldNewestMessage = oldMessages[0] ?? {};

                if (oldMessages.length === 0) {
                    // Первый запуск или очередь была очищена — берём все актуальные сообщения
                    resultMessages = actualMessages;
                    if (notification) {
                        await CommonHelperBackground.sendTelegramMessage('Очередь пуста, беру все сообщения.');
                    }
                } else if (oldNewestMessage) {
                    // Отрезаем из actualMessages всё, что старше или равно oldNewestMessage
                    // removeFromMatch возвращает только сообщения НОВЕЕ oldNewestMessage
                    newMessages = chat.removeFromMatch(actualMessages, oldNewestMessage);
                    // Объединяем: новые спереди (они ещё не отправлены), старые сзади (часть уже отправлена)
                    resultMessages = [...newMessages, ...oldMessages];
                }

                await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);

                if (notification && resultMessages.length > 50) {
                    await CommonHelperBackground.sendTelegramMessage('Отправляем все сообщения со страницы');
                }

                // Отправляем сообщения из очереди по одному, начиная с самого старого (с конца массива)
                while (notification && resultMessages.length >= 1) {
                    if (resultMessages.length == 1 && resultMessages[0] !== undefined) {
                        // Последний (и самый новый) элемент — отправляем только если ещё не был отправлен
                        if (resultMessages[0].sended == true) {
                            break;
                        }

                        resultMessages[0].sended = true;
                        await chat.sendMessagesToTelegram(resultMessages[0]);
                        await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);
                        break;
                    }

                    // Вырезаем последний (самый старый) элемент и отправляем его
                    const lastElement = resultMessages.pop();

                    if (lastElement.sended != true) {
                        await chat.sendMessagesToTelegram(lastElement);
                    }

                    // Сохраняем после каждой отправки, чтобы не потерять прогресс при сбое
                    await CommonHelperBackground.setExtStorage('wor_chat_message_queue', resultMessages);
                }

                CommonHelperBackground.log("Всё отправили.");
            })();

        });

    } catch (err) {
        CommonHelperBackground.log('Ошибка при поиске вкладки:' + JSON.stringify(err));
    }
}
