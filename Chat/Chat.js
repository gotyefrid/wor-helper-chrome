class Chat {
    isChatPage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    async #checkCurrentPage() {
        this.isChatPage = document.querySelector('#msg_box') !== null;
    }

    static getParsedMessages(msgBox = null) {
        if (!msgBox) {
            // Получаем div id "msg_box"
            msgBox = document.querySelector("div#msg_box");
        }

        const params = new URLSearchParams(window.location.search);
        const strParam = params.get('str');
        const mymessParam = params.get('mymess');
        const str = parseFloat(strParam);

        if (mymessParam !== null || (strParam !== null && str >= 2)
        ) {
            CommonHelper.log('Мы не первой странице общего чата, а значит не актуальные сообщения не добавляем');
            return [];
        }

        let messages = [];

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

        let pureTexts = messages.map(element => {
            // Проверяем, есть ли в элементе дочерний элемент с классом "svet"
            let isSystem = element.querySelector(".svet") !== null;

            // Извлекаем текст из текстовых узлов и элементов с innerText + смайлы
            let extractedText = Array.from(element.childNodes)
                .map(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.nodeValue.trim();
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
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

            /**
             * Берёт строку "HH:MM:SS", приклеивает к ней today,
             * парсит и, если получилось позже текущего момента —
             * отнимает один день.
             */
            function attachDate(timeStr) {
                const zone = 'Europe/Kyiv';
                const now = DateTime.now().setZone(zone).plus({seconds: 2});
                const today = now.toFormat('yyyy-MM-dd');
                const parseFormat = 'yyyy-MM-dd HH:mm:ss';

                // 1) склеиваем дату + время
                let dt = DateTime.fromFormat(`${today} ${timeStr}`, parseFormat, {zone});

                // 2) если получилось > «сейчас», то это вчерашний день
                if (dt > now) {
                    dt = dt.minus({days: 1});
                }

                return dt.toFormat(parseFormat);
            }

            // Вытаскиваем время (оно всегда в формате HH:MM:SS)
            let time = parts.shift();
            let DateTime = luxon.DateTime;
            time = attachDate(time);

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

            return {type, time, from, to, text};
        });

        return parsedMessages;
    }

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