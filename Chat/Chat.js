class Chat {
    isChatPage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    async #checkCurrentPage() {
        this.isChatPage = document.querySelector('#msg_box') !== null;
    }

    getParsedMessages() {
        // Получаем все div'ы с id "msg_box"
        let msgBoxes = document.querySelectorAll("div#msg_box");

        let messages = [];

        msgBoxes.forEach(msgBox => {
            // Разбиваем содержимое <div> по <br>
            let parts = msgBox.innerHTML.split("<br>");

            parts.forEach(part => {
                // Создаём временный div для проверки содержимого
                let tempDiv = document.createElement("div");
                tempDiv.innerHTML = part.trim();

                // Проверяем, есть ли внутри элемент с классом "navigation"
                if (tempDiv.querySelector(".navigation")) {
                    return; // Пропускаем итерацию
                }

                // Если контент не пустой, добавляем в messages
                if (tempDiv.innerHTML !== "") {
                    messages.push(tempDiv);
                }
            });
        });

        let pureTexts = messages.map(element => {
            // Проверяем, есть ли в элементе дочерний элемент с классом "svet"
            let isSystem = element.querySelector(".svet") !== null;

            // Извлекаем текст из текстовых узлов и элементов с innerText + смайлы
            let extractedText = Array.from(element.childNodes)
                .map(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.nodeValue.trim();
                    }
                    else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList.contains('contur')) {
                            return '';
                        }
                        // Проверяем, является ли элемент ссылкой <a> со смайлом <img>
                        let smileImg = node.querySelector("img");
                        if (smileImg && node.hasAttribute("onclick")) {
                            // Извлекаем идентификатор смайла из onclick
                            let match = node.getAttribute("onclick").match(/'(.+?)'/);
                            if (match) {
                                return match[1].trim(); // Добавляем идентификатор смайла
                            }
                        }

                        // В остальных случаях просто берём текст элемента
                        return node.innerText.trim();
                    }
                    return "";
                })
                .filter(text => text.length > 0) // Исключаем пустые строки
                .join(" "); // Объединяем в строку

            // Добавляем "system" или "chat" в начало строки
            return (isSystem ? "system" : "chat") + " " + extractedText;
        });

        let parsedMessages = pureTexts.map(msg => {
            // Разбиваем строку на части
            let parts = msg.split(/\s+/); // Разделяем по пробелам

            // Определяем тип (первое слово в строке)
            let type = parts.shift(); // "system" или "chat"

            // Вытаскиваем время (оно всегда в формате HH:MM:SS)
            let time = parts.shift();
            let DateTime = luxon.DateTime;
            let date = DateTime.now().setZone("Europe/Kyiv").toFormat('yyyy-MM-dd');
            time = date + ' ' + time

            // Остальную часть склеиваем обратно в строку
            let remainingText = parts.join(" ");

            let from = "system"; // По умолчанию для "system"
            let to = "";
            let text = remainingText; // Пока считаем, что весь остаток — это текст

            // Если это "chat", то парсим from и to
            if (type === "chat") {
                let match = remainingText.match(/^(.*?):\s*(.*?)$/); // Регулярка для поиска "Игрок: текст" или "Игрок для Игрок2: текст"
                if (match) {
                    from = match[1]; // Игрок, который отправил сообщение
                    text = match[2]; // Оставшийся текст

                    // Проверяем, есть ли "для {игрок}" внутри from
                    let toMatch = from.match(/(.*?)\s+для\s+(.*)/);
                    if (toMatch) {
                        from = toMatch[1].trim(); // Исправляем имя отправителя
                        to = toMatch[2].trim(); // Имя получателя
                    }
                }
            }

            return { type, time, from, to, text };
        });

        return parsedMessages;
    }

    async sendMessagesToTelegram(messages) {
        const { DateTime } = luxon;

        // Сортируем от старых к новым
        messages.sort((a, b) => DateTime.fromSQL(a.time) - DateTime.fromSQL(b.time));

        // Получаем последнее отправленное сообщение
        const lastMsgKey = 'wor_chat_last_telegram_msg';
        const lastMsgRaw = await new Promise(resolve => {
            chrome.storage.local.get(lastMsgKey, data => {
                resolve(data[lastMsgKey] || null);
            });
        });

        let lastMsgFound = false;
        let messagesToSend = [];

        for (const msg of messages) {
            const msgStr = JSON.stringify(msg);
            if (lastMsgRaw && !lastMsgFound) {
                if (msgStr === lastMsgRaw) {
                    lastMsgFound = true;
                }
                continue;
            }
            if (lastMsgFound || !lastMsgRaw) {
                messagesToSend.push(msg);
            }
        }

        if (messages.length > 0) {
            const lastMsgStr = JSON.stringify(messages[messages.length - 1]);
            CommonHelper.setExtStorage(lastMsgKey, lastMsgStr);
        }

        for (const msg of messagesToSend) {
            let isToMe = false;
            let playerName = await CommonHelper.getExtStorage('wor_chat_player_name');

            if (playerName) {
                isToMe = msg.to && msg.to.toLowerCase().includes(playerName.toLowerCase());
            }

            const escape = (text) => text
                .replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

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
            await CommonHelper.delay(100);
        }
    }
}