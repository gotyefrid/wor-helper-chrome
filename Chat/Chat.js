class Chat {
    isChatPage = false;

    constructor() {
        this.#checkCurrentPage();

    }

    async #checkCurrentPage() {
        this.isChatPage = document.querySelector('#msg_box') !== null;
    }

    logMessages() {
        const STORAGE_KEY = "wor_chat_logs";
        const MAX_MESSAGES = 1000; // Лимит перед выгрузкой

        let messages = getParsedMessages(); // Получаем ВСЕ сообщения на странице
        if (!messages || messages.length === 0) return; // Если нет сообщений, выходим

        let storedLogs = JSON.parse(CommonHelper.getLocalStorage(STORAGE_KEY)) || [];

        // Определяем самое новое сообщение в `localStorage`
        let latestStoredTime = storedLogs.length > 0
            ? Math.max(...storedLogs.map(log => new Date(log.time).getTime()))
            : 0; // Если `localStorage` пуст, устанавливаем 0

        if (latestStoredTime) {
            // Фильтруем новые сообщения, чтобы добавлять только те, которые ПОСЛЕ последнего сохранённого
            messages = messages.filter(msg => {
                let msgTime = new Date(msg.time).getTime(); // Преобразуем дату в миллисекунды
                return msgTime > latestStoredTime; // Добавляем только те, что новее
            });
        }

        if (messages.length === 0) {
            CommonHelper.log("Нет новых сообщений для сохранения.", false);
            return; // Если новых сообщений нет, выходим
        }

        storedLogs.push(...messages); // Добавляем только новые сообщения

        if (storedLogs.length > MAX_MESSAGES) {
            saveLogsToFile(storedLogs); // Выгружаем файл
            storedLogs = [storedLogs[storedLogs.length - 1]]; // Оставляем последнее сообщение
        }

        CommonHelper.setLocalStorage(STORAGE_KEY, JSON.stringify(storedLogs)); // Обновляем хранилище
    }

    saveLogsToFile(logs) {
        // Сортируем по времени (от меньшего к большему)
        logs.sort((a, b) => {
            let t1 = a.time.split(":").map(Number);
            let t2 = b.time.split(":").map(Number);
            return (t1[0] * 3600 + t1[1] * 60 + t1[2]) - (t2[0] * 3600 + t2[1] * 60 + t2[2]);
        });

        const logText = logs.map(log =>
            `[${log.time}] ${log.from} -> ${log.to}: ${log.text}`
        ).join("\n");

        const blob = new Blob([logText], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `chat_log_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        CommonHelper.log(`Лог сохранён и отсортирован по ВОЗРАСТАНИЮ времени. Сохранено ${logs.length} сообщений.`, false);
    }

    isMessageHasAlreadySent(text) {
        let lastStoredMessage = CommonHelper.getLocalStorage("lastPrivateMessage");

        if (lastStoredMessage && text.toString() == lastStoredMessage.toString()) {
            CommonHelper.log(`Сообщение "${text}" уже было отправлено ранее`, false);
            return true;
        }

        return false;
    }


    async processLastPrivateMessage() {
        let lastMessageToMe = getLastPrivateMessage();

        if (!lastMessageToMe) {
            return;
        };

        let messageText = `ЛС: ${lastMessageToMe.time} | От: ${lastMessageToMe.from} | ${lastMessageToMe.text}`;

        if (!isMessageHasAlreadySent(messageText)) {
            CommonHelper.log('Есть новое сообщение, отправляем в ТГ');
            await delay(1000);

            sendTelegramMessage(messageText);
            CommonHelper.setLocalStorage("lastPrivateMessage", messageText);
        }
    }

    async getLastPrivateMessage() {
        let messages = getParsedMessages(); // Получаем массив сообщений

        let playerName = await CommonHelper.getExtStorage('wor_chat_player_name');

        if (playerName) {
            // Находим первое сообщение, адресованное игроку и не являющееся системой
            let foundMessage = messages.find(msg => msg.to.includes(playerName) && msg.type !== "system");

            return foundMessage || null; // Если найдено, возвращаем его, иначе null
        }

        return null;
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